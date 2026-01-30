import React from 'react';
import { Search, Filter, MoreVertical, AlertCircle, Tag, Layers } from 'lucide-react';
import { inventory as mockInventory } from '../mockData';
import { ProductType, InventoryStock } from '../types';

interface InventoryListProps {
  inventory: InventoryStock[];
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="بحث برقم الصنف، الاسم، أو الموقع..."
            className="w-full pr-10 pl-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium">
            <Layers size={18} />
            حسب النوع
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium">
            <Filter size={18} />
            فلترة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">تفاصيل المنتج</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">الموقع</th>
                <th className="px-6 py-4 text-center">الرصيد الحالي</th>
                <th className="px-6 py-4 text-center">المحجوز</th>
                <th className="px-6 py-4 text-center">المتاح</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventory.map((item) => {
                const available = item.quantityOnHand - item.quantityReserved;
                const isLowStock = available < 20; // Mock threshold

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.productName}</p>
                        <p className="font-mono text-xs text-slate-500 mt-1">{item.sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.productType === ProductType.RESALE ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          <Tag size={10} /> بضاعة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          <Layers size={10} /> مستهلك
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-medium">{item.warehouseId === 'wh-001' ? 'الرئيسي' : 'الفرعي'}</span>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 w-fit px-1.5 py-0.5 rounded mt-1">{item.locationId.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-slate-700">{item.quantityOnHand}</td>
                    <td className="px-6 py-4 text-center font-mono text-slate-500 bg-slate-50/50">{item.quantityReserved}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-900">{available}</td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertCircle size={12} /> منخفض
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          متوفر
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryList;