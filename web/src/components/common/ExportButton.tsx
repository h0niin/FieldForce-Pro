import { Button, Dropdown } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { exportToCSV, exportToExcel, exportTableData } from '@/utils/export.utils';

export interface ExportButtonProps<T> {
  data: T[];
  filename: string;
  columns?: { key: keyof T; label: string }[];
}

export default function ExportButton<T extends Record<string, any>>({
  data,
  filename,
  columns,
}: ExportButtonProps<T>) {
  const { t } = useTranslation();

  const menuItems = [
    {
      key: 'csv',
      label: t('exportButton.exportAsCsv'),
      onClick: () => exportToCSV(data, filename, columns),
    },
    {
      key: 'excel',
      label: t('exportButton.exportAsExcel'),
      onClick: () => exportToExcel(data, filename, columns),
    },
    {
      key: 'pdf',
      label: t('exportButton.exportAsPdf'),
      onClick: () => exportTableData(data, filename, 'pdf'),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <Button icon={<DownloadOutlined />}>{t('exportButton.export')}</Button>
    </Dropdown>
  );
}