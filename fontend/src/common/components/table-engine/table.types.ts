import { ReactNode } from 'react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  className?: string;
  render?: (row: T, index: number) => ReactNode;
}

export interface TableActionDef<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'primary';
  onClick: (row: T) => void;
  show?: (row: T) => boolean;
}

export interface BulkActionDef {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger' | 'primary';
  onClick: (selectedIds: number[]) => void;
  show?: (selectedIds: number[]) => boolean;
}

export type FilterType = 'select' | 'searchable-select' | 'date';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  defaultValue?: string;
  searchPlaceholder?: string;
}

export interface TableEngineConfig<T> {
  columns: ColumnDef<T>[];
  rowActions?: TableActionDef<T>[];
  bulkActions?: BulkActionDef[];
  filters?: FilterDef[];
  searchPlaceholder?: string;
}
