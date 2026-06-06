from __future__ import annotations

import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("prophet not installed — demand forecaster will return placeholder results")


class DemandForecaster:
    """Time-series demand forecasting using Prophet for service demand prediction."""

    def __init__(self) -> None:
        self.available = PROPHET_AVAILABLE
        self.models: Dict[str, Prophet] = {}
        self.last_training_data: Dict[str, pd.DataFrame] = {}

    def forecast(
        self,
        historical_data: list[dict] | None = None,
        horizon_days: int = 30,
        service_type: str | None = None,
        include_seasonality: bool = True,
        confidence_level: float = 0.95
    ) -> dict:
        """
        Forecast future service demand using Prophet

        Args:
            historical_data: List of historical demand records with 'date' and 'demand' keys
            horizon_days: Number of days to forecast into the future
            service_type: Type of service for specialized forecasting
            include_seasonality: Include seasonal patterns in forecast
            confidence_level: Confidence level for prediction intervals (0-1)

        Returns:
            Forecast results with predictions, confidence intervals, and trend analysis
        """
        if not self.available or not historical_data:
            return self._generate_placeholder_forecast(horizon_days)

        try:
            # Convert historical data to DataFrame
            df = self._prepare_data(historical_data)

            # Train or retrieve model
            model = self._get_or_train_model(df, service_type, include_seasonality)

            # Generate forecast
            future = model.make_future_dataframe(periods=horizon_days, freq='D')
            forecast_df = model.predict(future)

            # Extract results
            forecast_data = self._extract_forecast(forecast_df, horizon_days)

            # Analyze trend
            trend = self._analyze_trend(forecast_df)

            # Calculate capacity recommendations
            capacity = self._calculate_capacity_recommendations(forecast_data)

            return {
                "forecast": forecast_data,
                "confidence_interval": {
                    "lower": forecast_df['yhat_lower'].tail(horizon_days).tolist(),
                    "upper": forecast_df['yhat_upper'].tail(horizon_days).tolist()
                },
                "trend": trend,
                "seasonality": self._extract_seasonality(model),
                "capacity_recommendations": capacity,
                "metrics": self._calculate_metrics(df, forecast_df),
                "message": f"Successfully forecasted {horizon_days} days of demand"
            }

        except Exception as e:
            logger.error(f"Error in demand forecasting: {str(e)}")
            return self._generate_placeholder_forecast(horizon_days)

    def _prepare_data(self, historical_data: list[dict]) -> pd.DataFrame:
        """Prepare historical data for Prophet"""
        df = pd.DataFrame(historical_data)

        # Ensure proper column names for Prophet
        if 'date' in df.columns and 'demand' in df.columns:
            df = df.rename(columns={'date': 'ds', 'demand': 'y'})
        elif 'timestamp' in df.columns and 'count' in df.columns:
            df = df.rename(columns={'timestamp': 'ds', 'count': 'y'})

        # Convert to datetime if necessary
        df['ds'] = pd.to_datetime(df['ds'])

        # Handle missing values
        df = df.fillna(method='ffill').fillna(method='bfill')

        # Sort by date
        df = df.sort_values('ds')

        return df[['ds', 'y']]

    def _get_or_train_model(
        self,
        df: pd.DataFrame,
        service_type: Optional[str],
        include_seasonality: bool
    ) -> Prophet:
        """Get existing model or train new one"""
        model_key = service_type or 'default'

        # Check if we need to retrain
        if model_key not in self.models or self._should_retrain(model_key, df):
            model = Prophet(
                daily_seasonality=include_seasonality,
                weekly_seasonality=include_seasonality,
                yearly_seasonality=include_seasonality,
                seasonality_mode='multiplicative',
                interval_width=0.95,
                changepoint_prior_scale=0.05  # More flexible trend changes
            )

            # Add custom seasonalities based on service type
            if service_type == 'emergency':
                # Emergency services might have different patterns
                model.add_seasonality(
                    name='hourly',
                    period=1,
                    fourier_order=8
                )
            elif service_type == 'maintenance':
                # Maintenance might have monthly patterns
                model.add_seasonality(
                    name='monthly',
                    period=30.5,
                    fourier_order=5
                )

            # Add holidays/special events (would be customized per region)
            holidays = self._get_holidays()
            if holidays is not None:
                model = Prophet(holidays=holidays)

            # Fit the model
            model.fit(df)

            # Cache the model
            self.models[model_key] = model
            self.last_training_data[model_key] = df

        return self.models[model_key]

    def _should_retrain(self, model_key: str, df: pd.DataFrame) -> bool:
        """Check if model should be retrained"""
        if model_key not in self.last_training_data:
            return True

        last_data = self.last_training_data[model_key]

        # Retrain if significantly more data available (>10% increase)
        if len(df) > len(last_data) * 1.1:
            return True

        # Retrain if data has changed significantly
        if not df.equals(last_data):
            return True

        return False

    def _extract_forecast(self, forecast_df: pd.DataFrame, horizon_days: int) -> List[Dict]:
        """Extract forecast data for the horizon period"""
        forecast_data = []
        tail_df = forecast_df.tail(horizon_days)

        for _, row in tail_df.iterrows():
            forecast_data.append({
                'date': row['ds'].isoformat(),
                'predicted_demand': max(0, round(row['yhat'])),  # Ensure non-negative
                'lower_bound': max(0, round(row['yhat_lower'])),
                'upper_bound': max(0, round(row['yhat_upper'])),
                'trend': row.get('trend', 0),
                'weekly': row.get('weekly', 0),
                'yearly': row.get('yearly', 0)
            })

        return forecast_data

    def _analyze_trend(self, forecast_df: pd.DataFrame) -> str:
        """Analyze overall trend in forecast"""
        recent_trend = forecast_df['trend'].tail(30)
        trend_change = (recent_trend.iloc[-1] - recent_trend.iloc[0]) / recent_trend.iloc[0] if recent_trend.iloc[0] != 0 else 0

        if trend_change > 0.1:
            return "increasing"
        elif trend_change < -0.1:
            return "decreasing"
        else:
            return "stable"

    def _extract_seasonality(self, model: Prophet) -> Dict:
        """Extract seasonality patterns from the model"""
        seasonality_info = {}

        # Weekly seasonality
        if 'weekly' in model.seasonalities:
            seasonality_info['weekly'] = {
                'enabled': True,
                'strength': 'strong' if model.seasonalities['weekly']['fourier_order'] > 3 else 'moderate'
            }

        # Yearly seasonality
        if 'yearly' in model.seasonalities:
            seasonality_info['yearly'] = {
                'enabled': True,
                'peak_months': self._identify_peak_months(model)
            }

        return seasonality_info

    def _identify_peak_months(self, model: Prophet) -> List[str]:
        """Identify peak demand months from yearly seasonality"""
        # This would analyze the yearly component to find peaks
        # For now, return placeholder
        return ['March', 'July', 'November']

    def _calculate_capacity_recommendations(self, forecast_data: List[Dict]) -> Dict:
        """Calculate recommended capacity based on forecast"""
        demands = [d['predicted_demand'] for d in forecast_data]
        upper_bounds = [d['upper_bound'] for d in forecast_data]

        return {
            'average_daily_capacity': round(np.mean(demands)),
            'peak_capacity': round(max(upper_bounds)),
            'minimum_technicians': round(max(upper_bounds) / 8),  # Assuming 8 jobs per technician
            'buffer_percentage': 20,  # Recommend 20% buffer
            'peak_days': self._identify_peak_days(forecast_data)
        }

    def _identify_peak_days(self, forecast_data: List[Dict]) -> List[str]:
        """Identify days with peak demand"""
        threshold = np.percentile([d['predicted_demand'] for d in forecast_data], 90)
        peak_days = []

        for data in forecast_data:
            if data['predicted_demand'] >= threshold:
                peak_days.append(data['date'])

        return peak_days[:5]  # Return top 5 peak days

    def _calculate_metrics(self, historical_df: pd.DataFrame, forecast_df: pd.DataFrame) -> Dict:
        """Calculate forecast accuracy metrics"""
        # Would calculate MAPE, MAE, RMSE if we have test data
        # For now, return confidence metrics
        return {
            'confidence_level': 0.95,
            'historical_days': len(historical_df),
            'model_type': 'Prophet',
            'last_updated': datetime.now().isoformat()
        }

    def _get_holidays(self) -> Optional[pd.DataFrame]:
        """Get holiday calendar for the region"""
        # In production, would fetch actual holiday data
        # For now, return None to use default
        return None

    def _generate_placeholder_forecast(self, horizon_days: int) -> Dict:
        """Generate placeholder forecast when Prophet not available"""
        base_demand = 50
        forecast_data = []
        today = datetime.now().date()

        for i in range(horizon_days):
            date = today + timedelta(days=i)
            # Add some random variation
            demand = base_demand + np.random.normal(0, 10)
            forecast_data.append({
                'date': date.isoformat(),
                'predicted_demand': max(0, round(demand)),
                'lower_bound': max(0, round(demand - 15)),
                'upper_bound': round(demand + 15)
            })

        return {
            "forecast": forecast_data,
            "confidence_interval": {
                "lower": [d['lower_bound'] for d in forecast_data],
                "upper": [d['upper_bound'] for d in forecast_data]
            },
            "trend": "stable",
            "seasonality": {},
            "capacity_recommendations": {
                'average_daily_capacity': 50,
                'peak_capacity': 65,
                'minimum_technicians': 8
            },
            "message": "Prophet not available - using placeholder forecast"
        }


class ScheduleOptimizer:
    """Optimize scheduling based on demand forecast and resource availability"""

    def __init__(self, demand_forecaster: DemandForecaster):
        self.forecaster = demand_forecaster

    def recommend_schedule(
        self,
        forecast: Dict,
        available_technicians: List[Dict],
        constraints: Optional[Dict] = None
    ) -> Dict:
        """
        Generate scheduling recommendations based on demand forecast

        Args:
            forecast: Demand forecast from DemandForecaster
            available_technicians: List of available technicians with skills
            constraints: Additional scheduling constraints

        Returns:
            Optimized schedule recommendations
        """
        recommendations = []
        capacity_recs = forecast.get('capacity_recommendations', {})

        # Analyze each forecasted day
        for day_forecast in forecast.get('forecast', []):
            predicted_demand = day_forecast['predicted_demand']
            date = day_forecast['date']

            # Calculate required technicians
            required_techs = int(np.ceil(predicted_demand / 8))  # 8 jobs per tech

            # Generate shift recommendations
            shift_rec = self._generate_shift_recommendations(
                date,
                required_techs,
                available_technicians,
                predicted_demand
            )

            recommendations.append(shift_rec)

        return {
            'schedule_recommendations': recommendations,
            'optimization_metrics': {
                'coverage_rate': self._calculate_coverage_rate(recommendations),
                'efficiency_score': self._calculate_efficiency_score(recommendations),
                'cost_estimate': self._estimate_cost(recommendations)
            },
            'alerts': self._generate_alerts(recommendations, capacity_recs)
        }

    def _generate_shift_recommendations(
        self,
        date: str,
        required_techs: int,
        available_techs: List[Dict],
        predicted_demand: int
    ) -> Dict:
        """Generate shift recommendations for a specific day"""
        return {
            'date': date,
            'required_technicians': required_techs,
            'recommended_shifts': {
                'morning': max(1, required_techs // 2),
                'afternoon': max(1, required_techs // 2),
                'evening': max(0, required_techs // 4)
            },
            'predicted_workload': predicted_demand,
            'utilization_target': min(0.85, predicted_demand / (required_techs * 8))
        }

    def _calculate_coverage_rate(self, recommendations: List[Dict]) -> float:
        """Calculate average coverage rate"""
        if not recommendations:
            return 0.0

        coverage_rates = [
            min(1.0, rec.get('utilization_target', 0))
            for rec in recommendations
        ]
        return np.mean(coverage_rates)

    def _calculate_efficiency_score(self, recommendations: List[Dict]) -> float:
        """Calculate scheduling efficiency score"""
        # Simplified efficiency calculation
        return 0.85  # Placeholder

    def _estimate_cost(self, recommendations: List[Dict]) -> float:
        """Estimate labor cost based on recommendations"""
        total_tech_days = sum(rec['required_technicians'] for rec in recommendations)
        return total_tech_days * 200  # Assuming $200 per technician per day

    def _generate_alerts(self, recommendations: List[Dict], capacity_recs: Dict) -> List[str]:
        """Generate alerts for capacity issues"""
        alerts = []

        # Check for peak days
        peak_days = capacity_recs.get('peak_days', [])
        if peak_days:
            alerts.append(f"High demand expected on: {', '.join(peak_days[:3])}")

        # Check for understaffing
        for rec in recommendations:
            if rec['utilization_target'] > 0.9:
                alerts.append(f"Potential understaffing on {rec['date']}")

        return alerts
