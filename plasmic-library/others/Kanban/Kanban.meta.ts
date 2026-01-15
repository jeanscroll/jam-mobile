const KanbanMeta = {
    name: "Kanban",
    section: "🔖 Sitex",
    displayName: "Kanban",
    description: "Vue Kanban pour la gestion des tâches avec drag & drop",
    thumbnailUrl: "https://static1.plasmic.app/insertables/kanban.svg",
    importPath: "./components/others/Kanban/Kanban",
    props: {
        tasks: {
            type: "array",
            defaultValue: [],
            description: "Array of tasks to display in the kanban",
            itemType: {
                type: "object",
                fields: {
                    id: "string",
                    title: "string",
                    date_start: "string",
                    date_end: "string",
                    description: "string",
                    type: "string",
                    thematic: "string"
                }
            }
        },
        containerWidth: {
            type: "string",
            description: "Width of the kanban container",
            defaultValue: "100%"
        },
        containerMaxWidth: {
            type: "string",
            description: "Maximum width of the kanban container",
            defaultValue: "100%"
        },
        containerHeight: {
            type: "string",
            description: "Height of the kanban container (auto or fixed value)",
            defaultValue: "auto"
        },
        scrollBehavior: {
            type: "choice",
            options: ["overflow", "wrap"],
            description: "How columns behave when they exceed container width: scroll horizontally or wrap to next line",
            defaultValue: "overflow"
        },
        columnGap: {
            type: "string",
            description: "Space between columns",
            defaultValue: "16px"
        },
        columnMinWidth: {
            type: "string",
            description: "Minimum width of columns",
            defaultValue: "280px"
        },
        columnMaxWidth: {
            type: "string",
            description: "Maximum width of columns",
            defaultValue: "320px"
        },
        minHeight: {
            type: "string",
            description: "Minimum height of the kanban",
            defaultValue: "500px"
        },
        cardMinWidth: {
            type: "string",
            description: "Minimum width of cards",
            defaultValue: "280px"
        },
        cardMaxWidth: {
            type: "string",
            description: "Maximum width of cards",
            defaultValue: "320px"
        },
        cardMinHeight: {
            type: "string",
            description: "Minimum height of task cards",
            defaultValue: "auto"
        },
        groupBy: {
            type: "choice",
            description: "Group tasks by field",
            defaultValue: "type",
            options: ["type", "thematic", "status", "precisions"]
        },
        sortBy: {
            type: "choice",
            description: "Sort tasks by field",
            defaultValue: "date_start",
            options: ["date_start", "date_end", "title"]
        },
        sortDirection: {
            type: "choice",
            description: "Sort direction",
            defaultValue: "asc",
            options: ["asc", "desc"]
        },
        searchTerm: {
            type: "string",
            description: "Search term to filter tasks"
        },
        showFilters: {
            type: "boolean",
            description: "Show filter controls",
            defaultValue: true
        },
        fixedColumnOrder: {
            type: "array",
            description: "Fixed order of columns with their styles. Each column can have its own name and styling.",
            itemType: {
                type: "object",
                fields: {
                    id: {
                        type: "string",
                        description: "Column identifier"
                    },
                    title: {
                        type: "string",
                        description: "Display name of the column"
                    },
                    backgroundColor: {
                        type: "string",
                        description: "Background color for this column"
                    }
                }
            }
        },
        headerStyle: {
            type: "object",
            description: "Default styling options for column headers",
            defaultValue: {
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
            fields: {
                backgroundColor: {
                    type: "string",
                    description: "Default background color for columns without specific colors"
                },
                textColor: {
                    type: "string",
                    description: "Text color of the header"
                },
                borderRadius: {
                    type: "string",
                    description: "Border radius of the header"
                },
                textAlign: {
                    type: "choice",
                    options: ["left", "center", "right"],
                    description: "Text alignment"
                },
                fontSize: {
                    type: "string",
                    description: "Font size"
                },
                fontWeight: {
                    type: "string",
                    description: "Font weight"
                },
                padding: {
                    type: "string",
                    description: "Padding"
                },
                fontFamily: {
                    type: "string",
                    description: "Font family"
                },
                uppercase: {
                    type: "boolean",
                    description: "Transform column title to uppercase",
                    defaultValue: false
                }
            }
        },
        taskColors: {
            type: "object",
            description: "Colors for task cards",
            defaultValue: {
                backgroundColor: "#ffffff",
                textColor: "#131013",
                borderColor: "#E2E8F0"
            },
            fields: {
                backgroundColor: {
                    type: "string",
                    description: "Default background color for cards without a specific type color"
                },
                textColor: {
                    type: "string",
                    description: "Default text color for cards"
                },
                borderColor: {
                    type: "string",
                    description: "Default border color for cards"
                }
            }
        },
        typeColors: {
            type: "array",
            description: "Define background colors for different task types",
            itemType: {
                type: "object",
                fields: {
                    type: {
                        type: "string",
                        description: "Task type to match"
                    },
                    backgroundColor: {
                        type: "string",
                        description: "Background color for this task type"
                    },
                    textColor: {
                        type: "string",
                        description: "Optional text color for this task type"
                    },
                    borderColor: {
                        type: "string",
                        description: "Optional border color for this task type"
                    }
                }
            }
        },
        onTaskMove: {
            type: "eventHandler",
            description: "Called when a task is moved",
            argTypes: [
                {
                    name: "taskId",
                    type: "string"
                },
                {
                    name: "newGroup",
                    type: "string"
                }
            ]
        },
        onTaskClick: {
            type: "eventHandler",
            description: "Called when a task is clicked",
            argTypes: [
                {
                    name: "taskId",
                    type: "string"
                }
            ]
        },
        onSortChange: {
            type: "eventHandler",
            description: "Called when sort field changes",
            argTypes: [
                {
                    name: "sortBy",
                    type: "string"
                }
            ]
        },
        onSortDirectionChange: {
            type: "eventHandler",
            description: "Called when sort direction changes",
            argTypes: [
                {
                    name: "direction",
                    type: "string"
                }
            ]
        },
        onSearch: {
            type: "eventHandler",
            description: "Called when search term changes",
            argTypes: [
                {
                    name: "searchTerm",
                    type: "string"
                }
            ]
        }
    }
};

export default KanbanMeta; 