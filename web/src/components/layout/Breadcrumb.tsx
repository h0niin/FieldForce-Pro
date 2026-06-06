import { Breadcrumb as AntBreadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const routeLabelKeys: Record<string, string> = {
  '': 'nav.dashboard',
  users: 'nav.users',
  contacts: 'nav.contacts',
  companies: 'nav.companies',
  assets: 'nav.assets',
  'service-requests': 'nav.serviceRequests',
  estimates: 'nav.estimates',
  'work-orders': 'nav.workOrders',
  'service-locations': 'nav.serviceLocations',
  scheduling: 'nav.scheduling',
  invoices: 'nav.invoices',
  payments: 'nav.payments',
  reports: 'nav.reports',
  workforce: 'nav.workforce',
  settings: 'nav.settings',
  agreements: 'nav.agreements',
  trips: 'nav.trips',
  history: 'tracking.tripHistory',
  notifications: 'sidebar.notifications',
  profile: 'header.myProfile',
  create: 'common.create',
  edit: 'common.edit',
};

const detailLabelKeys: Record<string, string> = {
  'work-orders': 'workOrders.details',
  contacts: 'contacts.details',
  companies: 'companies.details',
  assets: 'common.details',
  'service-requests': 'serviceRequests.details',
  estimates: 'estimates.details',
  invoices: 'invoices.details',
  agreements: 'agreements.details',
  'service-locations': 'common.details',
  workforce: 'common.details',
};

/** Detect UUID v4 segments — these are entity detail pages */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Breadcrumb() {
  const { t } = useTranslation();
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const items = [
    {
      title: <Link to="/dashboard">{t('nav.dashboard')}</Link>,
    },
    ...segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');
      const isLast = index === segments.length - 1;

      let label: string;
      if (UUID_RE.test(segment)) {
        // UUID — show a friendly detail label based on the parent resource
        const parent = segments[index - 1] ?? '';
        const key = detailLabelKeys[parent] ?? 'common.details';
        label = t(key);
      } else {
        const key = routeLabelKeys[segment];
        label = key ? t(key) : segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }

      return {
        title: isLast ? label : <Link to={path}>{label}</Link>,
      };
    }),
  ];

  return <AntBreadcrumb style={{ marginBottom: 16 }} items={items} />;
}
