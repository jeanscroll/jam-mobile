const DataGridMeta = {
    name: "DataGrid",
    section: "🔖 Sitex",
    displayName: "Data Grid",
    description: "Table view for task management with sorting, filtering, pagination, and export capabilities",
    thumbnailUrl: "https://static1.plasmic.app/insertables/table.svg",
    importPath: "./components/others/data_grid/data_grid",
    props: {
        tasks: {
            type: "array",
            defaultValue: [],
            description: "Array of data to display in the grid",
            itemType: {
                type: "object",
                fields: {
                    id: "string",
                    title: "string",
                    status: "string",
                    type: "string",
                    budget: "string",
                    date_start: "string",
                    date_end: "string",
                    comments: "string",
                    created_at: "string",
                    updated_at: "string",
                    last_updated_by: "string",
                    model: "string"
                }
            }
        },
        containerClassName: {
            type: "string",
            description: "Additional CSS class for the container"
        },
        headerClassName: {
            type: "string",
            description: "Additional CSS class for the header"
        },
        rowClassName: {
            type: "string",
            description: "Additional CSS class for each row"
        },
        onTaskClick: {
            type: "eventHandler",
            description: "Called when a row is clicked",
            argTypes: [
                {
                    name: "taskId",
                    type: "string"
                }
            ]
        },
        onEditClick: {
            type: "eventHandler",
            description: "Called when the edit button is clicked",
            argTypes: [
                {
                    name: "taskId",
                    type: "string"
                }
            ]
        },
        onDeleteClick: {
            type: "eventHandler",
            description: "Called when the delete button is clicked",
            argTypes: [
                {
                    name: "taskId",
                    type: "string"
                }
            ]
        },
        onCopyClick: {
            type: "eventHandler",
            description: "Called when the copy button is clicked",
            argTypes: [
                {
                    name: "taskId",
                    type: "string"
                }
            ]
        },
        columnLabels: {
            type: "object",
            description: "Custom labels for column headers",
            defaultValue: {
                id: "ID",
                title: "Nom",
                status: "Statut",
                type: "Type",
                budget: "Budget (k€)",
                date_start: "Date de début",
                date_end: "Heures Dispositif",
                comments: "Comments",
                created_at: "Created At",
                updated_at: "Updated At",
                last_updated_by: "Last Updated By",
                model: "Model"
            }
        },
        visibleColumns: {
            type: "array",
            description: "Array of column keys to display",
            itemType: "string"
        },
        columnOrder: {
            type: "array",
            description: "Order of columns to display",
            itemType: "string"
        },
        pageSize: {
            type: "number",
            description: "Number of items per page",
            defaultValue: 10
        },
        currentPage: {
            type: "number",
            description: "Current page number",
            defaultValue: 1
        },
        onPageChange: {
            type: "eventHandler",
            description: "Called when page is changed",
            argTypes: [
                {
                    name: "page",
                    type: "number"
                }
            ]
        },
        totalItems: {
            type: "number",
            description: "Total number of items (optional, for server-side pagination)"
        },
        filters: {
            type: "array",
            description: "Array of column filters",
            itemType: {
                type: "object",
                fields: {
                    field: "string",
                    value: "string",
                    operator: {
                        type: "choice",
                        options: ["equals", "contains", "greaterThan", "lessThan"]
                    }
                }
            }
        },
        onFilterChange: {
            type: "eventHandler",
            description: "Called when filters are changed",
            argTypes: [
                {
                    name: "filters",
                    type: "array"
                }
            ]
        },
        columnStyles: {
            type: "object",
            description: "Custom styles for columns",
            defaultValue: {}
        },
        enableExport: {
            type: "boolean",
            description: "Enable export functionality",
            defaultValue: false
        },
        exportFormats: {
            type: "choice",
            description: "Format d'export",
            defaultValue: "csv",
            options: ["csv", "excel"]
        },
        exportIcon: {
            type: "slot",
            description: "Icon for the export button"
        },
        onExport: {
            type: "eventHandler",
            description: "Called when export is triggered",
            argTypes: [
                {
                    name: "format",
                    type: "string"
                }
            ]
        },
        isLoading: {
            type: "boolean",
            description: "Show loading state",
            defaultValue: false
        },
        error: {
            type: "object",
            description: "Error object to display error state"
        },
        emptyStateMessage: {
            type: "string",
            description: "Message to show when no data is available",
            defaultValue: "Aucune donnée disponible"
        },
        loadingComponent: {
            type: "slot",
            description: "Custom loading component"
        },
        columnHeaders: {
            type: "object",
            description: "Custom header configuration for columns",
            defaultValue: {}
        },
        theme: {
            type: "object",
            description: "Theme configuration for the grid",
            defaultValue: {
                headerBgColor: '#ECE6DF',
                rowBgColor: '#ffffff',
                hoverBgColor: '#f9f5ff',
                borderColor: '#d9cdbf',
                textColor: '#333333',
                fontSize: '14px'
            },
            fields: {
                headerBgColor: {
                    type: "string",
                    description: "Background color for the header"
                },
                rowBgColor: {
                    type: "string",
                    description: "Background color for rows"
                },
                hoverBgColor: {
                    type: "string",
                    description: "Background color when hovering over rows"
                },
                borderColor: {
                    type: "string",
                    description: "Color for borders"
                },
                textColor: {
                    type: "string",
                    description: "Color for text"
                },
                fontSize: {
                    type: "string",
                    description: "Font size for the grid"
                }
            }
        },
        responsive: {
            type: "object",
            description: "Responsive configuration for the grid",
            defaultValue: {
                minWidth: "100%",
                horizontalOverflow: "auto",
                verticalOverflow: "auto",
                stickyHeader: true,
                compactOnMobile: true,
                breakpoint: 768
            },
            fields: {
                minWidth: {
                    type: "string",
                    description: "Minimum width of the table (e.g., '100%', '800px')"
                },
                maxWidth: {
                    type: "string",
                    description: "Maximum width of the table"
                },
                height: {
                    type: "string",
                    description: "Fixed height of the table container"
                },
                maxHeight: {
                    type: "string",
                    description: "Maximum height of the table container"
                },
                horizontalOverflow: {
                    type: "choice",
                    options: ["auto", "scroll", "hidden"],
                    description: "How to handle horizontal overflow",
                    defaultValue: "auto"
                },
                verticalOverflow: {
                    type: "choice",
                    options: ["auto", "scroll", "hidden"],
                    description: "How to handle vertical overflow",
                    defaultValue: "auto"
                },
                stickyHeader: {
                    type: "boolean",
                    description: "Keep header fixed while scrolling",
                    defaultValue: true
                },
                compactOnMobile: {
                    type: "boolean",
                    description: "Use compact layout on mobile devices",
                    defaultValue: true
                },
                breakpoint: {
                    type: "number",
                    description: "Mobile breakpoint in pixels",
                    defaultValue: 768
                }
            }
        }
    }
};

export default DataGridMeta; 