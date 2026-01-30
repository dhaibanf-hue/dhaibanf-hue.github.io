import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Vendor, PaymentTerms } from '../types';

interface VendorModalProps {
    onClose: () => void;
    onSubmit: (vendor: Omit<Vendor, 'id' | 'currentBalance'>) => void;
    existingVendor?: Vendor;
}

const VendorModal: React.FC<VendorModalProps> = ({ onClose, onSubmit, existingVendor }) => {
    const [formData, setFormData] = useState({
        name: existingVendor?.name || '',
        contactPerson: existingVendor?.contactPerson || '',
        phone: existingVendor?.phone || '',
        address: existingVendor?.address || '',
        taxId: existingVendor?.taxId || '',
        paymentTerms: existingVendor?.paymentTerms || PaymentTerms.CREDIT,
        creditLimit: existingVendor?.creditLimit?.toString() || '',
        cashPercentage: existingVendor?.cashPercentage?.toString() || '30',
        commissionPerUnit: existingVendor?.commissionPerUnit?.toString() || '0'
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            name: formData.name,
            contactPerson: formData.contactPerson,
            phone: formData.phone,
            address: formData.address,
            taxId: formData.taxId,
            paymentTerms: formData.paymentTerms as PaymentTerms,
            creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
            cashPercentage: formData.cashPercentage ? parseFloat(formData.cashPercentage) : undefined,
            commissionPerUnit: formData.commissionPerUnit ? parseFloat(formData.commissionPerUnit) : undefined
        });
    };

    const isHybrid = formData.paymentTerms === PaymentTerms.HYBRID_SALES_LINKED;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {existingVendor ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}
                        </h3>
                        <p className="text-sm text-slate-500">إدارة الحسابات الدائنة</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                اسم المورد <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="مثال: شركة التوريدات المتحدة"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                اسم الشخص المسؤول <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.contactPerson}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                رقم الهاتف <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الرقم الضريبي</label>
                            <input
                                type="text"
                                value={formData.taxId}
                                onChange={(e) => handleChange('taxId', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                شروط الدفع <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.paymentTerms}
                                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            >
                                <option value={PaymentTerms.CASH}>نقدي (فوري)</option>
                                <option value={PaymentTerms.CREDIT}>آجل (على الحساب)</option>
                                <option value={PaymentTerms.HYBRID_SALES_LINKED}>مختلط (مربوط بالمبيعات)</option>
                            </select>
                        </div>

                        {isHybrid && (
                            <>
                                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-700 font-medium mb-2">
                                        ⚙️ إعدادات الدفع المختلط (مربوط بالمبيعات)
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">نسبة الدفع النقدي %</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.cashPercentage}
                                                onChange={(e) => handleChange('cashPercentage', e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">عمولة لكل وحدة مباعة (ر.س)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.commissionPerUnit}
                                                onChange={(e) => handleChange('commissionPerUnit', e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">حد الائتمان (اختياري)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.creditLimit}
                                onChange={(e) => handleChange('creditLimit', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-sm"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm"
                        >
                            <Save size={16} />
                            حفظ المورد
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorModal;
