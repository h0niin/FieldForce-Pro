import { Table, Space } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { useState, useCallback } from 'react';
import { PAGINATION_DEFAULTS } from '@/utils/constants';
import SearchFilter from '@/components/common/SearchFilter';

interface DataTableProps<T> {
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onSearch?: (value: string) => void;
  onSort?: (field: string, order: 'ASC' | 'DESC') => void;
  rowKey?: string | ((record: T) => string);
  searchPlaceholder?: string;
  showSearch?: boolean;
  extra?: React.ReactNode;
}

export default function DataTable<T extends object>({
  columns,
  dataSource,
  loading,
  total,
  page = PAGINATION_DEFAULTS.PAGE,
  pageSize = PAGINATION_DEFAULTS.PAGE_SIZE,
  onPageChange,
  onSearch,
  onSort,
  rowKey = 'id',
  searchPlaceholder = 'Search...',
  showSearch = true,
  extra,
}: DataTableProps<T>) {
  const [searchText, setSearchText] = useState('');
  const searchTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

  const handleSearch = useCallback(
    (value: string) => {
      setSearchText(value);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        onSearch?.(value);
      }, 300);
    },
    [onSearch],
  );

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[],
  ) => {
    if (pagination.current && pagination.pageSize) {
      onPageChange?.(pagination.current, pagination.pageSize);
    }
    if (!Array.isArray(sorter) && sorter.field && sorter.order) {
      onSort?.(String(sorter.field), sorter.order === 'ascend' ? 'ASC' : 'DESC');
    }
  };

  return (
    <div>
      {(showSearch || extra) && (
        <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          {showSearch && (
            <SearchFilter
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
          )}
          {extra}
        </Space>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        onChange={handleTableChange}
        pagination={
          total
            ? {
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (t) => `Total ${t} items`,
              }
            : false
        }
      />
    </div>
  );
}
