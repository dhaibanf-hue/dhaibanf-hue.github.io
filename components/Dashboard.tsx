import React from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { StockMovement, InventoryStock } from '../types';


interface DashboardProps {
  movements: StockMovement[];
  inventory: InventoryStock[];
}

const Dashboard: React.FC<DashboardProps> = ({ movements, inventory }) => {
  // Mock aggregation for charts
  const stockByProduct = inventory.map(i => ({
    name: i.sku.split('-')[1], // Simplified name
    qty: i.quantityOnHand
  }));

  const movementActivity = [
    { name: 'السبت', in: 40, out: 24 },
    { name: 'الأحد', in: 30, out: 13 },
    { name: 'الاثنين', in: 20, out: 58 },
    { name: 'الثلاثاء', in: 27, out: 39 },
    { name: 'الأربعاء', in: 18, out: 48 },
    { name: 'الخميس', in: 23, out: 38 },
    { name: 'الجمعة', in: 34, out: 43 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">إجمالي قيمة المخزون</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">159,375.00 ريال</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center">
            <TrendingUp size={12} className="ml-1" /> +12% مقارنة بالشهر الماضي
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">عدد الأصناف</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">1,204</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Package size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">موزعة على 2 مستودعات</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">تنبيهات نقص المخزون</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-2">3</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">يتطلب إجراء فوري</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">تحويلات قيد الانتظار</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">12</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <ArrowRightLeft size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">في الطريق</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">توزيع المخزون</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByProduct}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }} />
                <Bar dataKey="qty" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">حركة المخزون الأسبوعية</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementActivity}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }} />
                <Area type="monotone" dataKey="in" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Movements Table Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="text-lg font-semibold text-slate-800">أحدث حركات المخزون (دفتر الأستاذ)</h4>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">النوع</th>
                <th className="px-6 py-3">المرجع</th>
                <th className="px-6 py-3">الصنف</th>
                <th className="px-6 py-3">الكمية</th>
                <th className="px-6 py-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movements.slice(0, 5).map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${mov.type === 'IN' ? 'bg-green-100 text-green-800' :
                        mov.type === 'OUT' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'}`}>
                      {mov.type === 'IN' ? 'وارد' : mov.type === 'OUT' ? 'صادر' : mov.type === 'CONSUMPTION' ? 'استهلاك' : mov.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{mov.referenceDocId}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{mov.productName}</td>
                  <td className="px-6 py-4">{mov.quantity}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(mov.date).toLocaleDateString('ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;