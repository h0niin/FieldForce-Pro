import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Layout, Alert, Button } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import { TrialBanner } from './TrialBanner';
import { UpgradeWall } from './UpgradeWall';
import { useUiStore } from '@/store/ui.store';
import { useTranslation } from 'react-i18next';
import { useMyTenantStatus } from '@/hooks/use-tenants';

const { Content } = Layout;

// Error boundary to protect layout from page crashes
class PageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PageErrorBoundary] Caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          type="error"
          showIcon
          message="This page encountered an error" // Error boundary - class component, cannot use hooks
          description={
            <div>
              <p>{this.state.error?.message}</p>
              <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.stack}
              </pre>
              <Button
                type="primary"
                size="small"
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{ marginTop: 8 }}
              >
                Try Again
              </Button>
            </div>
          }
        />
      );
    }
    return this.props.children;
  }
}

import OnboardingWizard from '../onboarding/OnboardingWizard';

export default function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const { data: tenantStatus } = useMyTenantStatus();

  // Show blocking upgrade wall for expired/suspended tenants
  const isBlocked =
    tenantStatus &&
    (tenantStatus.subscription_status === 'expired' ||
      tenantStatus.subscription_status === 'suspended' ||
      !tenantStatus.is_active);

  if (isBlocked) {
    return <UpgradeWall />;
  }

  return (
    <Layout style={{ minHeight: '100vh', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Sidebar />
      <Layout style={{
        marginLeft: isRtl ? 0 : (collapsed ? 80 : 260),
        marginRight: isRtl ? (collapsed ? 80 : 260) : 0,
        transition: 'margin 0.2s'
      }}>
        {/* Trial banner sits above the header */}
        {tenantStatus && (
          <TrialBanner
            subscriptionStatus={tenantStatus.subscription_status}
            subscriptionEnd={tenantStatus.subscription_end}
          />
        )}
        <Header />
        <Content style={{ margin: 0, transition: 'background-color 0.2s' }}>
          <div style={{ padding: 24 }}>
            <Breadcrumb />
            <PageErrorBoundary>
              <Outlet />
            </PageErrorBoundary>
          </div>
        </Content>
      </Layout>
      <OnboardingWizard />
    </Layout>
  );
}
