import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Product, ProductType } from '../types';

interface ProductModalProps {
    onClose: () => void;
    onSubmit: (productData: Omit<Product, 'id'>) => void;
    existingProducts: Product[];
}

const ProductModal: React.FC<ProductModalProps> = ({ onClose, onSubmit, existingProducts }) => {
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState('وحدة');
    const [minReorderLevel, setMinReorderLevel] = useState(10);

    // Auto-generate SKU on mount
    useEffect(() => {
        // Logic: Find max number in existing SKUs or just count + 1
        // Assuming format "PROD-XXX"
        const nextNum = existingProducts.length + 1;
        const formattedNum = nextNum.toString().padStart(3, '0');
        setSku(`PROD-${formattedNum}`);
    }, [existingProducts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cost) return;

        onSubmit({
            name,
            sku, // Auto-generated
            currentAvgCost: parseFloat(cost),
            description,
            unit,
            minReorderLevel,
            categoryId: '',
            type: ProductType.RESALE,
            isSerialized: false,
            isBatchTracked: false
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">إضافة صنف جديد</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الرقم التسلسلي (SKU)</label>
                            <input
                                type="text"
                                value={sku}
                                readOnly
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm cursor-not-allowed"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">يتم الإنشاء تلقائياً</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">اسم الصنف <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="مثال: لابتوب ديل 15 بوصة"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة (ر.س) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الوحدة</label>
                            <input
                                type="text"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-sm"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm button-effect"
                        >
                            <Save size={16} />
                            حفظ الصنف
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
