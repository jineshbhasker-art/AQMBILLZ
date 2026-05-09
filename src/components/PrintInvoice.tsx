/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, Sale, SaleItem, ProductType, BusinessProfile } from '../types';
import { formatCurrency } from '../lib/utils';
import { Smartphone, ShieldCheck, Hammer, Building2 } from 'lucide-react';
import { businessProfileService } from '../lib/dbService';

interface InvoiceProps {
  sale: Sale;
}

export const PrintInvoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ sale }, ref) => {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const data = await businessProfileService.get();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  return (
    <div ref={ref} className="p-10 bg-white text-black font-sans w-[210mm] min-h-[297mm] mx-auto border border-gray-100 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-8">
        <div className="flex gap-6">
          {profile?.logoBase64 ? (
            <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden border border-gray-100">
               <img src={profile.logoBase64} alt="Company Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
             <div className="w-24 h-24 bg-black rounded-2xl flex items-center justify-center text-white">
                <Building2 size={48} />
             </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase">{profile?.companyName || 'BIZBILLZ'}</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Authorized Retail & Service Hub</p>
            <div className="mt-4 text-xs space-y-0.5 font-medium text-gray-600">
               <p>{profile?.address || 'Premium Business District, UAE'}</p>
               <p>TRN: {profile?.trn || '100234567800003'}</p>
               <p>Phone: {profile?.phone || '+971 X XXX XXXX'}</p>
               <p>Email: {profile?.email || 'sales@bizbillz.com'}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-black text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] inline-block mb-3">Tax Invoice</div>
          <p className="text-lg font-black tracking-tight">{sale.invoiceNumber}</p>
          <p className="text-xs text-gray-500 font-bold mt-1">Date: {new Date(sale.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mt-8 grid grid-cols-2 gap-12">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bill To</p>
          <p className="text-sm font-bold">{sale.customerName || 'Cash Customer'}</p>
          <p className="text-xs text-gray-500">Sharjah, UAE</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Info</p>
          <p className="text-sm font-bold uppercase">{sale.paymentMethod.replace('_', ' ')}</p>
          <p className="text-xs text-gray-500">Status: {sale.status.toUpperCase()}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mt-10 text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-3 text-[10px] font-black uppercase tracking-widest">S.No</th>
            <th className="py-3 text-[10px] font-black uppercase tracking-widest">Description & Specification</th>
            <th className="py-3 text-[10px] font-black uppercase tracking-widest text-right">Qty</th>
            <th className="py-3 text-[10px] font-black uppercase tracking-widest text-right">Rate</th>
            <th className="py-3 text-[10px] font-black uppercase tracking-widest text-right">VAT (5%)</th>
            <th className="py-3 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sale.items.map((item, idx) => (
            <tr key={idx} className="group">
              <td className="py-4 text-xs font-bold text-gray-400">{idx + 1}</td>
              <td className="py-4">
                <div className="flex items-start gap-2">
                  {item.type === ProductType.USED && <ShieldCheck size={14} className="mt-0.5 text-blue-500" />}
                  {item.type === ProductType.REPAIR && <Hammer size={14} className="mt-0.5 text-orange-500" />}
                  {item.type === ProductType.NEW && <Smartphone size={14} className="mt-0.5 text-green-500" />}
                  <div>
                    <h4 className="text-sm font-bold">{item.name}</h4>
                    {item.imei && item.imei.length > 0 && (
                      <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tighter">IMEI: {item.imei.join(', ')}</p>
                    )}
                    {item.type === ProductType.USED && <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Used - Graded A+</p>}
                    {item.repairDetails && (
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-100 text-[10px] text-gray-600">
                        Issue: {item.repairDetails.issue} • Technician: {item.repairDetails.technician}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm font-bold text-right">{item.quantity}</td>
              <td className="py-4 text-sm font-bold text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="py-4 text-sm font-bold text-right text-gray-400">{formatCurrency(item.vatAmount)}</td>
              <td className="py-4 text-sm font-black text-right">{formatCurrency(item.totalWithVat)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mt-12 flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-400 uppercase tracking-widest">Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-400 uppercase tracking-widest">VAT (5%)</span>
            <span>{formatCurrency(sale.vatTotal)}</span>
          </div>
          {sale.discount > 0 && (
             <div className="flex justify-between text-xs font-bold text-red-500">
               <span className="uppercase tracking-widest">Discount</span>
               <span>-{formatCurrency(sale.discount)}</span>
             </div>
          )}
          <div className="flex justify-between text-lg font-black border-t-2 border-black pt-3">
            <span className="uppercase tracking-tighter">Total Payable</span>
            <span>{formatCurrency(sale.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-32 border-t border-gray-100 pt-8 grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-1">
             <h5 className="text-[10px] font-black uppercase tracking-widest">Terms & Conditions</h5>
             {profile?.termsAndConditions ? (
               <p className="text-[9px] text-gray-400 whitespace-pre-line leading-relaxed">
                 {profile.termsAndConditions}
               </p>
             ) : (
               <ul className="text-[9px] text-gray-400 space-y-0.5 list-disc pl-4">
                 <li>Items sold are non-refundable after 3 days.</li>
                 <li>Repair services carry a 30-day limited warranty on replaced parts.</li>
                 <li>Used devices are sold 'as-is' unless extended warranty is purchased.</li>
               </ul>
             )}
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
             <div className="w-10 h-10 bg-black rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 font-display">BZ</div>
             <div className="text-[9px] text-gray-400">
               {profile?.footerNote || 'Scan to verify this invoice on the UAE FTA Portal (Tax compliance verified).'}
             </div>
          </div>
        </div>
        <div className="flex flex-col items-end justify-end space-y-4">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authorized Signatory</p>
              <div className="w-40 h-16 border-b border-gray-200 mt-2" />
           </div>
        </div>
      </div>
    </div>
  );
});

PrintInvoice.displayName = 'PrintInvoice';
