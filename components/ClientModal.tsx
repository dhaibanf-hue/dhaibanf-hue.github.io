import React, { useState } from 'react';
import { X, Save, MapPin } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
    onClose: () => void;
    onSubmit: (client: Omit<Client, 'id' | 'currentBalance'>) => void;
    existingClient?: Client;
}

const ClientModal: React.FC<ClientModalProps> = ({ onClose, onSubmit, existingClient }) => {
    const [formData, setFormData] = useState({
        name: existingClient?.name || '',
        contactPerson: existingClient?.contactPerson || '',
        phone: existingClient?.phone || '',
        gpsLocation: existingClient?.gpsLocation || '',
        category: existingClient?.category || 'Retail',
        collectionPeriodDays: existingClient?.collectionPeriodDays?.toString() || '30',
        creditLimit: existingClient?.creditLimit?.toString() || '10000',
        isActive: existingClient?.isActive !== undefined ? existingClient.isActive : true
    });

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            name: formData.name,
            contactPerson: formData.contactPerson,
            phone: formData.phone,
            gpsLocation: formData.gpsLocation,
            category: formData.category,
            collectionPeriodDays: parseInt(formData.collectionPeriodDays),
            creditLimit: parseFloat(formData.creditLimit),
            isActive: formData.isActive
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {existingClient ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}
                        </h3>
                        <p className="text-sm text-slate-500">إدارة الحسابات المدينة</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                اسم العميل / المتجر <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                                placeholder="مثال: سوبر ماركت النخيل"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                اسم المسؤول <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.contactPerson}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
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
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <MapPin size={16} className="text-green-600" />
                                الموقع الجغرافي / العنوان
                            </label>
                            <input
                                type="text"
                                value={formData.gpsLocation}
                                onChange={(e) => handleChange('gpsLocation', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                placeholder="مثال: 24.7136, 46.6753 أو النخيل، شارع الملك فهد"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                فئة العميل <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            >
                                <option value="Retail">تجزئة (Retail)</option>
                                <option value="Wholesale">جملة (Wholesale)</option>
                                <option value="Distributor">موزع</option>
                                <option value="Individual">فرد</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                فترة التحصيل (أيام) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.collectionPeriodDays}
                                onChange={(e) => handleChange('collectionPeriodDays', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">مثال: 15 يوم، 30 يوم</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                حد الائتمان (ر.س) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={formData.creditLimit}
                                onChange={(e) => handleChange('creditLimit', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => handleChange('isActive', e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                                حساب نشط
                            </label>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            <strong>ملاحظة:</strong> سيتم تفعيل نظام التوزيع "الكونسنمنت" - حيث يتم احتساب المستحقات بناءً على تقارير المبيعات من العميل.
                        </p>
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
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm shadow-sm"
                        >
                            <Save size={16} />
                            حفظ العميل
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientModal;
