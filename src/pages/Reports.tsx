/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Download, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Package,
  Search,
  Plus
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const salesData = [
  { name: 'Jan', sales: 45000, profit: 12000, vat: 2250 },
  { name: 'Feb', sales: 52000, profit: 15000, vat: 2600 },
  { name: 'Mar', sales: 48000, profit: 14000, vat: 2400 },
  { name: 'Apr', sales: 61000, profit: 19000, vat: 3050 },
  { name: 'May', sales: 55000, profit: 17000, vat: 2750 },
  { name: 'Jun', sales: 67000, profit: 22000, vat: 3350 },
];

const categoryData = [
  { name: 'New Phones', value: 45, color: '#000000' },
  { name: 'Used Phones', value: 30, color: '#333333' },
  { name: 'Repairs', value: 15, color: '#666666' },
  { name: 'Accessories', value: 10, color: '#999999' },
];

import { salesService, productsService, purchasesService, expensesService, businessProfileService } from '../lib/dbService';
import { Sale, Product, ProductType, PurchaseInvoice, PaymentMethod, Expense, BusinessProfile } from '../types';
import { Percent, Calculator, History, FileText } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = React.useState<'analytics' | 'sales' | 'vat'>('analytics');
  const [timeframe, setTimeframe] = React.useState('Monthly');
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [purchases, setPurchases] = React.useState<PurchaseInvoice[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [expandedSaleId, setExpandedSaleId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const [loading, setLoading] = React.useState(true);
  const [vatRateFilter, setVatRateFilter] = React.useState<string>('all');

  React.useEffect(() => {
    const unsubSales = salesService.subscribe(setSales);
    const unsubProducts = productsService.subscribe(setProducts);
    const unsubPurchases = purchasesService.subscribe(setPurchases);
    const unsubExpenses = expensesService.subscribe(setExpenses);
    const unsubProfile = businessProfileService.subscribe(setProfile);
    setLoading(false);
    return () => {
      unsubSales();
      unsubProducts();
      unsubPurchases();
      unsubExpenses();
      unsubProfile();
    };
  }, []);

  const filteredSalesForVat = sales.filter(s => {
    const matchesDate = (!dateRange.start || new Date(s.createdAt) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(s.createdAt) <= new Date(dateRange.end));
    
    if (vatRateFilter === 'all') return matchesDate;
    
    // Check if any item in the sale matches the target VAT rate
    // Standard rate in UAE is 5%.
    const hasTargetVat = s.vatTotal > 0;
    if (vatRateFilter === '5%') return matchesDate && hasTargetVat;
    if (vatRateFilter === '0%') return matchesDate && !hasTargetVat;
    
    return matchesDate;
  });

  const filteredPurchasesForVat = purchases.filter(p => {
    const matchesDate = (!dateRange.start || new Date(p.date) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(p.date) <= new Date(dateRange.end));
    
    if (vatRateFilter === 'all') return matchesDate;
    const hasTargetVat = p.vatTotal > 0;
    if (vatRateFilter === '5%') return matchesDate && hasTargetVat;
    if (vatRateFilter === '0%') return matchesDate && !hasTargetVat;
    
    return matchesDate;
  });

  const filteredExpensesForVat = expenses.filter(e => {
    const matchesDate = (!dateRange.start || new Date(e.date) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(e.date) <= new Date(dateRange.end));
    
    if (vatRateFilter === 'all') return matchesDate;
    const hasTargetVat = (e.vatAmount || 0) > 0;
    if (vatRateFilter === '5%') return matchesDate && hasTargetVat;
    if (vatRateFilter === '0%') return matchesDate && !hasTargetVat;
    
    return matchesDate;
  });

  const totalVATonSales = filteredSalesForVat.reduce((acc, s) => acc + s.vatTotal, 0);
  const totalVATonPurchases = filteredPurchasesForVat.reduce((acc, p) => acc + p.vatTotal, 0) + 
                             filteredExpensesForVat.reduce((acc, e) => acc + (e.vatAmount || 0), 0);
  
  const totalTaxableSales = filteredSalesForVat.reduce((acc, s) => acc + s.subtotal, 0);
  const totalTaxablePurchases = filteredPurchasesForVat.reduce((acc, p) => acc + (p.subtotal || (p.grandTotal - p.vatTotal)), 0) +
                               filteredExpensesForVat.reduce((acc, e) => acc + (e.amount - (e.vatAmount || 0)), 0);
  const netVAT = totalVATonSales - totalVATonPurchases;

  // Process sales data for charts
  const getMonthlySales = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      last6Months.push({
        name: months[targetMonth],
        sales: 0,
        profit: 0,
        vat: 0
      });
    }

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      const saleMonth = months[saleDate.getMonth()];
      const chartItem = last6Months.find(m => m.name === saleMonth);
      if (chartItem) {
        chartItem.sales += sale.grandTotal;
        chartItem.vat += sale.vatTotal;
        // Calculate profit if unitCost is available
        sale.items.forEach(item => {
           chartItem.profit += (item.unitPrice - (item.unitCost || 0)) * item.quantity;
        });
      }
    });

    return last6Months;
  };

  const processedSalesData = getMonthlySales();

  // Category Distribution
  const typeDistribution = [
    { name: 'New Phones', type: ProductType.NEW, color: '#000000' },
    { name: 'Used Phones', type: ProductType.USED, color: '#333333' },
    { name: 'Repairs', type: ProductType.REPAIR, color: '#666666' },
    { name: 'Accessories', type: ProductType.ACCESSORY, color: '#999999' },
  ].map(cat => {
    const count = products.filter(p => p.type === cat.type).length;
    const percentage = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
    return { ...cat, value: percentage };
  });

  // Profit/Loss summary
  const totalSales = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalCost = sales.reduce((acc, s) => {
    return acc + s.items.reduce((itemAcc, item) => itemAcc + (item.unitCost || 0) * item.quantity, 0);
  }, 0);
  const grossProfit = totalSales - totalCost;
  const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  const filteredSales = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cashierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Printable Report Component */}
      <div id="report-printable" className="hidden print:block print:bg-white print:p-0 print:m-0 w-full font-sans text-black">
        <style>
          {`
            @media print {
              @page { size: A4; margin: 20mm; }
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
          `}
        </style>

        {/* Header */}
        <div className="border-b-4 border-black pb-8 mb-10 flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{profile?.companyName || 'AL QUSAIDAT MOBILES'}</h1>
            <p className="text-sm font-bold text-gray-600">{profile?.address}</p>
            <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">
              <span>TRN: {profile?.trn || '100XXXXXXXXXXXX'}</span>
              {profile?.phone && <span>TEL: {profile?.phone}</span>}
              {profile?.email && <span>EMAIL: {profile?.email}</span>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black uppercase tracking-[0.2em]">{reportType === 'vat' ? 'VAT RETURN REPORT' : 'FINANCIAL STATEMENT'}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">GENERATED: {new Date().toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PERIOD: {dateRange.start || 'INITIAL'} TO {dateRange.end || 'PRESENT'}</p>
            {reportType === 'vat' && vatRateFilter !== 'all' && (
              <p className="text-[10px] text-black font-black uppercase tracking-widest">FILTERED VAT RATE: {vatRateFilter}</p>
            )}
          </div>
        </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-50 p-6 border-l-4 border-black">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Taxable Sales</p>
            <p className="text-2xl font-black">{formatCurrency(totalTaxableSales)}</p>
          </div>
          <div className="bg-gray-50 p-6 border-l-4 border-gray-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">VAT Collected (Output)</p>
            <p className="text-2xl font-black">{formatCurrency(totalVATonSales)}</p>
          </div>
          <div className="bg-gray-50 p-6 border-l-4 border-black">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">VAT Recoverable (Input)</p>
            <p className="text-2xl font-black text-green-600">{formatCurrency(totalVATonPurchases)}</p>
          </div>
        </div>

        {reportType === 'vat' && (
          <div className="bg-black text-white p-8 mb-12 flex justify-between items-center rounded-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Net VAT Reconciliation</p>
              <h3 className="text-3xl font-black uppercase tracking-tighter mt-1">TOTAL {netVAT >= 0 ? 'PAYABLE' : 'REFUNDABLE'}</h3>
            </div>
            <div className="text-4xl font-black">{formatCurrency(Math.abs(netVAT))}</div>
          </div>
        )}

        {/* Transaction Table */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Transaction Registry Detail</h3>
          <table className="w-full text-left border-collapse border border-gray-100">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-[9px] font-black uppercase tracking-widest border border-gray-200">Date</th>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest border border-gray-200">Ref / Invoice</th>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest border border-gray-200">Type</th>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest border border-gray-200 text-right">Gross (Incl. VAT)</th>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest border border-gray-200 text-right">VAT (5%)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...filteredSalesForVat.map(s => ({ ...s, vatType: 'Output', displayType: 'SALE' })),
                ...filteredPurchasesForVat.map(p => ({ ...p, vatType: 'Input', displayType: 'PURCHASE' })),
                ...filteredExpensesForVat.map(e => ({ ...e, vatType: 'Input', displayType: 'EXPENSE', invoiceNumber: (e as any).reference || 'EXPENSE', vatTotal: (e as any).vatAmount || 0, grandTotal: (e as any).amount }))
              ]
              .sort((a, b) => new Date(b.createdAt || (b as any).date).getTime() - new Date(a.createdAt || (a as any).date).getTime())
              .map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="p-3 text-[10px] border border-gray-100">{new Date(item.createdAt || (item as any).date).toLocaleDateString()}</td>
                  <td className="p-3 text-[10px] font-bold border border-gray-100">{item.invoiceNumber}</td>
                  <td className="p-3 text-[9px] font-black border border-gray-100">{item.displayType}</td>
                  <td className="p-3 text-[10px] font-bold text-right border border-gray-100">{formatCurrency(item.grandTotal)}</td>
                  <td className="p-3 text-[10px] font-black text-right border border-gray-100">{formatCurrency(item.vatTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-dashed border-gray-200 flex justify-between items-start opacity-50">
          <div className="text-[10px] font-bold uppercase tracking-widest">
            <p>Certified System Generated Report</p>
            <p>UAE Federal Tax Authority Compliant</p>
          </div>
          <div className="text-right text-[8px] font-black uppercase tracking-widest">
            <p>{profile?.companyName}</p>
            <p>Confidential Documentation</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">System Performance</h1>
          <p className="text-gray-400">Detailed performance insights and financial reporting.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-100">
             <button 
               onClick={() => setReportType('analytics')}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 reportType === 'analytics' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
               )}
             >
               Analytics
             </button>
             <button 
               onClick={() => setReportType('sales')}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 reportType === 'sales' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
               )}
             >
               Sales Registry
             </button>
             <button 
               onClick={() => setReportType('vat')}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 reportType === 'vat' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
               )}
             >
               VAT Report
             </button>
          </div>
          <div className="relative group">
            <button className="bg-white border border-gray-100 px-4 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all text-sm">
              <Calendar size={18} /> {timeframe} <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto z-50">
               {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'].map(t => (
                 <button key={t} onClick={() => setTimeframe(t)} className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors">{t}</button>
               ))}
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-black/10"
          >
            <Download size={20} /> EXPORT PDF
          </button>
        </div>
      </div>

      {reportType === 'analytics' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 premium-card p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Revenue & VAT Performance</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Consolidated Sales Flow</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-black" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gross Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">VAT (5%)</span>
                  </div>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedSalesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#999'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#999'}} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="vat" stroke="#999999" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="premium-card p-8 flex flex-col h-full bg-white border border-gray-100 rounded-[2rem] shadow-sm">
              <h3 className="text-lg font-bold mb-2">Inventory Mix</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-8">Stock by Type</p>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-6">
                {typeDistribution.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-sm font-medium text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="premium-card p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold">Profit & Loss Summary</h3>
                  <p className="text-xs text-gray-400 font-medium">Income vs Expenses Analysis</p>
                </div>
                <button className="p-2.5 border border-gray-100 rounded-xl text-gray-400 hover:text-black hover:bg-gray-50 transition-all">
                  <Printer size={18} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <ArrowUpRight size={20} />
                      </div>
                      <span className="text-sm font-bold">GROSS INCOME</span>
                    </div>
                    <span className="text-sm font-black">{formatCurrency(totalSales)}</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[100%]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                        <ArrowDownLeft size={20} />
                      </div>
                      <span className="text-sm font-bold">COST OF GOODS</span>
                    </div>
                    <span className="text-sm font-black">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${totalSales > 0 ? (totalCost / totalSales) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">NET OPERATING MARGIN</div>
                    <div className="text-2xl font-black">{formatCurrency(grossProfit)}</div>
                  </div>
                  <div className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter shadow-lg shadow-black/20">
                    {profitMargin.toFixed(1)}% MARGIN
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-card p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold">Summary Insights</h3>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Total Stock Available', value: products.reduce((acc, p) => acc + p.stockQuantity, 0), icon: Package },
                  { label: 'Completed Sales Count', value: sales.length, icon: CheckCircle2 },
                  { label: 'Low Stock Alerts', value: products.filter(p => p.stockQuantity <= p.minStockLevel).length, icon: AlertTriangle },
                ].map((insight, i) => (
                  <div key={i} className="flex items-center justify-between p-2 -mx-2 rounded-2xl transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <insight.icon size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{insight.label}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black">{insight.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : reportType === 'sales' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
             <div className="space-y-1">
               <h2 className="text-2xl font-black font-display tracking-tight uppercase">SALES REGISTRY MODULE</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Transaction Audit Ledger</p>
             </div>
             <div className="relative w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search registry..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
               />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Invoice ID</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Timestamp</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Subtotal</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">VAT Amount</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Discount</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSales.map(s => (
                  <React.Fragment key={s.id}>
                    <tr 
                      onClick={() => setExpandedSaleId(expandedSaleId === s.id ? null : s.id)}
                      className={cn(
                        "hover:bg-gray-50/30 transition-all group cursor-pointer",
                        expandedSaleId === s.id ? "bg-gray-50/50" : ""
                      )}
                    >
                      <td className="px-10 py-8 font-mono text-sm font-black uppercase flex items-center gap-4">
                        <button className="text-gray-300 group-hover:text-black transition-colors">
                          {expandedSaleId === s.id ? <Search className="rotate-45 transition-transform" size={14} /> : <Search size={14} />}
                        </button>
                        {s.invoiceNumber}
                      </td>
                      <td className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="px-10 py-8 text-sm font-bold text-gray-600">{formatCurrency(s.subtotal)}</td>
                      <td className="px-10 py-8 text-sm font-bold text-red-500">{formatCurrency(s.vatTotal)}</td>
                      <td className="px-10 py-8 text-sm font-bold text-blue-500">{s.discount > 0 ? `-${formatCurrency(s.discount)}` : '-'}</td>
                      <td className="px-10 py-8 text-right text-xl font-black font-display tracking-tighter">
                        {formatCurrency(s.grandTotal)}
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedSaleId === s.id && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50/30 px-10 py-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="py-10 space-y-8"
                            >
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Sold Items</h4>
                                  <div className="space-y-2">
                                    {s.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                        <div>
                                          <p className="text-xs font-black uppercase">{item.name}</p>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Qty: {item.quantity} • {formatCurrency(item.unitPrice)}</p>
                                        </div>
                                        <p className="text-sm font-black">{formatCurrency(item.totalWithVat)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Transaction Insight</h4>
                                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                                        <Package size={20} />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Protocol Type</p>
                                        <p className="text-sm font-black uppercase mt-1">{s.paymentMethod}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Operator</p>
                                      <p className="text-sm font-black uppercase mt-1">{s.cashierName}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-1 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
          {/* VAT Report View */}
          <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white rounded-[2rem] shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-black/20">
                   <Percent size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black font-display tracking-tight uppercase">VAT RECONCILIATION AUDIT</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-1">Authorized Protocol: UAE VAT_201</p>
                </div>
             </div>
             <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">VAT Rate Category</label>
                  <select 
                    value={vatRateFilter}
                    onChange={e => setVatRateFilter(e.target.value)}
                    className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer"
                  >
                    <option value="all">ALL_RATES</option>
                    <option value="5%">STANDARD (5%)</option>
                    <option value="0%">ZERO-RATED / EXEMPT (0%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Reporting Period Start</label>
                  <input 
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Reporting Period End</label>
                  <input 
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 ml-2">Output VAT Analysis (Sales)</h3>
                <div className="advanced-3d-card p-10 bg-white border border-gray-100">
                   <div className="space-y-6">
                      <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400">
                         <span>Taxable Sales Standard Rate (5%)</span>
                         <span className="text-black">{formatCurrency(totalTaxableSales)}</span>
                      </div>
                      <div className="pt-6 border-t border-dashed border-gray-100 flex justify-between items-end">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Total Output VAT Collected</span>
                         <span className="text-4xl font-black font-display tracking-tighter text-red-500">{formatCurrency(totalVATonSales)}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 ml-2">Input VAT Analysis (Purchases)</h3>
                <div className="advanced-3d-card p-10 bg-white border border-gray-100">
                   <div className="space-y-6">
                      <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400">
                         <span>Taxable Purchase Acquisitions</span>
                         <span className="text-black">{formatCurrency(totalTaxablePurchases)}</span>
                      </div>
                      <div className="pt-6 border-t border-dashed border-gray-100 flex justify-between items-end">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Total Input VAT Recoverable</span>
                         <span className="text-4xl font-black font-display tracking-tighter text-green-500">{formatCurrency(totalVATonPurchases)}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* TOTAL VAT PAYABLE DISPLAY */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#C5A059] via-black to-[#C5A059] rounded-[3.5rem] blur-2xl opacity-10 animate-pulse" />
            <div className="relative p-14 bg-[#0F0F0F] text-white rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059] rounded-full blur-[150px] opacity-[0.05] -mr-48 -mt-48" />
              
              <div className="flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
                 <div className="flex-1 text-center lg:text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A059]">TREASURY RECONCILIATION SUMMARY</span>
                    <h3 className="text-6xl font-black font-display tracking-tighter mt-4 uppercase">NET VAT PAYABLE</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-4">Period Sync: {dateRange.start || 'Start'} to {dateRange.end || 'End'}</p>
                 </div>

                 <div className="text-center lg:text-right space-y-6">
                    <div className={cn(
                      "text-8xl font-black font-display tracking-tighter",
                      netVAT >= 0 ? "text-white" : "text-green-400"
                    )}>
                      {formatCurrency(Math.abs(netVAT))}
                    </div>
                    <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 rounded-full border border-white/10">
                       <div className={cn("w-2 h-2 rounded-full animate-pulse", netVAT >= 0 ? "bg-red-500" : "bg-green-500")} />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                          LIABILITY STATUS: {netVAT >= 0 ? 'PAYMENT_TO_AUTHORITY' : 'RECOVERY_REFUND'}
                       </span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* DETAILED TRANSACTION LOG */}
          <div className="space-y-8">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Transaction Audit Trail</h3>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">
                     <Download size={16} /> EXPORT CSV
                  </button>
                  <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:text-black transition-all">
                     <Printer size={16} /> PRINT SYSTEM AUDIT
                  </button>
                </div>
             </div>
             
             <div className="advanced-3d-card bg-white overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Protocol Type</th>
                      <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Chronological Node</th>
                      <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Reference Number</th>
                      <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Taxable Value</th>
                      <th className="px-10 py-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">VAT Amount (5%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      ...filteredSalesForVat.map(s => ({ ...s, vatType: 'Output' })),
                      ...filteredPurchasesForVat.map(p => ({ ...p, vatType: 'Input' })),
                      ...filteredExpensesForVat.map(e => ({ ...e, vatType: 'Input_Expense', invoiceNumber: (e as any).reference || 'EXPENSE', vatTotal: (e as any).vatAmount || 0, subtotal: ((e as any).amount - ((e as any).vatAmount || 0)) }))
                    ]
                    .sort((a, b) => new Date(b.createdAt || (b as any).date).getTime() - new Date(a.createdAt || (a as any).date).getTime())
                    .map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/10 transition-all group">
                        <td className="px-10 py-6">
                           <span className={cn(
                             "text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                             entry.vatType === 'Output' ? "bg-red-50 text-red-600" : 
                             entry.vatType === 'Input' ? "bg-green-50 text-green-600" :
                             "bg-blue-50 text-blue-600"
                           )}>
                             {entry.vatType.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                           {new Date(entry.createdAt || (entry as any).date).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-6 font-mono text-[10px] font-black uppercase tracking-tight">{entry.invoiceNumber}</td>
                        <td className="px-10 py-6 text-xs font-bold text-gray-600">
                          {formatCurrency(
                            entry.vatType === 'Output' 
                              ? (entry as any).subtotal 
                              : (entry as any).subtotal
                          )}
                        </td>
                        <td className="px-10 py-6 text-right text-sm font-black font-display tracking-tight text-black">
                          {formatCurrency(entry.vatTotal)}
                        </td>
                      </tr>
                    ))}
                    {(filteredSalesForVat.length === 0 && filteredPurchasesForVat.length === 0 && filteredExpensesForVat.length === 0) && (
                      <tr>
                         <td colSpan={5} className="px-10 py-32 text-center">
                            <div className="flex flex-col items-center gap-6 opacity-20">
                               <History size={48} strokeWidth={1} />
                               <p className="font-black uppercase tracking-[0.5em] text-[10px]">Registry sequence is zero in this period</p>
                            </div>
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
