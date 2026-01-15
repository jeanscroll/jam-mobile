import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import styles from './DataGridV2.module.css';
import Head from 'next/head';

interface Task {
  nom_du_candidat: string;
  note: string;
  cv_nom: string;
  lm_nom: string;
  date_de_candidature: string;
  status: string;
  email: string;
  profile_photo: string | null;
  id?: string;
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

interface DataGridV2Props {
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
  onAccept?: (taskId: string, task: Task) => void;
  onReject?: (taskId: string) => void;
  onViewCV?: (fileUrl: string, taskId: string) => void;
  onViewLM?: (fileUrl: string, taskId: string) => void;
  statusConfig?: {
    [key: string]: {
      label: string;
      className?: string;
      color?: string;
    }
  };
  showActionsColumn?: boolean;
}

const DEFAULT_LABELS: { [key: string]: string } = {
  nom_du_candidat: "Nom du candidat",
  note: "Note",
  cv_nom: "CV",
  lm_nom: "Lettre de motivation",
  date_de_candidature: "Postulé le",
  status: "Statut",
  email: "Email",
  profile_photo: "Photo de profil"
};

const DEFAULT_THEME: DataGridTheme = {
  headerBgColor: '#F3F4F6',
  rowBgColor: '#ffffff',
  hoverBgColor: '#E5E7EB',
  borderColor: '#E5E7EB',
  textColor: '#4B5563'
};

const DEFAULT_PAGE_SIZE = 10;

export const DataGridV2: React.FC<DataGridV2Props> = ({
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
  onAccept,
  onReject,
  onViewCV,
  onViewLM,
  statusConfig,
  showActionsColumn = true
}) => {
  const [mounted, setMounted] = useState(false);
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' | null }>({ field: '', direction: null });
  const [localFilters, setLocalFilters] = useState<ColumnFilter[]>(filters);

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
    let result: string[];
    if (columnOrder) {
      result = columnOrder.filter(col => cols.includes(col));
    } else {
      result = [...cols];
    }
    if (showActionsColumn) {
      result = [...result, 'actions'];
    }
    return result;
  }, [tasks, columnOrder, showActionsColumn]);

  const columns = useMemo(() => {
    let baseCols: string[];
    if (!visibleColumns) {
      baseCols = allColumns;
    } else {
      baseCols = [...visibleColumns];
    }
    if (showActionsColumn && !baseCols.includes('actions')) {
      baseCols = [...baseCols, 'actions'];
    }
    if (!showActionsColumn) {
      baseCols = baseCols.filter(col => col !== 'actions');
    }
    return baseCols;
  }, [allColumns, visibleColumns, showActionsColumn]);

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

  const handleSort = (field: string) => {
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
    if (column === 'actions') {
      if (task.status === 'refuse' || task.status === 'refusé' || task.status === 'Refuser') {
        return null;
      }
      return (
        <div className={styles.actions}>
          <button
            className={`${styles.actionButton} ${styles.acceptButton}`}
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.(task.id || '', task);
            }}
            title="Accepter la candidature"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </button>
          <button
            className={`${styles.actionButton} ${styles.rejectButton}`}
            onClick={(e) => {
              e.stopPropagation();
              onReject?.(task.id || '');
            }}
            title="Refuser la candidature"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </button>
        </div>
      );
    }

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
      case 'nom_du_candidat':
        return (
          <div className={styles.companyCell}>
            {task.profile_photo && (
              <img 
                src={task.profile_photo}
                alt=""
                className={styles.companyLogo}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <div className={styles.userInfo}>
              <span className={styles.companyName}>{value}</span>
              {task.email && <span className={styles.userEmail}>{task.email}</span>}
            </div>
          </div>
        );
      case 'status':
        if (!statusConfig || !value) return value;
        const status = statusConfig[value];
        if (!status) return value;
        
        return (
          <span 
            className={`${styles.statusTag} ${status.className || ''}`}
            style={status.color ? { backgroundColor: status.color } : undefined}
          >
            {status.label || value}
          </span>
        );
      case 'date_de_candidature':
        return (
          <span className={styles.dateCell}>
            {value}
          </span>
        );
      case 'cv_nom':
      case 'lm_nom':
        if (!value) return 'N/A';
        const fileName = value.split('/').pop() || value;
        const isCV = column === 'cv_nom';
        const fileUrl = value.startsWith('http') ? value : `/uploads/${value}`;
        
        return (
          <div className={styles.fileCell}>
            <button
              className={styles.previewButton}
              onClick={(e) => {
                e.stopPropagation();
                if (isCV) {
                  onViewCV?.(fileUrl, task.id || '');
                } else {
                  onViewLM?.(fileUrl, task.id || '');
                }
              }}
              title={`Voir ${isCV ? 'le CV' : 'la lettre de motivation'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <span className={styles.fileName} title={fileName}>
              {fileName}
            </span>
          </div>
        );
      case 'note':
        const level = Number(value) || 0;
        return (
          <div className={styles.rating}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < level ? styles.starFilled : styles.starEmpty}>
                ★
              </span>
            ))}
          </div>
        );
      default:
        return value;
    }
  };

  if (!mounted) return null;

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Erreur</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return loadingComponent || (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.empty}>
        {emptyStateMessage}
      </div>
    );
  }

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div 
        className={`${styles.wrapper} ${containerClassName}`}
        style={{
          position: 'relative',
          height: responsive?.height,
          maxHeight: responsive?.maxHeight,
          '--table-min-width': responsive?.minWidth,
          '--table-max-width': responsive?.maxWidth,
          '--header-bg-color': theme.headerBgColor,
          '--hover-bg-color': theme.hoverBgColor,
          '--border-color': theme.borderColor,
          '--text-color': theme.textColor,
        } as React.CSSProperties}
        data-sticky-header={responsive?.stickyHeader}
        data-overflow-x={responsive?.horizontalOverflow}
        data-overflow-y={responsive?.verticalOverflow}
        data-compact={responsive?.compactOnMobile}
      >
        {enableExport && mounted && (
          <div className={styles.toolbar}>
            <div className={styles.export}>
              <div
                role="button"
                tabIndex={0}
                className={styles.button}
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

        <table className={styles.table}>
          <thead>
            <tr className={`${styles.header} ${headerClassName}`}
              style={{
                backgroundColor: theme.headerBgColor,
                color: theme.textColor,
                fontSize: '14px',
                borderColor: theme.borderColor
              }}>
              {columns.map(column => (
                <th
                  key={column}
                  className={styles.headerCell}
                  onClick={() => column !== 'actions' && handleSort(column)}
                  style={{
                    borderColor: theme.borderColor,
                    textAlign: columnStyles[column]?.align || 'left',
                    cursor: column === 'actions' ? 'default' : 'pointer'
                  }}
                >
                  <span className={styles.headerContent}>
                    {column === 'actions' ? 'Actions' : (columnHeaders[column]?.label || columnLabels[column] || column)}
                    {column !== 'actions' && (
                      <span style={{ display: 'flex', flexDirection: 'column', marginLeft: 0 }}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ color: sort.field === column && sort.direction === 'asc' ? '#002402' : '#BDBDBD', marginBottom: '-2px' }}
                        >
                          <path d="M6 3L9 6H3L6 3Z" fill="currentColor" />
                        </svg>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ color: sort.field === column && sort.direction === 'desc' ? '#002402' : '#BDBDBD', marginTop: '-2px' }}
                        >
                          <path d="M6 9L3 6H9L6 9Z" fill="currentColor" />
                        </svg>
                      </span>
                    )}
                    {columnHeaders[column]?.icon}
                    {columnHeaders[column]?.tooltip && (
                      <span className={styles.tooltip}>{columnHeaders[column]?.tooltip}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.map((task: Task) => (
              <tr
                key={task.id as string}
                className={`${styles.row} ${rowClassName}`}
                onClick={() => onTaskClick?.(task.id as string)}
                style={{
                  backgroundColor: theme.rowBgColor,
                  color: theme.textColor,
                  fontSize: '14px',
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
                    className={styles.cell}
                    style={{ 
                      textAlign: columnStyles[column]?.align || 'left',
                      borderColor: theme.borderColor,
                      width: columnStyles[column]?.width
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
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
               <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
              >
                <path d="M15 6L9 12L15 18" stroke="#002402" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              PRECEDENT
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`${styles.pageNumber} ${pageNum === currentPage ? styles.active : ''}`}
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginLeft: '8px', display: 'inline', verticalAlign: 'middle' }}
              >
                <path d="M9 6L15 12L9 18" stroke="#002402" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(DataGridV2), {
  ssr: false
}); 