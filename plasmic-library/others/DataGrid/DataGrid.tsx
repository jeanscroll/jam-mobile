import type React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import styles from './DataGrid.module.css';

interface Task {
  [key: string]: string | null | undefined;
}

interface ColumnFilter {
  field: string;
  value: string | number | boolean;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
}

interface ColumnStyle {
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => React.ReactNode;
  isImage?: boolean;
  imageSize?: { width: string, height: string };
  imageAlt?: string;
}

interface ColumnHeader {
  label: string;
  tooltip?: string;
  icon?: React.ReactNode;
}

interface DataGridTheme {
  headerBgColor?: string;
  rowBgColor?: string;
  hoverBgColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: string;
}

interface ResponsiveConfig {
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  horizontalOverflow?: 'auto' | 'scroll' | 'hidden';
  verticalOverflow?: 'auto' | 'scroll' | 'hidden';
  stickyHeader?: boolean;
  compactOnMobile?: boolean;
  breakpoint?: number;
}

interface DataGridProps {
  tasks: Task[];
  containerClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  onTaskClick?: (taskId: string) => void;
  columnLabels?: { [key: string]: string };
  visibleColumns?: string[];
  columnOrder?: string[];
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  filters?: ColumnFilter[];
  onFilterChange?: (filters: ColumnFilter[]) => void;
  columnStyles?: { [key: string]: ColumnStyle };
  enableExport?: boolean;
  exportFormats?: 'csv' | 'excel';
  exportIcon?: React.ReactNode;
  onExport?: (format: string) => void;
  isLoading?: boolean;
  error?: Error;
  emptyStateMessage?: string;
  loadingComponent?: React.ReactNode;
  columnHeaders?: { [key: string]: ColumnHeader };
  theme?: DataGridTheme;
  responsive?: ResponsiveConfig;
  PreviousButton?: React.ComponentType<{ onClick: () => void; disabled: boolean }>;
  NextButton?: React.ComponentType<{ onClick: () => void; disabled: boolean }>;
  PageInfo?: React.ComponentType<{ currentPage: number; totalPages: number }>;
}

type SortField = string;
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const DEFAULT_LABELS: { [key: string]: string } = {
  id: 'ID',
  title: 'Title',
  status: 'Status',
  type: 'Type',
  budget: 'Budget',
  date_start: 'Start Date',
  date_end: 'End Date',
  comments: 'Comments',
  created_at: 'Created At',
  updated_at: 'Updated At',
  last_updated_by: 'Last Updated By',
  model: 'Model'
};

const DEFAULT_THEME: DataGridTheme = {
  headerBgColor: '#f6f3ef',
  rowBgColor: '#ffffff',
  hoverBgColor: '#f9f5ff',
  borderColor: '#d9cdbf',
  textColor: '#333333',
  fontSize: '14px'
};

const DEFAULT_PAGE_SIZE = 10;

const DataGrid: React.FC<DataGridProps> = ({
  tasks = [],
  containerClassName = "",
  headerClassName = "",
  rowClassName = "",
  onTaskClick,
  columnLabels = DEFAULT_LABELS,
  visibleColumns,
  columnOrder,
  pageSize = DEFAULT_PAGE_SIZE,
  currentPage = 1,
  onPageChange,
  totalItems,
  filters = [],
  onFilterChange,
  columnStyles = {},
  enableExport = false,
  exportFormats = 'csv',
  exportIcon,
  onExport,
  isLoading = false,
  error,
  emptyStateMessage = "Aucune donnée disponible",
  loadingComponent,
  columnHeaders = {},
  theme: customTheme,
  responsive,
  PreviousButton,
  NextButton,
  PageInfo
}) => {
  const [mounted, setMounted] = useState(false);
  const [sort, setSort] = useState<SortState>({ field: 'id', direction: null });
  const [localFilters, setLocalFilters] = useState<ColumnFilter[]>(filters);
  const [filterOpen, setFilterOpen] = useState<string | null>(null);

  const theme = useMemo(() => ({
    ...DEFAULT_THEME,
    ...customTheme
  }), [customTheme]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allColumns = useMemo(() => {
    if (tasks.length === 0) return [];
    const cols = Object.keys(tasks[0]);
    if (columnOrder) {
      return columnOrder.filter(col => cols.includes(col));
    }
    return cols;
  }, [tasks, columnOrder]);

  const columns = useMemo(() => {
    if (!visibleColumns) return allColumns;
    return visibleColumns.filter(col => allColumns.includes(col));
  }, [allColumns, visibleColumns]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      return localFilters.every(filter => {
        const value = task[filter.field];
        if (value === null || value === undefined) return false;

        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          default:
            return true;
        }
      });
    });
  }, [tasks, localFilters]);

  const sortedTasks = useMemo(() => {
    if (!sort.direction) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (sort.field === 'created_at') {
        if (!aValue && !bValue) return 0;
        if (!aValue) return sort.direction === 'asc' ? 1 : -1;
        if (!bValue) return sort.direction === 'asc' ? -1 : 1;

        const dateA = new Date(String(aValue)).getTime();
        const dateB = new Date(String(bValue)).getTime();
        return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sort.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sort.direction === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [filteredTasks, sort]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, currentPage, pageSize]);

  const totalPages = Math.ceil((totalItems ?? sortedTasks.length) / pageSize);

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!enableExport) return;
    onExport?.(format);
  };

  const handleSort = (field: SortField) => {
    setSort(prevSort => ({
      field,
      direction:
        prevSort.field === field
          ? prevSort.direction === 'asc'
            ? 'desc'
            : prevSort.direction === 'desc'
              ? null
              : 'asc'
          : 'asc'
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = parseISO(dateString);
      return format(date, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const renderCell = (column: string, value: string | null | undefined, task: Task) => {
    if (value === null || value === undefined) return 'N/A';

    const style = columnStyles[column];
    
    if (style?.isImage) {
      const imageSize = style.imageSize || { width: '32px', height: '32px' };
      const imageAlt = style.imageAlt || `Image ${column}`;
      
      return (
        <div className={styles.imageCell}>
          <img 
            src={value} 
            alt={imageAlt}
            style={{
              width: imageSize.width,
              height: imageSize.height,
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        </div>
      );
    }

    switch (column) {
      case 'Entreprises':
        const companyName = value || '';
        return (
          <div className={styles.companyCell}>
            <img src={task.logo || ''} alt={companyName} className={styles.companyLogo} />
            <span className={styles.companyName}>{companyName}</span>
          </div>
        );
      case 'Postulé le':
        return (
          <span className={styles.dateCell}>
            {value}
          </span>
        );
      case 'Statut':
        if (value === "Cette annonce n'est plus disponible") {
          return <span className={styles.unavailable}>{value}</span>;
        }
        return (
          <span className={styles.statusTag}>
            {value}
          </span>
        );
      case 'date_start':
      case 'date_end':
      case 'created_at':
      case 'updated_at':
        return formatDate(value as string);
      case 'budget':
        return value.toString();
      case 'type':
        return (
          <span className={styles.typeTag}>
            {value}
          </span>
        );
      default:
        return value;
    }
  };

  if (!mounted) {
    return null;
  }

  if (error) {
    return (
      <div className={styles.dataGridError}>
        <h3>Erreur</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return loadingComponent || (
      <div className={styles.dataGridLoading}>
        <div className={styles.dataGridSpinner} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.dataGridEmpty}>
        {emptyStateMessage}
      </div>
    );
  }

  return (
    <div className={`${styles.dataGridWrapper} ${containerClassName}`} 
      style={{ 
        position: 'relative',
        height: responsive?.height,
        maxHeight: responsive?.maxHeight,
        '--table-min-width': responsive?.minWidth,
        '--table-max-width': responsive?.maxWidth,
      } as React.CSSProperties}
      data-sticky-header={responsive?.stickyHeader}
      data-overflow-x={responsive?.horizontalOverflow}
      data-overflow-y={responsive?.verticalOverflow}
      data-compact={responsive?.compactOnMobile}
    >
      {enableExport && mounted && (
        <div className={styles.dataGridToolbar} style={{
          position: 'static',
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '8px'
        }}>
          <div className={styles.dataGridExport}>
            <div
              role="button"
              tabIndex={0}
              className={styles.dataGridButton}
              onClick={() => handleExport(exportFormats)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleExport(exportFormats);
                }
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                marginRight: '0px'
              }}
            >
              {exportIcon || (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      )}

      <table className={styles.dataGridTable}>
        <thead>
          <tr className={`${styles.dataGridHeader} ${headerClassName}`}
            style={{
              backgroundColor: theme.headerBgColor,
              color: theme.textColor,
              fontSize: theme.fontSize,
              borderColor: theme.borderColor
            }}>
            {columns.map(column => (
              <th
                key={column}
                className={styles.headerCell}
                onClick={() => handleSort(column)}
                style={{
                  borderColor: theme.borderColor,
                  textAlign: 'center'
                }}
              >
                <span className={styles.headerContent} style={{ justifyContent: 'center' }}>
                  {columnHeaders[column]?.label || columnLabels[column] || column}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedTasks.map((task: Task) => (
            <tr
              key={task.id as string}
              className={`${styles.dataGridRow} ${rowClassName}`}
              onClick={() => onTaskClick?.(task.id as string)}
              style={{
                backgroundColor: theme.rowBgColor,
                color: theme.textColor,
                fontSize: theme.fontSize,
                borderColor: theme.borderColor,
                cursor: onTaskClick ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = theme.hoverBgColor || '';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = theme.rowBgColor || '';
              }}
            >
              {columns.map((column) => (
                <td
                  key={column}
                  className={styles.dataGridCell}
                  style={{ 
                    textAlign: columnStyles[column]?.align || 'left',
                    borderColor: theme.borderColor
                  }}
                >
                  {renderCell(column, task[column], task)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && mounted && (
        <div className={styles.dataGridPagination}>
          <button
            className={styles.paginationButton}
            onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            PRECEDENT
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                className={`${styles.pageNumber} ${pageNum === currentPage ? styles.activePage : ''}`}
                onClick={() => onPageChange?.(pageNum)}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            className={styles.paginationButton}
            onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            SUIVANT
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '8px' }}>
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(DataGrid), {
  ssr: false
});
