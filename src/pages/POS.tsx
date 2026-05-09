/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Trash2, 
  Plus, 
  Minus,
  ShoppingCart,
  Receipt,
  Package,
  X,
  Printer
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Product, SaleItem, PaymentMethod, ProductType } from '../types';
import { CURRENCY_SYMBOL, VAT_RATE } from '../constants';

// Mock Products
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'iPhone 15 Pro', sku: 'IP15P-128-NT', barcode: '6291234567890', type: ProductType.NEW, category: 'Smartphones', brand: 'Apple', costPrice: 3200, sellingPrice: 3899, stockQuantity: 15, minStockLevel: 5, imeiRequired: true, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Galaxy S24 Ultra', sku: 'GS24U-256-BK', barcode: '6299876543210', type: ProductType.NEW, category: 'Smartphones', brand: 'Samsung', costPrice: 3500, sellingPrice: 4299, stockQuantity: 8, minStockLevel: 3, imeiRequired: true, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', name: 'AirPods Pro 2', sku: 'APP2-WH', barcode: '6291112223334', type: ProductType.ACCESSORY, category: 'Accessories', brand: 'Apple', costPrice: 700, sellingPrice: 849, stockQuantity: 25, minStockLevel: 10, imeiRequired: false, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '4', name: 'MacBook Air M3', sku: 'MBA-M3-8-256', barcode: '6294445556667', type: ProductType.NEW, category: 'Computers', brand: 'Apple', costPrice: 4000, sellingPrice: 4899, stockQuantity: 5, minStockLevel: 2, imeiRequired: true, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
];

import { productsService, salesService, transactionsService, customersService, businessProfileService, promoVouchersService } from '../lib/dbService';
import { Sale, SaleStatus, AccountingType, Customer } from '../types';
import { useAuth } from '../AuthContext';

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [profile, setProfile] = React.useState<any>(null);
  const [cart, setCart] = React.useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedBrand, setSelectedBrand] = React.useState('All');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH);
  const [invoiceMode, setInvoiceMode] = React.useState<'quick' | 'advanced'>('quick');
  const [loading, setLoading] = React.useState(true);
  
  // Advanced State
  const [voucherCode, setVoucherCode] = React.useState('');
  const [appliedVoucher, setAppliedVoucher] = React.useState<any>(null);
  const [discount, setDiscount] = React.useState<number>(0);
  const [discountType, setDiscountType] = React.useState<'fixed' | 'percent'>('fixed');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = React.useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = React.useState('');
  const [customerEmailError, setCustomerEmailError] = React.useState('');
  const [receivedAmount, setReceivedAmount] = React.useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<Sale | null>(null);

  React.useEffect(() => {
     const unsubProducts = productsService.subscribe((data) => {
        setProducts(data.filter(p => p.isActive));
        setLoading(false);
     });
     const unsubCustomers = customersService.subscribe(setCustomers);
     businessProfileService.get().then(setProfile);

     return () => {
        unsubProducts();
        unsubCustomers();
     };
  }, []);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert("CRITICAL ERROR: SEQUENCE STOCK DEPLETED");
      return;
    }
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      const unitPrice = product.sellingPrice;
      const unitCost = product.costPrice;
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        type: product.type,
        quantity: 1,
        unitPrice,
        unitCost,
        totalBeforeVat: unitPrice,
        vatAmount: unitPrice * VAT_RATE,
        totalWithVat: unitPrice * (1 + VAT_RATE),
        imeiRequired: product.imeiRequired,
        imei: []
      }]);
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
     if (newQty < 1) return;
     const product = products.find(p => p.id === productId);
     if (product && newQty > product.stockQuantity) {
        alert(`STOCK LIMIT: ${product.stockQuantity} NODES AVAILABLE`);
        return;
     }

     setCart(cart.map(i => {
        if (i.productId === productId) {
           const totalBeforeVat = newQty * i.unitPrice;
           return {
              ...i,
              quantity: newQty,
              totalBeforeVat,
              vatAmount: totalBeforeVat * VAT_RATE,
              totalWithVat: totalBeforeVat * (1 + VAT_RATE)
           };
        }
        return i;
     }));
  };

  const updateIMEI = (productId: string, imeiString: string) => {
     setCart(cart.map(i => i.productId === productId ? { ...i, imei: imeiString.split(',').map(s => s.trim()).filter(s => s) } : i));
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.productId !== productId));
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.totalBeforeVat, 0);
  const vatTotal = subtotal * VAT_RATE;
  const grossTotal = subtotal + vatTotal;
  
  // Voucher logic
  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    try {
      const q = await promoVouchersService.getAll();
      const voucher = q?.find(v => v.code.toUpperCase() === voucherCode.toUpperCase() && v.isActive);
      
      if (!voucher) {
        alert("CRITICAL ERROR: INVALID CODE FRAGMENT");
        return;
      }

      const now = new Date();
      const expiry = new Date(voucher.expiryDate);
      if (now > expiry) {
        alert("CRITICAL ERROR: TEMPORAL EXPIRY REACHED");
        return;
      }

      if (subtotal < voucher.minPurchase) {
        alert(`CRITICAL ERROR: MINIMUM BASKET VALUE NOT MET. REQUIRED: ${formatCurrency(voucher.minPurchase)}`);
        return;
      }

      if (voucher.usageLimit && (voucher.usageCount || 0) >= voucher.usageLimit) {
        alert("CRITICAL ERROR: USAGE QUOTA EXHAUSTED");
        return;
      }

      setAppliedVoucher(voucher);
      setDiscount(voucher.value);
      setDiscountType(voucher.type === 'percentage' ? 'percent' : 'fixed');
      alert(`VOUCHER SYNCED: ${voucher.code} APPLIED`);
    } catch (err) {
      console.error("Voucher error:", err);
    }
  };

  const calculatedDiscount = discountType === 'fixed' ? discount : (grossTotal * discount / 100);
  const grandTotal = Math.max(0, grossTotal - calculatedDiscount);
  const changeAmount = Math.max(0, receivedAmount - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Check for required IMEIs
    const missingIMEIs = cart.filter(item => item.imeiRequired && (!item.imei || item.imei.length < item.quantity));
    if (missingIMEIs.length > 0) {
      alert(`CRITICAL ERROR: MISSING IDENTIFIERS FOR [${missingIMEIs.map(i => i.name).join(', ')}]. SECURE PROTOCOL REQUIRES IMEI PER UNIT.`);
      return;
    }

    if (paymentMethod === PaymentMethod.CASH && receivedAmount < grandTotal) {
       alert("CRITICAL ERROR: INSUFFICIENT TENDERED SEQUENCE");
       return;
    }
    
    try {
       const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
       const sale: Omit<Sale, 'id'> = {
          invoiceNumber,
          customerId: selectedCustomer?.id || 'GUEST',
          customerName: selectedCustomer?.name || 'Guest Customer',
          items: cart,
          subtotal,
          vatTotal,
          discount: calculatedDiscount,
          grandTotal,
          paymentMethod,
          status: SaleStatus.COMPLETED,
          promoCode: appliedVoucher?.code,
          receivedAmount: paymentMethod === PaymentMethod.CASH ? receivedAmount : grandTotal,
          changeAmount: paymentMethod === PaymentMethod.CASH ? changeAmount : 0,
          cashierId: user?.uid || 'admin-local',
          cashierName: user?.name || 'Admin',
          createdAt: new Date().toISOString()
       };

       const saleId = await salesService.add(sale);
       
       // Update Voucher usage count
       if (appliedVoucher?.id) {
         await promoVouchersService.update(appliedVoucher.id, {
           usageCount: (appliedVoucher.usageCount || 0) + 1
         });
       }
       const finalSale = { id: saleId, ...sale } as Sale;
       setLastSale(finalSale);
       setShowReceiptModal(true);

       // Update Customer LTV
       if (selectedCustomer?.id) {
          await customersService.update(selectedCustomer.id, {
             totalSpent: (selectedCustomer.totalSpent || 0) + grandTotal,
             lastPurchaseDate: new Date().toISOString()
          });
       }

       // Create Transaction
       await transactionsService.add({
          type: AccountingType.INCOME,
          category: 'Sales',
          amount: grandTotal,
          description: `Sale - ${invoiceNumber}`,
          saleId,
          date: new Date().toISOString(),
          paymentMethod,
          reference: invoiceNumber
       });

       // Update Stock
       for (const item of cart) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
             await productsService.update(product.id, {
                stockQuantity: Math.max(0, product.stockQuantity - item.quantity)
             });
          }
       }

       setCart([]);
       setReceivedAmount(0);
       setDiscount(0);
       setVoucherCode('');
       setAppliedVoucher(null);
       setSelectedCustomer(null);
    } catch (err) {
       console.error("Checkout error:", err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchesQuery && matchesCategory && matchesBrand;
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
    c.phone.includes(customerSearchQuery) ||
    c.email?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const uniqueBrands = ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];
  const uniqueCategories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const [isCartOpen, setIsCartOpen] = React.useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full -m-4 md:-m-8 overflow-hidden bg-[#FBFBFB] relative">
      {/* Search & Products */}
      <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 md:gap-10 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="SEARCH OR SCAN BARCODE..." 
              className="w-full pl-16 pr-6 py-4 md:py-6 bg-white border-transparent rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] focus:ring-1 focus:ring-black outline-none font-black text-[10px] md:text-xs tracking-widest placeholder:text-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button 
                onClick={() => setShowCustomerSearch(true)}
                className={cn(
                  "flex-1 md:flex-none p-4 md:p-6 rounded-2xl md:rounded-[2rem] transition-all shadow-xl group border-2 flex items-center justify-center",
                  selectedCustomer ? "bg-[#C5A059] text-white border-[#C5A059]" : "bg-white text-gray-400 border-transparent hover:border-gray-100"
                )}
             >
               <UserPlus size={20} className={cn(selectedCustomer ? "text-white" : "text-gray-300 group-hover:text-black")} />
             </button>
             <button className="flex-1 md:flex-none p-4 md:p-6 bg-[#0F0F0F] rounded-2xl md:rounded-[2rem] text-white shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center">
               <Package size={20} />
             </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2">
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2",
                  selectedCategory === cat 
                    ? "bg-black text-white border-black shadow-lg shadow-black/20" 
                    : "bg-white border-transparent text-gray-400 hover:text-black hover:border-gray-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 md:pr-4 no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stockQuantity <= 0}
                className="advanced-3d-card p-4 md:p-8 text-left flex flex-col gap-4 md:gap-6 group active:scale-95 transition-all relative overflow-hidden bg-white border border-transparent hover:border-gray-100"
              >
                <div className="aspect-square bg-gray-50/50 rounded-2xl md:rounded-3xl flex items-center justify-center text-gray-200 relative group-hover:scale-105 transition-transform duration-700">
                  <Package className="w-12 h-12 md:w-20 md:h-20" strokeWidth={1} />
                  {product.stockQuantity <= 0 ? (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center rounded-2xl md:rounded-3xl">
                      <span className="bg-red-500 text-white text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-[0.3em]">DEPLETED</span>
                    </div>
                  ) : product.stockQuantity <= 5 && (
                    <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-orange-500/10 text-orange-600 text-[7px] md:text-[8px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest border border-orange-100">LOW_NODE</div>
                  )}
                </div>
                <div>
                  <div className="font-black text-[11px] md:text-[13px] truncate uppercase tracking-tighter leading-tight group-hover:text-[#C5A059] transition-colors">{product.name}</div>
                  <div className="text-[8px] md:text-[10px] text-gray-300 mt-1 md:mt-2 uppercase font-black tracking-[0.2em]">{product.brand || 'GENERIC'} • {product.sku}</div>
                  <div className="flex items-center justify-between mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-50">
                     <div className="text-sm md:text-xl font-black font-display tracking-tighter">
                       {formatCurrency(product.sellingPrice)}
                     </div>
                     <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all">
                        <Plus size={14} strokeWidth={3} />
                     </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Trigger for Mobile */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden w-16 h-16 bg-[#0F0F0F] text-white rounded-full shadow-2xl z-[40] flex items-center justify-center group"
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-white animate-bounce-short">
              {cart.length}
            </span>
          )}
        </div>
      </motion.button>

      {/* Slide-In Checkout Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-[60] lg:relative lg:inset-auto lg:z-20",
        "w-[320px] xs:w-[400px] sm:w-[500px] lg:w-[500px] bg-white border-l border-gray-100 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-spring",
        isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Close Handle */}
        <button 
          onClick={() => setIsCartOpen(false)}
          className="lg:hidden absolute -left-12 top-6 w-12 h-12 bg-white rounded-l-2xl border-l border-t border-b border-gray-100 flex items-center justify-center text-gray-400"
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-10 border-b border-gray-50 bg-white sticky top-0 z-10">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-black/20">
                  <ShoppingCart size={22} className="md:w-[28px] md:h-[28px]" />
                </div>
                <div>
                  <h2 className="font-black font-display text-xl md:text-3xl tracking-tighter uppercase leading-none">ORDER_SYNC</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">NODE_01</span>
                     </div>
                     <span className="text-[8px] md:text-[10px] font-black text-[#C5A059] uppercase tracking-[0.2em] truncate max-w-[150px]">
                        {selectedCustomer ? selectedCustomer.name : 'Guest Session'}
                     </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setCart([])}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl md:rounded-2xl transition-all"
              >
                <Trash2 size={20} md:size={24} />
              </button>
           </div>

           <div className="mt-6 md:mt-10 flex items-center gap-2 bg-gray-50 p-1 rounded-xl md:rounded-2xl border border-gray-100">
             <button 
                onClick={() => setInvoiceMode('quick')}
                className={cn(
                  "flex-1 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-lg md:rounded-xl transition-all",
                  invoiceMode === 'quick' ? "bg-white text-black shadow-md md:shadow-lg" : "text-gray-400"
                )}
             >
               Express
             </button>
             <button 
                onClick={() => setInvoiceMode('advanced')}
                className={cn(
                  "flex-1 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-lg md:rounded-xl transition-all",
                  invoiceMode === 'advanced' ? "bg-white text-black shadow-md md:shadow-lg" : "text-gray-400"
                )}
             >
               Architect
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-200 gap-6 md:gap-8 opacity-20">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center">
                  <ShoppingCart size={48} md:size={64} strokeWidth={1} />
               </div>
               <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] md:tracking-[0.8em] text-center">Standby Sequence</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div 
                key={item.productId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4 md:gap-6 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all group relative"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                  <Package size={20} md:size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] md:text-[13px] font-black uppercase tracking-tight truncate flex items-center gap-2 md:gap-3">
                    {item.name}
                    {(invoiceMode === 'advanced' || item.imeiRequired) && (
                       <span className={cn(
                         "text-[7px] md:text-[8px] px-1.5 md:px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                         item.type === ProductType.USED ? "bg-blue-600 text-white" : "bg-green-600 text-white"
                       )}>
                         {item.type}
                       </span>
                    )}
                  </div>
                  <div className="text-[8px] md:text-[9px] text-gray-300 mt-1 uppercase font-black tracking-widest flex items-center justify-between">
                    <span>{formatCurrency(item.unitPrice)}</span>
                    <span className="text-[#C5A059] font-bold">Tax: {formatCurrency(item.vatAmount)}</span>
                  </div>
                  
                  {(invoiceMode === 'advanced' || item.imeiRequired) && (
                    <div className="mt-3 md:mt-4">
                       <input 
                         type="text" 
                         placeholder={item.imeiRequired ? "SCAN IMEI(S) ..." : "OPTIONAL ID ..."}
                         value={item.imei?.join(', ')}
                         onChange={(e) => updateIMEI(item.productId, e.target.value)}
                         className={cn(
                           "w-full text-[8px] md:text-[9px] px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-100 rounded-lg md:rounded-xl focus:border-black outline-none font-mono font-bold placeholder:text-gray-200",
                           item.imeiRequired && (!item.imei || item.imei.length < item.quantity) ? "border-orange-200 bg-orange-50/30" : ""
                         )}
                       />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 md:mt-5">
                    <div className="flex items-center gap-3 md:gap-4 bg-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-gray-100 shadow-sm">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="text-gray-300 hover:text-black transition-colors"><Minus size={12} md:size={14} /></button>
                      <span className="text-[10px] md:text-xs font-black min-w-[1ch] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="text-black transition-colors"><Plus size={12} md:size={14} strokeWidth={3} /></button>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                   <div className="text-[10px] md:text-[13px] font-black font-display tracking-tight bg-black text-white px-3 md:px-4 py-1.5 md:py-2 rounded-[0.8rem] md:rounded-[1rem] shadow-lg shadow-black/20">
                     {formatCurrency(item.totalWithVat)}
                   </div>
                   <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                      <Trash2 size={16} md:size={20} />
                   </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-6 md:p-10 bg-gray-50/50 backdrop-blur-3xl border-t border-gray-100 space-y-6 md:space-y-10">
          <div className="space-y-3 md:space-y-4">
             <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>Subtotal</span>
                <span className="text-black">{formatCurrency(subtotal)}</span>
             </div>
             <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>VAT (5%)</span>
                <span className="text-black">{formatCurrency(vatTotal)}</span>
             </div>
             
             <div className="pt-4 md:pt-6 border-t-2 border-dashed border-gray-200 space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">TOTAL</span>
                   </div>
                   <div className="text-3xl md:text-5xl font-black font-display tracking-tighter text-[#C5A059]">
                      {formatCurrency(grandTotal)}
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button 
              onClick={() => setPaymentMethod(PaymentMethod.CASH)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 transition-all",
                paymentMethod === PaymentMethod.CASH ? "bg-[#0F0F0F] text-white border-transparent shadow-xl" : "bg-white text-gray-400 border-transparent"
              )}
            >
              <Banknote size={20} md:size={22} className={cn(paymentMethod === PaymentMethod.CASH ? "text-[#C5A059]" : "text-gray-200")} />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Cash</span>
            </button>
            <button 
              onClick={() => setPaymentMethod(PaymentMethod.CARD)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 transition-all",
                paymentMethod === PaymentMethod.CARD ? "bg-[#0F0F0F] text-white border-transparent shadow-xl" : "bg-white text-gray-400 border-transparent"
              )}
            >
              <CreditCard size={20} md:size={22} className={cn(paymentMethod === PaymentMethod.CARD ? "text-[#C5A059]" : "text-gray-200")} />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Card</span>
            </button>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-[#0F0F0F] text-white py-6 md:py-8 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-sm flex items-center justify-center gap-4 md:gap-6 active:scale-95 transition-all disabled:opacity-30 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
          >
            <Receipt size={18} md:size={24} strokeWidth={2.5} />
            SYNC TRANSACTION
          </button>
        </div>
      </div>

      {/* Mobile Cart Overlay Backdrop */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>


      {/* Customer Selection Modal */}
      <AnimatePresence>
        {showCustomerSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomerSearch(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="font-display text-3xl font-black uppercase tracking-tighter">CLIENT_NODE_SYNC</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">ASSOCIATE ENTITY TO SEQUENCE</p>
                </div>
                <button onClick={() => setShowCustomerSearch(false)} className="w-12 h-12 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 hover:text-black transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="relative mb-8">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="FILTER CLIENT NODES (NAME, PHONE, EMAIL)..."
                  value={customerSearchQuery}
                  onChange={e => {
                    const val = e.target.value;
                    setCustomerSearchQuery(val);
                    if (val.includes('@')) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(val)) {
                        setCustomerEmailError('Node format error: Invalid email signature');
                      } else {
                        setCustomerEmailError('');
                      }
                    } else {
                      setCustomerEmailError('');
                    }
                  }}
                  className={cn(
                    "w-full pl-16 pr-6 py-5 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm tracking-tight focus:ring-1 focus:ring-black",
                    customerEmailError ? "ring-1 ring-red-500 bg-red-50/10" : ""
                  )}
                />
                {customerEmailError && (
                  <p className="mt-2 ml-6 text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">{customerEmailError}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-2">
                {selectedCustomer ? (
                   <div className="p-6 rounded-3xl bg-[#C5A059] text-white flex items-center justify-between shadow-xl">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <div className="font-black uppercase tracking-tight">{selectedCustomer.name}</div>
                            <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-1">{selectedCustomer.phone}</div>
                         </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center hover:bg-black/40 transition-all">
                        <X size={20} />
                      </button>
                   </div>
                ) : filteredCustomers.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
                    className="w-full p-6 text-left rounded-3xl hover:bg-gray-50 group flex items-center justify-between border border-transparent hover:border-gray-100 transition-all"
                  >
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all text-gray-400 group-hover:text-black font-black text-xl">
                           {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <div className="font-black uppercase tracking-tight group-hover:text-[#C5A059] transition-colors">{c.name}</div>
                           <div className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 uppercase">{c.phone}</div>
                        </div>
                     </div>
                     <Plus size={20} className="text-gray-200 group-hover:text-black group-hover:rotate-90 transition-all" />
                  </button>
                ))}
              </div>
              
              <button 
                 onClick={() => { /* Navigate to Customers for new profile creation logic could go here */ }}
                 className="mt-10 py-5 w-full bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all border border-transparent hover:border-black"
              >
                 + Initialize New Client Entry
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {showReceiptModal && lastSale && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReceiptModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                         <Receipt size={20} />
                      </div>
                      <h3 className="font-black uppercase tracking-widest text-xs">Tax Invoice Preview</h3>
                   </div>
                   <button onClick={() => setShowReceiptModal(false)} className="w-10 h-10 hover:bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                      <X size={20} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 flex flex-col items-center">
                   <div id="receipt-content" className="w-full bg-white p-10 shadow-sm border border-gray-100 rounded-2xl flex flex-col items-center text-center font-mono text-[10px] space-y-6">
                      <div className="space-y-1">
                         <h2 className="text-[10px] font-black tracking-[0.4em] text-gray-400 mb-2">TAX INVOICE</h2>
                         <h2 className="text-xl font-black uppercase leading-tight">{profile?.companyName || 'AL QUSAIDAT MOBILES'}</h2>
                         <p className="font-bold">{profile?.address}</p>
                         <div className="flex items-center justify-center gap-2 bg-gray-50 px-3 py-1 rounded-full mt-2 font-black border border-gray-100">
                            TRN: <span className="text-black">{profile?.trn || '100XXXXXXXXXXXX'}</span>
                         </div>
                         {profile?.phone && <p className="mt-1">TEL: {profile?.phone}</p>}
                      </div>

                      <div className="w-full border-y border-dashed border-gray-200 py-4 flex flex-col gap-2 items-start text-left">
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">INVOICE_ID:</span> <span className="font-black">{lastSale.invoiceNumber}</span>
                         </div>
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">TIMESTAMP:</span> <span className="font-black">{new Date(lastSale.createdAt).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">CASHIER_NODE:</span> <span className="font-black uppercase">{lastSale.cashierName}</span>
                         </div>
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">CLIENT_ENTITY:</span> <span className="font-black uppercase">{lastSale.customerName}</span>
                         </div>
                      </div>

                      <div className="w-full space-y-4">
                         <div className="flex justify-between font-black border-b border-black pb-2 text-[8px] tracking-widest text-gray-400">
                            <span className="flex-[2] text-left">ITEM_DESCRIPTION</span>
                            <span className="flex-1 text-center">QTY</span>
                            <span className="flex-1 text-right">TOTAL_GROSS</span>
                         </div>
                         <div className="space-y-3">
                           {lastSale.items.map((item, idx) => (
                             <div key={idx} className="flex flex-col gap-1">
                               <div className="flex justify-between items-start">
                                  <span className="flex-[2] text-left uppercase font-bold leading-tight">{item.name}</span>
                                  <span className="flex-1 text-center font-bold">{item.quantity}</span>
                                  <span className="flex-1 text-right font-black">{formatCurrency(item.totalWithVat)}</span>
                               </div>
                               {item.imei && item.imei.length > 0 && (
                                  <div className="text-[8px] text-gray-400 text-left pl-2">
                                     SN: {item.imei.join(', ')}
                                  </div>
                               )}
                             </div>
                           ))}
                         </div>
                      </div>

                      <div className="w-full border-t-2 border-black pt-4 space-y-2">
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest">SUBTOTAL (EXCL. VAT)</span> 
                            <span>{formatCurrency(lastSale.subtotal)}</span>
                         </div>
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest">VAT (5% STANDARD RATE)</span> 
                            <span>{formatCurrency(lastSale.vatTotal)}</span>
                         </div>
                         {lastSale.discount > 0 && (
                           <div className="flex justify-between text-red-500 font-bold">
                              <span className="uppercase tracking-widest">CALIBRATION DISCOUNT</span> 
                              <span>-{formatCurrency(lastSale.discount)}</span>
                           </div>
                         )}
                         <div className="flex justify-between text-xl font-black pt-4 border-t border-dashed border-gray-200 mt-2">
                            <span className="tracking-tighter">GRAND TOTAL</span> 
                            <span className="text-black">{formatCurrency(lastSale.grandTotal)}</span>
                         </div>
                      </div>

                      <div className="w-full space-y-1 pt-4 border-t border-gray-50 bg-gray-50/50 p-4 rounded-xl">
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest text-[8px]">TENDERED ({lastSale.paymentMethod}):</span> <span className="font-black">{formatCurrency(lastSale.receivedAmount)}</span>
                         </div>
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest text-[8px]">CHANGE RETURNED:</span> <span className="font-black">{formatCurrency(lastSale.changeAmount)}</span>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-dashed border-gray-200 w-full space-y-4">
                         <div className="space-y-1">
                           <p className="font-bold">THANK YOU FOR CHOOSING OUR SERVICE</p>
                           <p className="text-[8px] opacity-40 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">{profile?.footerNote || 'Subject to UAE Federal Tax Authority Regulations'}</p>
                         </div>
                         <div className="pt-4 flex justify-center opacity-20">
                            <div className="w-24 h-24 border-2 border-black flex items-center justify-center p-2">
                               <Search size={40} className="text-black" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 border-t border-gray-50 flex gap-4">
                   <button 
                     onClick={() => window.print()}
                     className="flex-1 bg-black text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20"
                   >
                     <Printer size={18} /> Print Thermal
                   </button>
                   <button 
                     onClick={() => setShowReceiptModal(false)}
                     className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100"
                   >
                     Done
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
