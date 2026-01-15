import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addHours, addMinutes } from 'date-fns';
import styles from './Kanban.module.css';

interface ApiTask {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  general_description: string;
  type: string;
  priority: string;
  thematic: string;
  status: string;
  precisions: string;
}

interface Task {
  id: string;
  title: string;
  date_start: string;
  date_end: string;
  description: string;
  type: string;
  priority: string;
  thematic: string;
  status: string;
  precisions: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanData {
  columns: {
    [key: string]: Column;
  };
  columnOrder: string[];
}

interface FixedColumn {
  id: string;
  title: string;
  backgroundColor: string;
}

interface KanbanProps {
  tasks: Task[];
  minHeight?: string;
  cardMinWidth?: string;
  cardMaxWidth?: string;
  cardMinHeight?: string;
  containerWidth?: string;
  containerMaxWidth?: string;
  containerHeight?: string;
  scrollBehavior?: 'overflow' | 'wrap';
  columnGap?: string;
  columnMinWidth?: string;
  columnMaxWidth?: string;
  groupBy?: 'type' | 'thematic' | 'status' | 'precisions';
  sortBy?: 'date_start' | 'date_end' | 'title';
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  showFilters?: boolean;
  fixedColumnOrder?: FixedColumn[];
  headerStyle?: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    fontWeight?: string;
    padding?: string;
    fontFamily?: string;
    uppercase?: boolean;
  };
  taskColors?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  };
  typeColors?: Array<{
    type: string;
    backgroundColor: string;
    textColor?: string;
    borderColor?: string;
  }>;
  onTaskMove?: (taskId: string, newGroup: string) => void;
  onTaskClick?: (taskId: string) => void;
  onSortChange?: (sortBy: string) => void;
  onSortDirectionChange?: (direction: string) => void;
  onSearch?: (searchTerm: string) => void;
}

const transformApiTask = (apiTask: ApiTask): Task => {
  return {
    id: apiTask.id.toString(),
    title: apiTask.title,
    date_start: apiTask.date_start,
    date_end: apiTask.date_end,
    description: apiTask.general_description,
    type: apiTask.type,
    priority: apiTask.priority,
    thematic: apiTask.thematic,
    status: apiTask.status,
    precisions: apiTask.precisions
  };
};

const filterTasksBySearch = (tasks: Task[], searchTerm: string): Task[] => {
  if (!searchTerm) return tasks;
  const lowerSearchTerm = searchTerm.toLowerCase();
  return tasks.filter(task => 
    task.title.toLowerCase().includes(lowerSearchTerm) ||
    task.description.toLowerCase().includes(lowerSearchTerm)
  );
};

const sortTasks = (tasks: Task[], sortBy: string, sortDirection: 'asc' | 'desc'): Task[] => {
  return [...tasks].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date_start':
        comparison = new Date(a.date_start).getTime() - new Date(b.date_start).getTime();
        break;
      case 'date_end':
        comparison = new Date(a.date_end).getTime() - new Date(b.date_end).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      default:
        return 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
};

const Kanban: React.FC<KanbanProps> = ({
  tasks = [],
  minHeight = "500px",
  cardMinWidth = "280px",
  cardMaxWidth = "320px",
  cardMinHeight = "auto",
  containerWidth = "100%",
  containerMaxWidth = "100%",
  containerHeight = "auto",
  scrollBehavior = "overflow",
  columnGap = "16px",
  columnMinWidth = "280px",
  columnMaxWidth = "320px",
  groupBy = "type",
  sortBy = "date_start",
  sortDirection = "asc",
  searchTerm = "",
  showFilters = true,
  fixedColumnOrder,
  headerStyle = {
    backgroundColor: "transparent",
    textColor: "#2D3748",
    borderRadius: "0.5rem 0.5rem 0 0",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "600",
    padding: "1rem",
    fontFamily: "Manrope",
    uppercase: false
  },
  taskColors = {
    backgroundColor: "#ffffff",
    textColor: "#131013",
    borderColor: "#E2E8F0"
  },
  typeColors = [],
  onTaskMove,
  onTaskClick,
  onSortChange,
  onSortDirectionChange,
  onSearch
}) => {
  const processedTasks = useMemo(() => {
    let filteredTasks = (tasks as unknown as ApiTask[]).map(transformApiTask);
    filteredTasks = filterTasksBySearch(filteredTasks, searchTerm);
    return sortTasks(filteredTasks, sortBy, sortDirection);
  }, [tasks, searchTerm, sortBy, sortDirection]);

  const columnTypes = useMemo(() => {
    const uniqueValues = Array.from(new Set(processedTasks.map(task => task[groupBy])));
    if (fixedColumnOrder) {
      // Use fixed order but include any new columns at the end
      const fixedIds = fixedColumnOrder.map(col => col.id);
      const newColumns = uniqueValues.filter(col => !fixedIds.includes(col));
      return [...fixedIds, ...newColumns];
    }
    return uniqueValues.length > 0 ? uniqueValues : ['Default'];
  }, [processedTasks, groupBy, fixedColumnOrder]);

  const [data, setData] = useState<KanbanData>(() => {
    const initialColumns = columnTypes.reduce((acc, type) => {
      acc[type] = {
        id: type,
        title: type,
        tasks: processedTasks.filter(task => task[groupBy] === type)
      };
      return acc;
    }, {} as { [key: string]: Column });

    return {
      columns: initialColumns,
      columnOrder: columnTypes
    };
  });

  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const updatedColumns = columnTypes.reduce((acc, type) => {
      acc[type] = {
        id: type,
        title: type,
        tasks: processedTasks.filter(task => task[groupBy] === type)
      };
      return acc;
    }, {} as { [key: string]: Column });

    setData({
      columns: updatedColumns,
      columnOrder: columnTypes
    });
  }, [processedTasks, groupBy, columnTypes]);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setMovingTaskId(draggableId);

    const sourceColumn = data.columns[source.droppableId];
    const destColumn = data.columns[destination.droppableId];
    const task = sourceColumn.tasks.find(t => t.id === draggableId);

    if (!task) return;

    const newSourceTasks = Array.from(sourceColumn.tasks);
    newSourceTasks.splice(source.index, 1);

    const updatedTask = {
      ...task,
      type: groupBy === 'type' ? destination.droppableId : task.type,
      thematic: groupBy === 'thematic' ? destination.droppableId : task.thematic,
      status: groupBy === 'status' ? destination.droppableId : task.status,
      precisions: groupBy === 'precisions' ? destination.droppableId : task.precisions
    };

    const newDestTasks = Array.from(destColumn.tasks);
    newDestTasks.splice(destination.index, 0, updatedTask);

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: newSourceTasks
        },
        [destination.droppableId]: {
          ...destColumn,
          tasks: newDestTasks
        }
      }
    };

    setData(newData);
    
    if (onTaskMove) {
      await onTaskMove(draggableId, destination.droppableId);
    }
    
    setTimeout(() => {
      setMovingTaskId(null);
    }, 500);
  };

  const handleTaskClick = (taskId: string) => {
    onTaskClick?.(taskId);
  };

  const FilterControls = showFilters ? (
    <div className={styles.filterControls}>
      <input
        type="text"
        placeholder="Rechercher des tâches..."
        value={searchTerm}
        onChange={(e) => onSearch?.(e.target.value)}
        className={styles.searchInput}
      />
      <select
        value={sortBy}
        onChange={(e) => onSortChange?.(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="date_start">Trier par date de début</option>
        <option value="date_end">Trier par date de fin</option>
        <option value="title">Trier par titre</option>
      </select>
      <button
        type="button"
        onClick={() => onSortDirectionChange?.(sortDirection === 'asc' ? 'desc' : 'asc')}
        className={styles.sortDirectionButton}
      >
        {sortDirection === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  ) : null;

  const getTaskColors = (task: Task) => {
    const typeColor = typeColors.find(tc => tc.type === task.type);
    return {
      backgroundColor: typeColor?.backgroundColor || taskColors.backgroundColor,
      textColor: typeColor?.textColor || taskColors.textColor,
      borderColor: typeColor?.borderColor || taskColors.borderColor
    };
  };

  // Add priority color mapping
  const priorityColors: { [key: string]: string } = {
    "1: Nul": "#EAEAEC",
    "2: Faible": "#FFD66B",
    "3: Moyen": "#FF7F37",
    "4: Fort": "#E20A37",
    "5: Crise": "#43454D"
  };

  const getPriorityNumber = (priority: string) => {
    if (priority === "SUIVI") return null;
    const match = priority.match(/^(\d):/);
    return match ? match[1] : null;
  };

  const getPriorityColor = (priority: string) => {
    return priorityColors[priority] || "#EAEAEC";
  };

  return (
    <div style={{
      width: containerWidth,
      maxWidth: containerMaxWidth,
      height: containerHeight,
      overflow: 'hidden'
    }}>
      {FilterControls}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={`${styles.kanbanContainer}`} 
          style={{
            display: 'flex',
            gap: columnGap,
            overflowX: scrollBehavior === 'overflow' ? 'auto' : 'visible',
            overflowY: 'hidden',
            flexWrap: scrollBehavior === 'wrap' ? 'wrap' : 'nowrap',
            width: '100%',
            height: '100%',
            padding: '8px',
            boxSizing: 'border-box'
          }}>
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const fixedColumn = fixedColumnOrder?.find(col => col.id === columnId);
            const columnTitle = fixedColumn?.title || columnId;
            const backgroundColor = fixedColumn?.backgroundColor || headerStyle.backgroundColor;

            return (
              <div 
                key={columnId} 
                className={styles.kanbanColumn}
                style={{
                  minWidth: columnMinWidth,
                  maxWidth: columnMaxWidth,
                  flex: scrollBehavior === 'wrap' ? '1 1 auto' : '0 0 auto',
                  height: '100%'
                }}
              >
                <div 
                  className={styles.columnHeader}
                  style={{
                    backgroundColor,
                    color: headerStyle.textColor,
                    borderRadius: headerStyle.borderRadius,
                    textAlign: headerStyle.textAlign,
                    fontSize: headerStyle.fontSize,
                    fontWeight: headerStyle.fontWeight,
                    padding: headerStyle.padding,
                    fontFamily: headerStyle.fontFamily,
                    textTransform: headerStyle.uppercase ? 'uppercase' : 'none',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  {columnTitle}
                </div>
                <div className="rounded-lg rounded-t-none h-full" 
                  style={{ 
                    minHeight,
                    overflowY: 'auto',
                    height: containerHeight === 'auto' ? 'auto' : '100%'
                  }}>
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 h-full ${styles.droppableColumn} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
                        style={{ 
                          minHeight: `calc(${minHeight} - 32px)`, 
                          padding: '16px 8px',
                          boxSizing: 'border-box'
                        }}
                      >
                        {column.tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${styles.draggableWrapper}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  width: snapshot.isDragging ? cardMaxWidth : '100%'
                                }}
                              >
                                <div
                                  className={`rounded-lg shadow-sm cursor-pointer ${styles.taskCard} ${movingTaskId === task.id ? styles.moving : ''} ${snapshot.isDragging ? styles.dragging : ''}`}
                                  onClick={() => handleTaskClick(task.id)}
                                  style={{
                                    fontFamily: 'Manrope',
                                    ...getTaskColors(task),
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    width: '100%',
                                    padding: '16px',
                                    minHeight: cardMinHeight
                                  }}
                                >
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    fontFamily: 'Manrope',
                                    color: '#131013',
                                    marginBottom: '12px',
                                    wordBreak: 'break-word'
                                  }}>
                                    {task.title}
                                  </div>

                                  <div className="flex items-center justify-between mb-3">
                                    <div style={{ 
                                      color: '#604e39',
                                      fontSize: '12px',
                                      fontFamily: 'Manrope',
                                      fontWeight: '400'
                                    }}>
                                      No {task.id}
                                    </div>
                                    {task.priority !== "SUIVI" && (
                                      <div className="flex items-center gap-2">
                                        <div style={{
                                          color: '#604e39',
                                          fontSize: '12px',
                                          fontFamily: 'Manrope',
                                          fontWeight: '400'
                                        }}>
                                          Impact/Gravité
                                        </div>
                                        <div style={{
                                          backgroundColor: getPriorityColor(task.priority),
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: ['4: Fort', '5: Crise'].includes(task.priority) ? '#FFFFFF' : '#000000',
                                          fontSize: '12px',
                                          fontFamily: 'Manrope',
                                          fontWeight: '600'
                                        }}>
                                          {getPriorityNumber(task.priority)}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{
                                    fontSize: '12px',
                                    fontFamily: 'Manrope',
                                    color: '#4d4d4d',
                                    marginBottom: '12px'
                                  }}>
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ fontSize: '8px', fontWeight: '400', marginBottom: '4px' }}>Date et heure de début</div>
                                      <div style={{ fontSize: '12px', fontWeight: '400' }}>{format(new Date(task.date_start), 'dd/MM/yyyy  HH:mm')}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '8px', fontWeight: '400', marginBottom: '4px' }}>Date et heure de fin</div>
                                      <div style={{ fontSize: '12px', fontWeight: '400' }}>{format(new Date(task.date_end), 'dd/MM/yyyy  HH:mm')}</div>
                                    </div>
                                  </div>

                                  <div style={{
                                    fontFamily: 'Manrope',
                                    color: '#333333'
                                  }}>
                                    <div style={{ marginBottom: '8px', fontSize: '8px', fontWeight: '400' }}>Description</div>
                                    <div style={{ 
                                      whiteSpace: 'pre-wrap',
                                      color: '#4d4d4d',
                                      wordBreak: 'break-word',
                                      fontSize: '12px',
                                      fontWeight: '400'
                                    }}>
                                      {(task.description || '').split('\n').map((line, index) => (
                                        <div key={index} className="flex items-start">
                                          <span className="mr-2 flex-shrink-0">•</span>
                                          <span>{line.trim()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {task.precisions && (
                                    <div style={{
                                      fontFamily: 'Manrope',
                                      color: '#333333',
                                      marginTop: '12px'
                                    }}>
                                      <div style={{ marginBottom: '4px', fontSize: '8px', fontWeight: '400' }}>Type (Précisions)</div>
                                      <div style={{ 
                                        color: '#4d4d4d',
                                        fontSize: '12px',
                                        fontWeight: '400'
                                      }}>
                                        {task.precisions}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Kanban; 