import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, Download, Plus, Edit, Trash2, X } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor?: keyof T;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface GenericListProps<T> {
    data: T[];
    columns: Column<T>[];
    title: string;
    searchKeys: (keyof T)[];
    onAdd?: () => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
}

const GenericList = <T extends { id: string | number }>({
    data,
    columns,
    title,
    searchKeys,
    onAdd,
    onEdit,
    onDelete
}: GenericListProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

    const handleColumnFilterChange = (key: string, value: string) => {
        setColumnFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const filteredData = useMemo(() => {
        let result = data;

        // Global Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(item =>
                searchKeys.some(key => {
                    const value = item[key];
                    return String(value).toLowerCase().includes(lowerTerm);
                })
            );
        }

        // Column Filters
        if (showFilters) {
            Object.entries(columnFilters).forEach(([key, filterValue]) => {
                if (filterValue) {
                    const lowerFilter = filterValue.toLowerCase();
                    result = result.filter(item => {
                        const val = item[key as keyof T];
                        return String(val).toLowerCase().includes(lowerFilter);
                    });
                }
            });
        }

        return result;
    }, [data, searchTerm, searchKeys, columnFilters, showFilters]);

    const handleExport = () => {
        if (filteredData.length === 0) return;

        // Create CSV Headers
        const headers = columns.map(c => c.header).join(',');

        // Create CSV Rows
        const rows = filteredData.map(item => {
            return columns.map(c => {
                let val = '';
                if (c.accessor) {
                    val = String(item[c.accessor]);
                } else {
                    // Start of a best-effort text extraction for rendered content would go here
                    // For now, leave empty if no accessor is present
                    val = '';
                }
                // Escape quotes and wrap in quotes
                return `"${val.replace(/"/g, '""')}"`;
            }).join(',');
        }).join('\n');

        const csvContent = "\uFEFF" + headers + "\n" + rows; // Add BOM for Excel support
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${title}_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <p className="text-sm text-slate-500">تم العثور على {filteredData.length} سجل</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <Plus size={18} />
                            إضافة جديد
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        <Download size={18} />
                        تصدير
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="بحث سريع..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                </div>
                <div className="flex gap-2 hidden sm:flex">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-slate-500 hover:bg-slate-100 border-slate-200'}`}
                        title="فلترة متقدمة"
                    >
                        <Filter size={20} />
                    </button>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200">
                        <Layers size={20} />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-700">فلترة الأعمدة</h4>
                        <button onClick={() => setColumnFilters({})} className="text-xs text-red-600 hover:underline">مسح الفلاتر</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {columns.filter(c => c.accessor).map((col, idx) => (
                            <div key={idx}>
                                <label className="block text-xs font-medium text-slate-500 mb-1">{col.header}</label>
                                <input
                                    type="text"
                                    value={columnFilters[col.accessor as string] || ''}
                                    onChange={(e) => handleColumnFilterChange(col.accessor as string, e.target.value)}
                                    placeholder={`بحث في ${col.header}...`}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>{col.header}</th>
                                ))}
                                {(onEdit || onDelete) && <th className="px-6 py-4">الإجراءات</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        {columns.map((col, idx) => (
                                            <td key={idx} className="px-6 py-4">
                                                {col.render ? col.render(item) : (col.accessor ? String(item[col.accessor]) : '')}
                                            </td>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onEdit && (
                                                        <button onClick={() => onEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md">
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button onClick={() => onDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-12 text-center text-slate-500">
                                        لا توجد بيانات للعرض
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GenericList;
