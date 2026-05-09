/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Package,
  Barcode,
  QrCode,
  X,
  Camera,
  RefreshCw,
  Save,
  Info,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BarcodeDisplay from 'react-barcode';
import { cn, formatCurrency, generateBarcode } from '../lib/utils';
import { Product, ProductType, BusinessProfile } from '../types';
import { productsService, businessProfileService } from '../lib/dbService';
import { CATEGORIES } from '../constants';

export default function Inventory() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    type: ProductType.NEW,
    category: 'Smartphones',
    brand: '',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    imeiRequired: true,
    image: '',
    vatRate: 0.05,
    isActive: true
  });

  React.useEffect(() => {
    const unsubProducts = productsService.subscribe((data) => {
      setProducts(data);
      setLoading(false);
    });
    const unsubProfile = businessProfileService.subscribe(setProfile);
    return () => {
      unsubProducts();
      unsubProfile();
    };
  }, []);

  const handleGenerateBarcode = () => {
    setNewProduct(prev => ({ ...prev, barcode: generateBarcode() }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('CRITICAL: IMAGE SIZE OVERLOAD. MAX 1MB.');
        return;
      }
      
      const allowedTypes = ['image/png', 'image/jpeg', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        alert('UNSUPPORTED FORMAT: USE PNG, JPEG, OR BMP.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setNewProduct({
      name: '',
      sku: '',
      barcode: '',
      type: ProductType.NEW,
      category: 'Smartphones',
      brand: '',
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      imeiRequired: true,
      image: '',
      vatRate: 0.05,
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEdit = (product: Product) => {
    setIsEditing(true);
    setNewProduct({ ...product });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && newProduct.id) {
        await productsService.update(newProduct.id, newProduct);
      } else {
        await productsService.add(newProduct as Omit<Product, 'id'>);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await productsService.delete(id);
    }
  };

  const [filterMode, setFilterMode] = React.useState<'all' | 'low' | 'instock'>('all');

  const handleExportCSV = () => {
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Stock', 'Min Level'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.sku,
      p.barcode,
      p.category,
      p.brand || '',
      p.costPrice,
      p.sellingPrice,
      p.stockQuantity,
      p.minStockLevel
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterMode === 'low') return matchesQuery && p.stockQuantity <= p.minStockLevel;
    if (filterMode === 'instock') return matchesQuery && p.stockQuantity > 0;
    return matchesQuery;
  });

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">STOCK CONTROL</h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Node: {profile?.companyName || 'AL QUSAIDAT MOBILES'} • INVENTORY HUB
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-[#0F0F0F] text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all w-full md:w-auto shadow-[0_20px_40px_rgba(0,0,0,0.15)] group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus size={20} strokeWidth={3} />
          REGISTER PRODUCT
        </button>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                    <Package size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">{isEditing ? 'RECALIBRATE' : 'NEW REGISTRY'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">{isEditing ? 'MODIFICATION SEQUENCE' : 'ADVANCED DEVICE ENTRY'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-12 no-scrollbar">
                <div className="flex flex-col lg:flex-row gap-12">
                  {/* Image & Display Section */}
                  <div className="lg:w-72 space-y-8">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-black">Device View</h3>
                     </div>
                     <div className="aspect-square bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative group overflow-hidden">
                        {newProduct.image ? (
                          <>
                            <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                               <button 
                                 type="button"
                                 onClick={() => setNewProduct(prev => ({ ...prev, image: '' }))}
                                 className="bg-white/20 hover:bg-white/40 p-4 rounded-full text-white backdrop-blur-xl transition-all"
                               >
                                 <Trash2 size={24} />
                               </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <Camera size={40} className="text-gray-300" />
                            <p className="text-[9px] font-black text-gray-400 mt-4 uppercase tracking-widest">Awaiting Capture</p>
                          </>
                        )}
                        <label className="absolute inset-0 cursor-pointer">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".png,.jpg,.jpeg,.bmp" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                     </div>
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protocol Support</div>
                        <p className="text-[10px] text-gray-500 mt-2 font-medium leading-relaxed">
                          Max size: 1MB. Use high-resolution PNG, JPG, or BMP for optimal node identification.
                        </p>
                     </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Basic Info Section */}
                    <div className="space-y-10">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-black">Device Definitions</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Universal Name</label>
                        <input 
                          type="text" 
                          required
                          value={newProduct.name}
                          onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                          placeholder="e.g. IPHONE 15 PRO MAX"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category Protocol</label>
                        <select 
                          value={newProduct.category}
                          onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">SKU PROTOCOL</label>
                          <input 
                            type="text" 
                            required
                            value={newProduct.sku}
                            onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                            className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm uppercase"
                            placeholder="IP15-P-T"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Brand Hub</label>
                          <input 
                            type="text" 
                            value={newProduct.brand}
                            onChange={e => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                            placeholder="APPLE / SAMSUNG"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Condition Protocol</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(ProductType).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewProduct(prev => ({ ...prev, type }))}
                              className={cn(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                newProduct.type === type 
                                  ? "bg-black text-white border-black" 
                                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center justify-between">
                           BARCODE / SERIAL IDENTIFIER
                           <button 
                             type="button" 
                             onClick={handleGenerateBarcode}
                             className="text-black hover:underline flex items-center gap-2 normal-case font-black text-[9px] tracking-widest uppercase"
                           >
                             <RefreshCw size={12} /> RE-GENERATE
                           </button>
                         </label>
                         <div className="relative">
                           <Barcode className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                           <input 
                             type="text" 
                             value={newProduct.barcode}
                             onChange={e => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                             className="w-full pl-16 pr-16 py-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm"
                             placeholder="SCAN INPUT..."
                           />
                         </div>
                         
                         {newProduct.barcode && (
                           <div className="bg-gray-50/50 p-6 rounded-3xl flex flex-col items-center justify-center border border-dashed border-gray-200">
                             <BarcodeDisplay value={newProduct.barcode} width={1.8} height={50} fontSize={10} background="transparent" />
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="space-y-12">
                     <div className="space-y-10">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-black rounded-full" />
                           <h3 className="text-sm font-black uppercase tracking-widest text-black">Financial Metrics</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Unit Cost (AED)</label>
                            <input 
                              type="number" 
                              required
                              value={newProduct.costPrice}
                              onChange={e => setNewProduct(prev => ({ ...prev, costPrice: parseFloat(e.target.value) }))}
                              className="w-full px-6 py-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Market Price (AED)</label>
                            <input 
                              type="number" 
                              required
                              value={newProduct.sellingPrice}
                              onChange={e => setNewProduct(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) }))}
                              className="w-full px-6 py-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-xl"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Current Stock</label>
                              <input 
                                type="number" 
                                value={newProduct.stockQuantity}
                                onChange={e => setNewProduct(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Alert Threshold</label>
                              <input 
                                type="number" 
                                value={newProduct.minStockLevel}
                                onChange={e => setNewProduct(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) }))}
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black">IMEI PROTOCOL</div>
                              <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Node specific tracking</div>
                           </div>
                           <button 
                             type="button"
                             onClick={() => setNewProduct(prev => ({ ...prev, imeiRequired: !prev.imeiRequired }))}
                             className={cn(
                               "w-14 h-7 rounded-full transition-all relative border-2",
                               newProduct.imeiRequired ? "bg-black border-black" : "bg-white border-gray-200"
                             )}
                           >
                             <div className={cn(
                               "absolute top-1 w-4 h-4 rounded-full transition-all",
                               newProduct.imeiRequired ? "right-1 bg-white" : "left-1 bg-gray-200"
                             )} />
                           </button>
                        </div>
                        <div className="border-t-2 border-dashed border-gray-200 pt-6 flex items-center justify-between">
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Yield Margin</div>
                              <div className="text-xl font-black mt-1">
                                {newProduct.sellingPrice && newProduct.costPrice ? 
                                  `${(((newProduct.sellingPrice - newProduct.costPrice) / newProduct.sellingPrice) * 100).toFixed(1)}%` : 
                                  '0.0%'
                                }
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Profit</div>
                              <div className="text-xl font-black mt-1 text-green-600 tracking-tighter">
                                {newProduct.sellingPrice && newProduct.costPrice ? 
                                  formatCurrency(newProduct.sellingPrice - newProduct.costPrice) : 
                                  formatCurrency(0)
                                }
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
                
                <div className="mt-16 flex items-center gap-6 sticky bottom-0 bg-white pb-4 pt-10 border-t border-gray-50">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-5 px-8 border-2 border-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-400"
                  >
                    ABORT Registry
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 px-8 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20"
                  >
                    <Save size={18} strokeWidth={3} />
                    {isEditing ? 'COMMIT MODIFICATION' : 'AUTHORIZE REGISTRY ENTRY'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="advanced-3d-card overflow-hidden bg-white">
        <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
            <input 
              type="text" 
              placeholder="FILTER DATA CLUSTERS (NAME, SKU, UID)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 text-xs font-black uppercase tracking-tight bg-gray-50/50 border-transparent rounded-3xl shadow-inner focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-200"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-100">
               <button 
                 onClick={() => setFilterMode('all')}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   filterMode === 'all' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
                 )}
               >ALL</button>
               <button 
                 onClick={() => setFilterMode('low')}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   filterMode === 'low' ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "text-gray-400 hover:text-orange-500"
                 )}
               >LOW</button>
            </div>
            <button 
              onClick={handleExportCSV}
              className="w-14 h-14 flex items-center justify-center text-gray-300 hover:text-black hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 active:scale-95"
              title="EXPORT CSV"
            >
              <Download size={24} />
            </button>
            <div className="w-[1px] h-10 bg-gray-100 mx-2" />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
               {filteredProducts.length} NODES IDENTIFIED
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">IDENTIFIER & TYPE</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">NODE STATUS</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">UNIT COST</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">SELLING PRICE</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">CATEGORY HUB</th>
                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 group-hover:scale-110 transition-transform overflow-hidden p-1">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain rounded-xl" />
                        ) : (
                          <Package size={28} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black flex items-center gap-3 uppercase tracking-tighter">
                          {p.name}
                          <span className={cn(
                            "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                            p.type === ProductType.NEW ? "bg-green-500 text-white" :
                            p.type === ProductType.USED ? "bg-blue-500 text-white" :
                            p.type === ProductType.REPAIR ? "bg-orange-500 text-white" : "bg-gray-400 text-white"
                          )}>
                            {p.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 tracking-[0.2em] font-mono font-bold uppercase">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black">{p.stockQuantity}</div>
                      {p.stockQuantity <= p.minStockLevel && (
                        <div className="flex items-center gap-2 text-[8px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 uppercase tracking-widest">
                          <AlertTriangle size={12} />
                          CRITICAL
                        </div>
                      )}
                    </div>
                    <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          p.stockQuantity <= p.minStockLevel ? "bg-orange-500" : "bg-black"
                        )}
                        style={{ width: `${Math.min((p.stockQuantity / (p.minStockLevel * 4)) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-lg font-bold text-gray-400 font-display tracking-tighter">
                      {formatCurrency(p.costPrice || 0)}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-xl font-black font-display tracking-tighter">
                      {formatCurrency(p.sellingPrice)}
                    </div>
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">VAT INC. (5%)</p>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-100">
                       {p.category}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-xl transition-all shadow-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
                        {loading && [1,2,3,4,5].map(i => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={6} className="px-10 py-10 border-b border-gray-50 bg-gray-50/10" />
                          </tr>
                        ))}
                        {!loading && filteredProducts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-10 py-32 text-center">
                              <div className="flex flex-col items-center gap-6 opacity-20">
                                 <Package size={64} strokeWidth={1} />
                                 <p className="font-black uppercase tracking-[0.5em] text-[10px]">No Data Fragments Detected</p>
                              </div>
                            </td>
                          </tr>
                        )}
            </tbody>
          </table>
        </div>

        <div className="p-10 border-t border-gray-50 flex items-center justify-between bg-gray-50/10">
          <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
            NODE_SEQUENCE_RANGE [ 1 - {filteredProducts.length} ] OF {products.length} IDENTIFIERS
          </div>
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center border border-gray-100 rounded-2xl text-gray-300 hover:text-black hover:bg-white transition-all shadow-sm">
              <ChevronLeft size={24} />
            </button>
            <div className="flex gap-2">
               <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black text-white text-[10px] font-black shadow-xl shadow-black/20">01</button>
               <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 text-[10px] font-black hover:text-black transition-all">02</button>
            </div>
            <button className="w-12 h-12 flex items-center justify-center border border-gray-100 rounded-2xl text-gray-300 hover:text-black hover:bg-white transition-all shadow-sm">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
