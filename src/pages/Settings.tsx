/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Save, 
  Upload, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Tag,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Shield,
  Database,
  Monitor,
  Bell,
  Printer,
  CreditCard,
  Languages,
  DollarSign,
  Clock,
  UserPlus,
  Users,
  Key,
  ShieldCheck,
  UserX,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  businessProfileService, 
  salesService, 
  purchasesService, 
  productsService, 
  vouchersService, 
  customersService, 
  suppliersService,
  usersService,
  AppUser
} from '../lib/dbService';
import { cn } from '../lib/utils';
import { BusinessProfile } from '../types';

function UserManagementSection() {
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    name: '',
    username: '',
    password: '',
    role: 'Staff'
  });

  const fetchUsers = async () => {
    const data = await usersService.getAll();
    setUsers(data);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await usersService.add({
      ...newUser,
      isActive: true,
      createdAt: new Date().toISOString()
    } as any);
    setShowAddModal(false);
    setNewUser({ name: '', username: '', password: '', role: 'Staff' });
    fetchUsers();
  };

  const toggleUserStatus = async (user: AppUser) => {
    await usersService.update(user.id, { isActive: !user.isActive });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('TERMINATE USER NODE? This action is irreversible.')) return;
    await usersService.delete(id);
    fetchUsers();
  };

  return (
    <section className="advanced-3d-card p-12 bg-white space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 bg-black rounded-full" />
          <h2 className="text-xl font-black uppercase tracking-tight">User Security Registry</h2>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          type="button"
          className="px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          <UserPlus size={16} /> Deploy New Agent
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
             <Users size={48} className="mx-auto text-gray-200 mb-6" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NO EXTERNAL AGENTS REGISTERED</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map(user => (
              <div key={user.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg transition-transform group-hover:scale-110",
                    user.isActive ? "bg-black shadow-black/10" : "bg-gray-200"
                  )}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black uppercase tracking-tight text-sm">{user.name}</h4>
                      <span className="px-3 py-1 bg-white rounded-full text-[8px] font-black uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/10">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 uppercase">@{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <button 
                     type="button"
                     onClick={() => toggleUserStatus(user)}
                     className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                       user.isActive ? "bg-green-50 text-green-500 hover:bg-green-100" : "bg-gray-200 text-gray-400"
                     )}
                     title={user.isActive ? "Deactivate" : "Activate"}
                   >
                     <ShieldCheck size={18} />
                   </button>
                   <button 
                     type="button"
                     onClick={() => deleteUser(user.id)}
                     className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 text-black">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12">
               <div className="flex items-center justify-between mb-10">
                 <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-black">AGENT_ENROLLMENT</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">INITIALIZE NEW SECURITY IDENTITY</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="w-12 h-12 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 transition-all">
                    <X size={24} />
                 </button>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">Agent Name</label>
                    <input 
                      required
                      type="text" 
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-xs text-black"
                      placeholder="e.g. MOE TAHIR"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">Username</label>
                       <input 
                         required
                         type="text" 
                         value={newUser.username}
                         onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                         className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs text-black"
                         placeholder="moe.staff"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">Role Access</label>
                       <select 
                         value={newUser.role}
                         onChange={e => setNewUser({...newUser, role: e.target.value})}
                         className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-xs text-black"
                       >
                         <option value="Staff">STAFF AGENT</option>
                         <option value="Manager">LEVEL 2 MANAGER</option>
                         <option value="Technician">SR. TECHNICIAN</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono flex items-center gap-2">
                       <Key size={12} /> Access Passphrase
                    </label>
                    <input 
                      required
                      type="password" 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs text-black"
                      placeholder="••••••••"
                    />
                 </div>

                 <button 
                   type="button"
                   onClick={handleAddUser}
                   className="w-full py-6 mt-8 bg-black text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/20"
                 >
                   AUTHORIZE DEPLOYMENT
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState<'business' | 'pos' | 'localization' | 'data'>('business');
  const [profile, setProfile] = React.useState<Partial<BusinessProfile>>({
    companyName: '',
    trn: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    termsAndConditions: '',
    footerNote: '',
    logoBase64: '',
    promoPrefix: 'https://alqusaidatmobiles.com/promo/'
  });
  
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  // System Settings state (local for now)
  const [systemSettings, setSystemSettings] = React.useState({
    currency: 'AED',
    dateFormat: 'DD/MM/YYYY',
    taxRate: 5,
    autoPrintReceipt: true,
    lowStockThreshold: 5,
    language: 'English',
    theme: 'Light'
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      const data = await businessProfileService.get();
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Supported formats check: PNG, JPEG, BMP
      const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
      if (!supportedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'CRITICAL ERROR: UNSUPPORTED IMAGE SIGNATURE. USE PNG, JPEG, OR BMP.' });
        return;
      }

      if (file.size > 1024 * 1024) { 
        setMessage({ type: 'error', text: 'CRITICAL ERROR: SEQUENCE SIZE EXCEEDS 1MB LIMIT.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await businessProfileService.save(profile);
      setMessage({ type: 'success', text: 'Configuration synchronized successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Synchronization failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSystem = async () => {
    if (!confirm('CRITICAL ACTION: This will permanently delete ALL sales, purchases, and products. Continue?')) return;
    
    // In a real app, we'd delete from Firestore
    alert('System reset protocol initiated. Please refresh the page.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-black border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'business', label: 'Business Profile', icon: Building2 },
    { id: 'pos', label: 'POS Terminal', icon: Monitor },
    { id: 'localization', label: 'Regional Settings', icon: Globe },
    { id: 'data', label: 'Users & Security', icon: Shield },
  ];

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">CORE <span className="text-[#C5A059]">CONFIGURATION</span></h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Control Interface • V2.4.0-STABLE
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-[2rem] border border-gray-100 shadow-inner">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={cn(
                 "px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                 activeTab === tab.id ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
               )}
             >
               <tab.icon size={14} /> {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="space-y-12">
            <AnimatePresence mode="wait">
              {activeTab === 'business' && (
                <motion.div 
                  key="business"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  {/* Branding Section */}
                  <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Corporate Identity Nodes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 group relative overflow-hidden">
                         <div className="w-32 h-32 bg-white rounded-3xl shadow-xl overflow-hidden flex items-center justify-center mb-6 relative z-10">
                            {profile.logoBase64 ? (
                              <img src={profile.logoBase64} alt="Company Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="text-gray-100" size={64} />
                            )}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all backdrop-blur-[2px]">
                              <Upload className="text-white" size={24} />
                              <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.bmp" onChange={handleLogoUpload} />
                            </label>
                         </div>
                         <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center relative z-10">
                           {profile.logoBase64 ? 'CHANGE BRAND ASSET' : 'UPLOAD CORPORATE LOGO'}
                         </div>
                      </div>

                      <div className="md:col-span-2 space-y-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Legal Entity Name</label>
                          <input 
                            type="text" 
                            value={profile.companyName}
                            onChange={e => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                            required
                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-sm"
                            placeholder="AL QUSAIDAT MOBILES LLC"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tax Registration (TRN)</label>
                          <input 
                            type="text" 
                            value={profile.trn}
                            onChange={e => setProfile(prev => ({ ...prev, trn: e.target.value }))}
                            required
                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm"
                            placeholder="100XXXXXXXXXXXX"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Contact Section */}
                  <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Sync & Localization Channels</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       {[
                         { label: 'E-Mail Node', icon: Mail, value: profile.email, key: 'email', placeholder: 'hq@alqusaidat.com' },
                         { label: 'Mobile Frequency', icon: Phone, value: profile.phone, key: 'phone', placeholder: '+971 50 XXXXXXX' },
                         { label: 'Cloud Domain', icon: Globe, value: profile.website || '', key: 'website', placeholder: 'https://alqusaidat.com' },
                         { label: 'Promotional Prefix', icon: Tag, value: profile.promoPrefix || '', key: 'promoPrefix', placeholder: 'https://alqusaidat.com/promo/' },
                         { label: 'Physical Coordinates', icon: MapPin, value: profile.address, key: 'address', placeholder: 'RAK, UAE' },
                       ].map(field => (
                         <div key={field.key} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                              <field.icon size={12} /> {field.label}
                            </label>
                            <input 
                              type="text" 
                              value={field.value}
                              onChange={e => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                              placeholder={field.placeholder}
                            />
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* Legal Section */}
                  <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Protocol Documentation</h2>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Standard Terms of Trade</label>
                        <textarea 
                          value={profile.termsAndConditions}
                          onChange={e => setProfile(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                          className="w-full px-8 py-6 bg-gray-50 border-transparent rounded-[2.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all min-h-[150px] text-[10px] font-bold uppercase leading-relaxed resize-none no-scrollbar"
                          placeholder="DEFIE TRADE PROTOCOLS HERE..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Registry Footer Tag</label>
                        <input 
                          type="text" 
                          value={profile.footerNote}
                          onChange={e => setProfile(prev => ({ ...prev, footerNote: e.target.value }))}
                          className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-[10px] tracking-wider"
                          placeholder="SYSTEM GENERATED VIA BIZBILLZ"
                        />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'pos' && (
                <motion.div 
                  key="pos"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <section className="advanced-3d-card p-12 bg-white space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Operational Parameters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Receipt Print Behavior</label>
                          <div className="flex items-center gap-4">
                             <button 
                               type="button"
                               onClick={() => setSystemSettings(prev => ({ ...prev, autoPrintReceipt: true }))}
                               className={cn(
                                 "flex-1 p-6 rounded-[2rem] border transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-4",
                                 systemSettings.autoPrintReceipt ? "bg-black text-white border-black" : "bg-gray-50 text-gray-400 border-transparent"
                               )}
                             >
                                <Printer size={24} />
                                AUTO-PRINT ACTIVATED
                             </button>
                             <button 
                               type="button"
                               onClick={() => setSystemSettings(prev => ({ ...prev, autoPrintReceipt: false }))}
                               className={cn(
                                 "flex-1 p-6 rounded-[2rem] border transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-4",
                                 !systemSettings.autoPrintReceipt ? "bg-black text-white border-black" : "bg-gray-50 text-gray-400 border-transparent"
                               )}
                             >
                                <Shield size={24} />
                                MANUAL PROTOCOL
                             </button>
                          </div>
                       </div>

                       <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Low Stock Awareness Threshold</label>
                            <input 
                              type="number" 
                              value={systemSettings.lowStockThreshold}
                              onChange={e => setSystemSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))}
                              className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                            />
                            <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-2 ml-1">Nodes with quantity below this value trigger alerts.</p>
                         </div>
                       </div>
                    </div>
                  </section>

                  <section className="advanced-3d-card p-12 bg-white space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Payment Gateway & Logic</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {['CASH', 'CARD', 'BANK TRANSFER', 'CHEQUE'].map(method => (
                         <div key={method} className="p-6 bg-gray-50 rounded-3xl flex items-center justify-between border border-gray-100">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                               <CreditCard size={18} />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest">{method}</span>
                           </div>
                           <div className="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                         </div>
                       ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'localization' && (
                <motion.div 
                  key="localization"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <section className="advanced-3d-card p-12 bg-white space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Registry Localization</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <DollarSign size={12} /> Unit of Currency
                          </label>
                          <select 
                            value={systemSettings.currency}
                            onChange={e => setSystemSettings(prev => ({ ...prev, currency: e.target.value }))}
                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                          >
                            <option value="AED">AED (UAE DIRHAM)</option>
                            <option value="USD">USD (US DOLLAR)</option>
                            <option value="SAR">SAR (SAUDI RIYAL)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <Clock size={12} /> Temporal Format
                          </label>
                          <select 
                            value={systemSettings.dateFormat}
                            onChange={e => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                          >
                            <option value="DD/MM/YYYY">DD / MM / YYYY</option>
                            <option value="MM/DD/YYYY">MM / DD / YYYY</option>
                            <option value="YYYY-MM-DD">YYYY - MM - DD</option>
                          </select>
                       </div>
                       <div className="space-y-2 text-red-500">
                          <label className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2 ml-1">
                            <Languages size={12} /> Display Language
                          </label>
                          <select 
                            disabled
                            className="w-full px-8 py-5 bg-red-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm cursor-not-allowed opacity-50"
                          >
                            <option value="English">ENGLISH (CORE)</option>
                            <option value="Arabic">ARABIC (UPCOMING)</option>
                          </select>
                          <p className="text-[8px] uppercase tracking-widest mt-2 ml-1">RTL Support scheduled for next deployment cycle.</p>
                       </div>
                    </div>
                  </section>
                </motion.div>
              )}              {activeTab === 'data' && (
                <motion.div 
                  key="data"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                   {/* User Management Section */}
                   <UserManagementSection />

                   <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Root Data Governance</h2>
                    </div>

                    <div className="space-y-8">
                       <div className="p-10 bg-red-50 rounded-[3rem] border border-red-100 flex items-center justify-between gap-12">
                          <div className="space-y-2">
                             <h4 className="text-lg font-black uppercase tracking-tight text-red-600">SYTEM RESET PROTOCOL</h4>
                             <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-loose max-w-xl">
                                Executing this command will irreversibly terminate all sales registries, purchase logs, student nodes, and ledger documents. This action cannot be undone.
                             </p>
                          </div>
                          <button 
                            type="button"
                            onClick={handleResetSystem}
                            className="bg-red-600 text-white px-10 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 shrink-0"
                          >
                            INITIATE WIPE
                          </button>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-8 bg-gray-50 rounded-[2.5rem] flex items-center justify-between border border-gray-100 group">
                             <div className="space-y-1">
                               <p className="text-xs font-black uppercase tracking-tight">EXPORT CLOUD ARCHIVE</p>
                               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Consolidated JSON Dump</p>
                             </div>
                             <button type="button" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-black transition-all">
                                <FileText size={20} />
                             </button>
                          </div>
                          <div className="p-8 bg-gray-50 rounded-[2.5rem] flex items-center justify-between border border-gray-100 group">
                             <div className="space-y-1">
                               <p className="text-xs font-black uppercase tracking-tight">ENCRYPTED DATABASE SYNC</p>
                               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Manual Pulse Synchronization</p>
                             </div>
                             <button type="button" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-black transition-all">
                                <Globe size={20} />
                             </button>
                          </div>
                       </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="advanced-3d-card p-8 bg-black text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                 <div className="space-y-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#C5A059]">
                       <SettingsIcon size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black font-display tracking-tight uppercase">CONFIGURATION PERSISTENCE</h3>
                       <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-2 leading-relaxed">Changes to core parameters are applied instantly across all terminal nodes.</p>
                    </div>
                 </div>
                 
                 <button 
                   onClick={handleSave}
                   disabled={saving}
                   className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                 >
                   {saving ? 'SYNCING...' : 'FORCE SYNC CORE'}
                   <Save size={18} />
                 </button>
              </div>
           </div>

           <div className="advanced-3d-card p-8 bg-gray-50 border border-gray-100 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Activity Feed</h4>
              <div className="space-y-4">
                 {[
                   { msg: 'Business profile nodes updated', time: '12m ago', icon: Building2 },
                   { msg: 'POS print protocol changed', time: '1h ago', icon: Printer },
                   { msg: 'New supplier added to registry', time: '4h ago', icon: Globe },
                 ].map((log, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-300 mt-1">
                        <log.icon size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-600 line-clamp-1">{log.msg}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{log.time}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {message && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className={cn(
                 "p-6 rounded-[2rem] border flex items-center gap-4 shadow-xl",
                 message.type === 'success' ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
               )}
             >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", message.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-wider">{message.text}</p>
                </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
