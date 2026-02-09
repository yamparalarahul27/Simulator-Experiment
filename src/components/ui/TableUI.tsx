import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export interface Column<T = any> {
    key: string;
    header: string;
    render?: (value: any, row: T) => React.ReactNode;
}

interface TableUIProps<T = any> {
    data: T[];
    columns?: Column<T>[];
    maxHeight?: string;
    className?: string;
}

const toTitleCase = (str: string) => {
    const result = str.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
    return result.charAt(0).toUpperCase() + result.slice(1);
};

export const TableUI = <T extends Record<string, any>>({
    data,
    columns,
    maxHeight = '80vh',
    className = ''
}: TableUIProps<T>) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const resizeStartX = useRef<number>(0);
    const resizeStartWidth = useRef<number>(0);

    // Auto-generate columns if not provided
    const tableColumns = useMemo(() => {
        if (columns) return columns;
        if (data.length === 0) return [];

        return Object.keys(data[0]).map((key) => ({
            key,
            header: toTitleCase(key)
        })) as Column<T>[];
    }, [columns, data]);

    // Initialize column widths
    useEffect(() => {
        if (tableColumns.length > 0 && Object.keys(columnWidths).length === 0) {
            const initialWidths: { [key: string]: number } = {};
            // Distribute width evenly initially or set a min default
            const defaultWidth = 200; // px
            tableColumns.forEach(col => {
                initialWidths[col.key] = defaultWidth;
            });
            setColumnWidths(initialWidths);
        }
    }, [tableColumns]); // Only run when columns change effectively

    // Sorting Logic
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' };
                return null; // Reset sort
            }
            return { key, direction: 'asc' };
        });
    };

    // Resizing Handlers
    const startResizing = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(key);
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = columnWidths[key] || 150;
    };

    // We need a stable reference for the event handlers to remove them correctly, 
    // but they need access to the current resizing state vars (which are in refs).
    // Let's define the handlers inside the effect or use a wrapper.

    // Better approach: Use a dedicated effect for the drag operation
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!resizingColumn) return;
            const diff = e.clientX - resizeStartX.current;
            const newWidth = Math.max(50, resizeStartWidth.current + diff); // Min width 50px
            setColumnWidths(prev => ({
                ...prev,
                [resizingColumn]: newWidth
            }));
        };

        const onMouseUp = () => {
            setResizingColumn(null);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        if (resizingColumn) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [resizingColumn]);


    return (
        <div
            className={`w-full overflow-hidden rounded-none border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl flex flex-col ${className}`}
            style={{ maxHeight }}
        >
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                <table className="w-full text-left text-sm border-collapse table-fixed">
                    <thead className="sticky top-0 z-10 bg-black/90 backdrop-blur-md shadow-sm">
                        <tr>
                            {tableColumns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{ width: columnWidths[col.key] }}
                                    className="relative px-6 py-4 font-semibold text-white/80 border-b border-white/10 select-none group"
                                >
                                    <div
                                        className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors overflow-hidden"
                                        onClick={() => handleSort(col.key)}
                                    >
                                        <span className="truncate">{col.header}</span>
                                        <span className="text-white/40 group-hover:text-white/60 flex-shrink-0">
                                            {sortConfig?.key === col.key ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                            ) : (
                                                <ChevronsUpDown size={14} />
                                            )}
                                        </span>
                                    </div>

                                    {/* Resize Handle */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-500/50 transition-colors z-20"
                                        onMouseDown={(e) => startResizing(e, col.key)}
                                        onClick={(e) => e.stopPropagation()} // Prevent sorting when resizing
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedData.length > 0 ? (
                            sortedData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className="hover:bg-white/5 transition-colors"
                                >
                                    {tableColumns.map((col) => (
                                        <td
                                            key={`${rowIndex}-${col.key}`}
                                            className="px-6 py-4 text-white/70 overflow-hidden text-ellipsis whitespace-nowrap border-r border-transparent hover:border-white/5 last:border-r-0"
                                            style={{ maxWidth: columnWidths[col.key] }} // Ensure truncation works
                                        >
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={tableColumns.length} className="px-6 py-12 text-center text-white/40">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
