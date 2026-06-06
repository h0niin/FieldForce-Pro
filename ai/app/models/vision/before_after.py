from __future__ import annotations

import io
import logging
from typing import Any

logger = logging.getLogger(__name__)

try:
    from PIL import Image
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    from skimage.metrics import structural_similarity as ssim
    SKIMAGE_AVAILABLE = True
except ImportError:
    SKIMAGE_AVAILABLE = False


class BeforeAfterComparator:
    """Compare before and after images to verify work completion."""

    def __init__(self) -> None:
        self.available = PIL_AVAILABLE

    def compare(
        self,
        before_bytes: bytes,
        after_bytes: bytes,
        work_order_id: str = "",
    ) -> dict:
        """Compare before and after images."""
        if not PIL_AVAILABLE:
            return self._placeholder_result("PIL not available for image processing")

        try:
            before_img = Image.open(io.BytesIO(before_bytes)).convert("RGB")
            after_img = Image.open(io.BytesIO(after_bytes)).convert("RGB")

            # Resize to same dimensions for comparison
            target_size = (min(before_img.width, after_img.width, 640),
                          min(before_img.height, after_img.height, 480))
            before_resized = before_img.resize(target_size)
            after_resized = after_img.resize(target_size)

            before_arr = np.array(before_resized, dtype=float)
            after_arr = np.array(after_resized, dtype=float)

            # 1. Mean Absolute Difference
            pixel_diff = np.mean(np.abs(before_arr - after_arr))
            change_percentage = round(pixel_diff / 255.0 * 100, 2)

            # 2. Color histogram comparison
            color_similarity = self._compare_histograms(before_arr, after_arr)

            # 3. Structural similarity (if skimage available)
            ssim_score = 0.0
            if SKIMAGE_AVAILABLE:
                before_gray = np.mean(before_arr, axis=2)
                after_gray = np.mean(after_arr, axis=2)
                ssim_score = float(ssim(before_gray, after_gray))

            # 4. Region-based change detection
            regions = self._detect_change_regions(before_arr, after_arr)

            # Determine if significant changes occurred
            significant_change = change_percentage > 5.0 or (SKIMAGE_AVAILABLE and ssim_score < 0.85)

            return {
                "work_order_id": work_order_id,
                "significant_change": significant_change,
                "change_percentage": change_percentage,
                "similarity_score": round(1.0 - change_percentage / 100, 3),
                "ssim_score": round(ssim_score, 3) if SKIMAGE_AVAILABLE else None,
                "color_similarity": round(color_similarity, 3),
                "changed_regions": regions,
                "before_size": {"width": before_img.width, "height": before_img.height},
                "after_size": {"width": after_img.width, "height": after_img.height},
                "analysis": self._generate_analysis(change_percentage, ssim_score, regions),
            }

        except Exception as e:
            logger.error("Before/after comparison error: %s", e)
            return self._placeholder_result(f"Comparison error: {str(e)}")

    def _compare_histograms(self, img1: Any, img2: Any) -> float:
        """Compare color histograms of two images."""
        try:
            similarity = 0.0
            for channel in range(3):
                hist1, _ = np.histogram(img1[:, :, channel].flatten(), bins=64, range=(0, 256))
                hist2, _ = np.histogram(img2[:, :, channel].flatten(), bins=64, range=(0, 256))
                # Normalize
                hist1 = hist1.astype(float) / hist1.sum()
                hist2 = hist2.astype(float) / hist2.sum()
                # Intersection similarity
                similarity += float(np.minimum(hist1, hist2).sum())
            return similarity / 3.0
        except Exception:
            return 0.0

    def _detect_change_regions(self, before: Any, after: Any, grid_size: int = 4) -> list[dict]:
        """Detect regions with significant changes using a grid approach."""
        try:
            h, w = before.shape[:2]
            cell_h = h // grid_size
            cell_w = w // grid_size
            regions = []

            for i in range(grid_size):
                for j in range(grid_size):
                    y1, y2 = i * cell_h, (i + 1) * cell_h
                    x1, x2 = j * cell_w, (j + 1) * cell_w

                    before_region = before[y1:y2, x1:x2]
                    after_region = after[y1:y2, x1:x2]

                    diff = float(np.mean(np.abs(before_region - after_region)))
                    change_pct = diff / 255.0 * 100

                    if change_pct > 10.0:
                        regions.append({
                            "grid_position": [i, j],
                            "bbox": [x1, y1, x2, y2],
                            "change_percentage": round(change_pct, 2),
                            "significance": "high" if change_pct > 30 else "medium",
                        })

            return sorted(regions, key=lambda r: r["change_percentage"], reverse=True)
        except Exception:
            return []

    def _generate_analysis(self, change_pct: float, ssim_score: float, regions: list) -> str:
        """Generate human-readable analysis."""
        if change_pct < 2.0:
            return "Minimal changes detected. Images appear nearly identical."
        elif change_pct < 10.0:
            return f"Minor changes detected ({change_pct:.1f}% difference). {len(regions)} region(s) affected."
        elif change_pct < 30.0:
            return f"Moderate changes detected ({change_pct:.1f}% difference). {len(regions)} region(s) with significant changes."
        else:
            return f"Significant changes detected ({change_pct:.1f}% difference). {len(regions)} region(s) substantially modified."

    def _placeholder_result(self, message: str) -> dict:
        return {
            "significant_change": False,
            "change_percentage": 0.0,
            "similarity_score": 0.0,
            "ssim_score": None,
            "color_similarity": 0.0,
            "changed_regions": [],
            "analysis": message,
        }
