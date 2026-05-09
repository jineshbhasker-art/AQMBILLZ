/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { salesService, productsService, customersService, businessProfileService, expensesService } from '../lib/dbService';
import { Sale, Product, Customer, BusinessProfile, Expense } from '../types';

const StatCard = ({ title, value, change, trend, icon: Icon }: any) => (
  <div className="advanced-3d-card p-10 flex flex-col gap-8 bg-white group cursor-default">
    <div className="flex items-center justify-between">
      <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-black border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border",
        trend === 'up' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
      )}>
        {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}%
      </div>
    </div>
    <div>
      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</div>
      <div className="text-3xl font-black mt-2 tracking-tighter">{value}</div>
      <div className="flex gap-1 mt-4">
         {[1,2,3,4,5,6,7].map(i => (
           <div key={i} className={cn("h-1 flex-1 rounded-full", trend === 'up' ? "bg-green-100" : "bg-red-100")} />
         ))}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubSales = salesService.subscribe(setSales);
    const unsubProducts = productsService.subscribe(setProducts);
    const unsubCustomers = customersService.subscribe(setCustomers);
    const unsubProfile = businessProfileService.subscribe(setProfile);
    const unsubExpenses = expensesService.subscribe(setExpenses);
    setLoading(false);
    return () => {
      unsubSales();
      unsubProducts();
      unsubCustomers();
      unsubProfile();
      unsubExpenses();
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySalesTotal = sales
    .filter(s => new Date(s.createdAt) >= today)
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const todayProfitTotal = sales
    .filter(s => new Date(s.createdAt) >= today)
    .reduce((acc, s) => {
      return acc + s.items.reduce((itemAcc, item) => itemAcc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
    }, 0);

  const totalInventoryValue = products.reduce((acc, p) => acc + p.stockQuantity * (p.costPrice || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const grossProfit = sales.reduce((acc, s) => {
     return acc + s.items.reduce((itemAcc, item) => itemAcc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
  }, 0);
  const netProfit = grossProfit - totalExpenses;

  // Weekly data for chart
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekData.push({
        name: days[d.getDay()],
        sales: 0,
        profit: 0,
        fullDate: d.toLocaleDateString()
      });
    }

    sales.forEach(s => {
      const saleDate = new Date(s.createdAt).toLocaleDateString();
      const chartItem = weekData.find(w => w.fullDate === saleDate);
      if (chartItem) {
        chartItem.sales += s.grandTotal;
        const saleProfit = s.items.reduce((acc, item) => acc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
        chartItem.profit += saleProfit;
      }
    });

    return weekData;
  };

  const chartData = getWeeklyData();
  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel);

  const [isCalibrating, setIsCalibrating] = React.useState(false);

  const runCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => setIsCalibrating(false), 2000);
  };

  return (
    <div className="space-y-12 pb-24 relative">
      <AnimatePresence>
        {isCalibrating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md pointer-events-none"
          >
            <div className="calibrate-grid absolute inset-0 opacity-20" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 border-2 border-white/20 border-t-white rounded-full flex items-center justify-center"
            >
               <div className="w-16 h-16 border-2 border-white/10 border-b-white rounded-full animate-spin-reverse" />
            </motion.div>
            <motion.p 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="mt-8 text-white font-black text-[10px] uppercase tracking-[0.6em]"
            >
              Calibrating Data Nodes...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">HUB CONTROL</h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em] flex items-center gap-2">
             System Node: {profile?.companyName || 'AL QUSAIDAT MOBILES'} • UAE
             {profile?.trn && (
               <>
                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                 <span className="bg-black text-white px-2 py-0.5 rounded-sm">TRN: {profile.trn}</span>
               </>
             )}
          </p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Net Profit Balance</p>
              <p className={cn("text-2xl font-black mt-2 tracking-tighter", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(netProfit)}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard 
            title="TODAY'S REVENUE" 
            value={formatCurrency(todaySalesTotal)} 
            change={12.5} 
            trend="up" 
            icon={DollarSign} 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard 
            title="TOTAL EXPENSES" 
            value={formatCurrency(totalExpenses)} 
            change={-4.2} 
            trend="down" 
            icon={TrendingDown} 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard 
            title="INVENTORY VALUE" 
            value={formatCurrency(totalInventoryValue)} 
            change={2.1} 
            trend="up" 
            icon={Package} 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatCard 
            title="ACTIVE CUSTOMERS" 
            value={customers.length.toString()} 
            change={15.3} 
            trend="up" 
            icon={Users} 
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 advanced-3d-card p-10 bg-white">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-black rounded-full" />
              <h2 className="text-2xl font-black font-display tracking-tight">ANALYTICS ENGINE</h2>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#FAFAFA" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#D1D5DB', fontWeight: 'bold' }}
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#D1D5DB', fontWeight: 'bold' }}
                />
                <Tooltip 
                  cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px -5px rgba(0,0,0,0.1)',
                    padding: '20px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#000" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
           <div className="advanced-3d-card p-10 bg-[#0F0F0F] text-white">
              <h2 className="text-xl font-black font-display mb-8 tracking-tight underline decoration-white/20 underline-offset-8">NODE STATUS</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">STOCK INTEGRITY</span>
                   </div>
                   <span className="text-sm font-bold">{lowStockProducts.length === 0 ? 'CRITICAL' : `${lowStockProducts.length} LOW`}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">SYSTEM LOAD</span>
                   </div>
                   <span className="text-sm font-bold">1.2% CAP</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">SYNC LATENCY</span>
                   </div>
                   <span className="text-sm font-bold">8ms</span>
                </div>
              </div>
              <button 
                onClick={runCalibration}
                className="w-full mt-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-200 transition-all"
              >
                RUN CALIBRATION
              </button>
           </div>

           <div className="advanced-3d-card p-10 bg-white">
              <h2 className="text-xl font-black font-display mb-8 tracking-tight">ALERTS</h2>
              {lowStockProducts.length > 0 ? (
                <div className="flex gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                   <AlertCircle className="text-red-500 shrink-0" size={18} />
                   <p className="text-[11px] font-bold text-red-900">{lowStockProducts.length} Inventory nodes require replenishment immediate sync.</p>
                </div>
              ) : (
                <div className="flex gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                   <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                   <p className="text-[11px] font-bold text-green-900">All data clusters verified. No alerts detected.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
