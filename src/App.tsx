/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import AppLayout from './AppLayout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Repairs from './pages/Repairs';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Vouchers from './pages/Vouchers';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Smartphone } from 'lucide-react';
import { cn } from './lib/utils';

function AppContent() {
  const { user, loading: authLoading, login, deviceType, calibration: sysCalibration } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="h-screen w-full bg-[#0F0F0F] flex flex-col items-center justify-center text-white overflow-hidden calibrate-grid relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center z-10 perspective-[1000px]"
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotateY: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8 p-6 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
          >
            <Smartphone size={80} strokeWidth={1} className="text-white/80" />
          </motion.div>

          <motion.h1 
            initial={{ letterSpacing: "1.5em", opacity: 0, filter: "blur(10px)" }}
            animate={{ letterSpacing: "0.15em", opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="text-center"
          >
            <span className="block text-5xl md:text-7xl font-black tracking-[0.2em] mb-2">AL QUSAIDAT</span>
            <span className="block text-3xl md:text-5xl font-thin tracking-[0.4em] text-white/50">MOBILES</span>
          </motion.h1>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 flex flex-col items-center"
          >
            <div className="flex items-center gap-4 mb-4">
               <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
               <p className="text-white/30 font-bold uppercase tracking-[0.5em] text-[9px]">Advanced Ecosystem • v2.0</p>
               <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            
            <div className="flex items-center gap-8 mt-12 opacity-40">
               <div className="flex flex-col items-center gap-1">
                 <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                 <span className="text-[8px] font-mono">LATENCY: 12MS</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[8px] font-mono">SYNC: ACTIVE</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                 <span className="text-[8px] font-mono">CALIBRATION: 100%</span>
               </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "300px", opacity: 1 }}
          transition={{ duration: 2, delay: 1, ease: "circIn" }}
          className="h-[1px] bg-gradient-to-r from-transparent via-white to-transparent mt-12 absolute bottom-24 overflow-hidden"
        >
          <motion.div 
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-1/3 h-full bg-white blur-sm"
          />
        </motion.div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFDFD] calibrate-grid opacity-10">
        <div className="w-16 h-16 border-[1px] border-black/5 rounded-2xl flex items-center justify-center animate-spin">
           <div className="w-2 h-2 bg-black rounded-full" />
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (!success) {
      setError('ACCESS DENIED. VERIFY CREDENTIALS.');
    }
  };

  if (!user) {
    return (
      <div className={cn(
        "min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 relative overflow-hidden calibrate-grid",
        deviceType === 'ios' ? "pt-12" : "pt-6"
      )}>
        {/* Background Decors */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-[#C5A059]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-black/5 rounded-full blur-[120px]" />

        <div className="w-full max-w-lg space-y-12 z-10">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-24 h-24 bg-[#0F0F0F] rounded-[2.5rem] text-white mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10"
            >
              <Smartphone size={40} strokeWidth={1.5} />
            </motion.div>
            <div className="space-y-1">
              <h1 className="font-display text-5xl font-black tracking-tighter uppercase">AL QUSAIDAT</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A059]">Advanced Retail Ecosystem</p>
            </div>
          </motion.div>

          <motion.form 
            onSubmit={handleLogin}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="advanced-3d-card p-12 bg-white/80 backdrop-blur-xl space-y-8"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Security Identifier</label>
                  <span className="text-[8px] text-gray-300 font-mono">#AUTH_SYS_v2</span>
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USERNAME"
                  className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-[#C5A059] outline-none transition-all font-bold tracking-wider placeholder:text-gray-300"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Access Key</label>
                  <span className="text-[8px] text-gray-300 font-mono">AES-256-GCM</span>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-[#C5A059] outline-none transition-all font-bold tracking-widest placeholder:text-gray-300"
                />
              </div>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3"
                >
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                  <p className="text-[9px] text-red-500 font-black tracking-widest uppercase">{error}</p>
                </motion.div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full py-5 px-8 bg-[#0F0F0F] text-white rounded-[1.5rem] font-black tracking-[0.2em] text-xs hover:bg-[#1A1A1A] transition-all active:scale-95 shadow-[0_15px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-4 group"
            >
              INITIALIZE SYNC
              <div className="w-5 h-[1px] bg-white/30 group-hover:w-8 transition-all" />
            </button>
          </motion.form>
          
          <div className="flex flex-col items-center gap-4">
             <div className="flex gap-12 opacity-30">
                <div className="flex flex-col items-center">
                   <span className="text-[8px] font-bold">DEVICE SYNC</span>
                   <div className="w-8 h-[1px] bg-black mt-1" />
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[8px] font-bold">EST. 2026</span>
                   <div className="w-8 h-[1px] bg-black mt-1" />
                </div>
             </div>
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em] text-center px-12 leading-relaxed">
               Proprietary Advanced Retail Stack • Al Qusaidat Mobiles UAE 
               <br />
               <span className="text-[8px] opacity-50">Authorized Use Only</span>
             </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'repairs':
        return <Repairs />;
      case 'inventory':
        return <Inventory />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        );
      case 'customers':
        return <Customers />;
      case 'suppliers':
        return <Suppliers />;
      case 'accounting':
        return (
          <ProtectedRoute>
            <Accounting />
          </ProtectedRoute>
        );
      case 'vouchers':
        return (
          <ProtectedRoute>
            <Vouchers />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


