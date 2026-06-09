import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { useAuthStore } from '@/store/auth.store';
import {
  DashboardOutlined,
  UserOutlined,
  CompassOutlined,
  TeamOutlined,
  ContactsOutlined,
  BankOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  ScheduleOutlined,
  ToolOutlined,
  DollarOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
  ThunderboltFilled,
  TagsOutlined,
  FileDoneOutlined,
  StarOutlined,
  MessageOutlined,
  FormOutlined,
  ApartmentOutlined,
  ApiOutlined,
  CustomerServiceOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  MobileOutlined,
  CrownOutlined,
  KeyOutlined,
  DesktopOutlined,
  LineChartOutlined,
  BellOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/ui.store';
import { usePermission } from '@/components/permissions/usePermission';
import './Sidebar.css';

const { Sider } = Layout;

interface MenuChildItem {
  key: string;
  labelKey: string;
  permission?: string;
}

interface MenuItem {
  key: string;
  icon: JSX.Element;
  labelKey: string;
  badge?: number;
  permission?: string;
  children?: MenuChildItem[];
}

interface MenuSection {
  section?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    section: 'sidebar.mainNavigation',
    items: [
      { key: '/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      // { key: '/dashboard/live-map', icon: <EnvironmentOutlined />, labelKey: 'Live Map' },
    ],
  },
  {
    section: 'sidebar.customerManagement',
    items: [
      { key: '/contacts', icon: <ContactsOutlined />, labelKey: 'nav.contacts', permission: 'contacts:read' },
      { key: '/companies', icon: <BankOutlined />, labelKey: 'nav.companies', permission: 'companies:read' },
      { key: '/service-locations', icon: <EnvironmentOutlined />, labelKey: 'nav.serviceLocations', permission: 'service_locations:read' },
      { key: '/assets', icon: <ToolOutlined />, labelKey: 'nav.assets', permission: 'assets:read' },
    ],
  },
  {
    section: 'sidebar.operations',
    items: [
      { key: '/service-requests', icon: <FileTextOutlined />, labelKey: 'nav.serviceRequests', permission: 'service_requests:read' },
      { key: '/estimates', icon: <CalculatorOutlined />, labelKey: 'nav.estimates', permission: 'estimates:read' },
      { key: '/work-orders', icon: <ScheduleOutlined />, labelKey: 'nav.workOrders', permission: 'work_orders:read' },
      { key: '/slas', icon: <ClockCircleOutlined />, labelKey: 'nav.slaPolicies', permission: 'settings:read' },
    ],
  },
  {
    section: 'sidebar.schedulingWorkforce',
    items: [
      {
        key: 'scheduling-submenu',
        icon: <CalendarOutlined />,
        labelKey: 'nav.scheduling',
        permission: 'scheduling:read',
        children: [
          { key: '/scheduling', labelKey: 'sidebar.dispatchBoard' },
          { key: '/scheduling/calendar', labelKey: 'sidebar.calendarView' },
          { key: '/scheduling/map', labelKey: 'sidebar.mapView' },
          { key: '/scheduling/territories', labelKey: 'Territories' },
        ],
      },
      { key: '/job-sheets', icon: <FormOutlined />, labelKey: 'nav.jobSheets', permission: 'job_sheets:read' },
      // { key: '/timesheets', icon: <ClockCircleOutlined />, labelKey: 'nav.timesheets', permission: 'timesheets:read' },
      // { key: '/workforce', icon: <TeamOutlined />, labelKey: 'nav.workforce', permission: 'workforce:read' },
      { key: '/trips/history', icon: <CompassOutlined />, labelKey: 'sidebar.tripHistory', permission: 'trips:read' },
    ],
  },
  {
    section: 'sidebar.financial',
    items: [
      { key: '/invoices', icon: <DollarOutlined />, labelKey: 'nav.invoices', permission: 'invoices:read' },
      { key: '/payments', icon: <CreditCardOutlined />, labelKey: 'nav.payments', permission: 'payments:read' },
      // {
      //   key: 'agreements-submenu',
      //   icon: <FileDoneOutlined />,
      //   labelKey: 'nav.agreements',
      //   permission: 'service_agreements:read',
      //   children: [
      //     { key: '/agreements', labelKey: 'Service Agreements' },
      //     { key: '/agreements/sla-compliance', labelKey: 'SLA Compliance' },
      //   ],
      // },
    ],
  },
  {
    section: 'sidebar.catalogPricing',
    items: [
      {
        key: 'catalog-submenu',
        icon: <ToolOutlined />,
        labelKey: 'nav.catalog',
        permission: 'services_catalog:read',
        children: [
          { key: '/catalog/services', labelKey: 'nav.servicesCatalog', permission: 'services_catalog:read' },
          { key: '/catalog/parts', labelKey: 'nav.partsCatalog', permission: 'parts_catalog:read' },
        ],
      },
      // { key: '/pricebook', icon: <TagsOutlined />, labelKey: 'nav.pricebook', permission: 'pricebook:read' },
    ],
  },
  {
    section: 'sidebar.customerEngagement',
    items: [
      { key: '/reviews', icon: <StarOutlined />, labelKey: 'nav.reviews', permission: 'reviews:read' },
      // { key: '/communications', icon: <MessageOutlined />, labelKey: 'nav.communications', permission: 'communications:read' },
      // { key: '/webforms', icon: <FormOutlined />, labelKey: 'nav.webforms', permission: 'webforms:read' },
      // { key: '/portal', icon: <CustomerServiceOutlined />, labelKey: 'Customer Portal', permission: 'portal:read' },
    ],
  },
  {
    section: 'sidebar.approvalWorkflow',
    items: [
      {
        key: 'workflow-submenu',
        icon: <AuditOutlined />,
        labelKey: 'sidebar.approvalWorkflow',
        permission: 'workflow_templates:read',
        children: [
          // { key: '/workflow/dashboard', labelKey: 'Dashboard' },
          { key: '/workflow/templates', labelKey: 'sidebar.workflowTemplates' },
          { key: '/workflow/document-approvals', labelKey: 'sidebar.documentApprovals' },
        ],
      },
    ],
  },
  // {
  //   section: 'Automation & Customization',
  //   items: [
  //     // { key: '/blueprints', icon: <ApartmentOutlined />, labelKey: 'nav.blueprints', permission: 'blueprint_definitions:read' },
  //     {
  //       key: 'customization-submenu',
  //       icon: <ApiOutlined />,
  //       labelKey: 'nav.customization',
  //       permission: 'custom_fields:read',
  //       children: [
  //         { key: '/customization/custom-fields', labelKey: 'nav.customFields', permission: 'custom_fields:read' },
  //         { key: '/customization/templates', labelKey: 'nav.templates', permission: 'templates:read' },
  //         { key: '/customization/workflow-rules', labelKey: 'nav.workflowRules', permission: 'workflow_rules:read' },
  //         { key: '/customization/webhooks', labelKey: 'nav.webhooks', permission: 'webhooks:read' },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   section: 'AI & Intelligence',
  //   items: [
  //     { key: '/maintenance/health-dashboard', icon: <ToolOutlined />, labelKey: 'Equipment Health', permission: 'iot_data:read' },
  //     { key: '/documents/ai', icon: <FileTextOutlined />, labelKey: 'Document AI', permission: 'documents:read' },
  //     { key: '/analytics/ai', icon: <BarChartOutlined />, labelKey: 'NL Analytics', permission: 'analytics:read' },
  //     { key: '/vision', icon: <SafetyOutlined />, labelKey: 'Vision AI', permission: 'vision:read' },
  //     { key: '/voice-notes', icon: <CustomerServiceOutlined />, labelKey: 'Voice Notes', permission: 'voice:read' },
  //     // { key: '/tracking/live', icon: <EnvironmentOutlined />, labelKey: 'Live Tracking', permission: 'agent_locations:read' },
  //   ],
  // },
  {
    section: 'sidebar.systemAnalytics',
    items: [
      { key: '/reports', icon: <BarChartOutlined />, labelKey: 'nav.reports', permission: 'reports:read' },
      { key: '/settings', icon: <SettingOutlined />, labelKey: 'nav.settings', permission: 'settings:read' },
    ],
  },
];

const technicianSections: MenuSection[] = [
  {
    items: [
      { key: '/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      { key: '/work-orders/my-jobs', icon: <ScheduleOutlined />, labelKey: 'sidebar.myJobs' },
      { key: '/scheduling/calendar', icon: <CalendarOutlined />, labelKey: 'sidebar.mySchedule' },
      { key: '/timesheets', icon: <ClockCircleOutlined />, labelKey: 'nav.timesheets' },
      { key: '/notifications', icon: <BellOutlined />, labelKey: 'sidebar.notifications' },
    ],
  },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const { can } = usePermission();
  const isSuperAdmin = useAuthStore((s) => s.user?.is_super_admin);
  const user = useAuthStore((s) => s.user);

  const roles: unknown[] = Array.isArray(user?.roles) ? (user.roles as unknown[]) : [];
  const isTechnician =
    !isSuperAdmin &&
    roles.some((r) => (typeof r === 'string' ? r : (r as { name?: string })?.name) === 'Technician');

  // Filter menu sections based on user permissions
  const baseSections = [...menuSections];

  if (isSuperAdmin) {
    baseSections.push({
      section: 'sidebar.superAdmin',
      items: [
        { key: '/admin/tenants', icon: <CrownOutlined />, labelKey: 'sidebar.tenants' },
        { key: '/admin/pricing', icon: <DollarOutlined />, labelKey: 'Pricing Plans' },
        { key: '/admin/magic-links', icon: <LinkOutlined />, labelKey: 'Magic Links' },
        { key: '/admin/analytics', icon: <LineChartOutlined />, labelKey: 'sidebar.analytics' },

        { key: '/admin/platform-health', icon: <DesktopOutlined />, labelKey: 'sidebar.systemHealth' },
        { key: '/admin/api-keys', icon: <KeyOutlined />, labelKey: 'sidebar.apiKeys' },
        { key: '/admin/audit-logs', icon: <AuditOutlined />, labelKey: 'sidebar.auditLogs' },
      ]
    });
  }

  const filteredSections = baseSections
    .map((section) => {
      const filteredItems = section.items
        .filter((item) => {
          if (isSuperAdmin && item.key === '/dashboard') return false;
          return !item.permission || can(item.permission);
        })
        .map((item) => {
          if (!item.children) return item;
          const filteredChildren = item.children.filter(
            (child) => !child.permission || can(child.permission),
          );
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        })
        .filter(Boolean) as MenuItem[];

      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    })
    .filter(Boolean) as MenuSection[];

  const activeSections = isTechnician ? technicianSections : filteredSections;

  if (!i18n.isInitialized) return null;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setSidebarCollapsed}
      width={260}
      collapsedWidth={80}
      theme="light"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: i18n.dir() === 'rtl' ? 'auto' : 0,
        right: i18n.dir() === 'rtl' ? 0 : 'auto',
        top: 0,
        bottom: 0,
        borderRight: i18n.dir() === 'rtl' ? 'none' : '1px solid #f0f0f0',
        borderLeft: i18n.dir() === 'rtl' ? '1px solid #f0f0f0' : 'none',
        zIndex: 100,
      }}
      trigger={null}
    >
      {/* Logo Section */}
      <div
        style={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 16px' : '0 24px',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.5)',
            }}
          >
            <ThunderboltFilled style={{ fontSize: 24 }} />
          </div>
          {!collapsed && (
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
              FieldForce Pro
            </span>
          )}
        </div>

        {/* Collapse/Expand Button */}
        <div
          onClick={() => setSidebarCollapsed(!collapsed)}
          style={{
            cursor: 'pointer',
            color: '#9ca3af',
            padding: 4,
            display: collapsed ? 'flex' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: collapsed ? 0 : 0
          }}
        >
          {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />}
        </div>
      </div>

      {/* Menu Sections */}
      <div style={{ flex: 1 }}>
        {activeSections.map((section, index) => (
          <div key={index} style={{ marginBottom: 12 }}>
            {!collapsed && section.section && (
              <div className="sidebar-section-title">{t(section.section)}</div>
            )}
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={({ key }) => {
                // Don't navigate if it's a submenu key
                if (!key.includes('submenu')) {
                  navigate(key);
                }
              }}
              className="sidebar-menu"
              style={{ border: 'none' }}
              items={section.items.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>{t(item.labelKey)}</span>
                    {item.key === '/dashboard/live-map' && !collapsed && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                    )}
                  </div>
                ),
                children: item.children?.map((child) => ({
                  key: child.key,
                  label: t(child.labelKey),
                })),
              }))}
            />
          </div>
        ))}
      </div>
    </Sider>
  );
}
