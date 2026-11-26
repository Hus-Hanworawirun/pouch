import React from 'react';
import { Receipt, X, Printer, Check } from 'lucide-react';
import { parseUtcDate } from '../../utils/date';

export default function ReceiptModal({
  order,
  onClose,
  storeSettings
}) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const vat = Number(((order.total_amount || 0) * 7 / 107).toFixed(2));
  const preVat = Number(((order.total_amount || 0) - vat).toFixed(2));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Prompt',sans-serif] animate-fadeIn select-none">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-[#EAE7E1] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3.5 border-b border-[#EAE7E1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-xs font-bold text-[#181A18]">
            <Receipt className="w-4 h-4 text-[#717672]" />
            <span>ใบเสร็จรับเงินดิจิทัล (Digital Receipt)</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#717672] hover:text-[#181A18] p-1.5 rounded-lg hover:bg-[#F7F6F2] transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Slip Body */}
        <div className="p-5 space-y-3 font-mono text-xs text-[#181A18]">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1 overflow-hidden shadow-2xs border border-[#EAE7E1] bg-white p-0.5">
              <img
                src={storeSettings?.logo_url || '/logo.png'}
                alt="Store Logo"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <h3 className="font-bold text-sm text-[#181A18] font-sans tracking-wide uppercase">
              {storeSettings?.store_name || 'POUCH'}
            </h3>
            <p className="text-[10px] text-[#717672] font-sans">{storeSettings?.store_subtitle || 'ระบบขายปลีกและบันทึกบัญชีสินค้า'}</p>
            <p className="text-[10px] text-[#717672] font-sans">เลขประจำตัวผู้เสียภาษี: {storeSettings?.tax_id || '0105566012345'}</p>
            <p className="text-[10px] text-emerald-700 font-sans font-bold pt-0.5">ใบกำกับภาษีอย่างย่อ (ABB)</p>
            <p className="text-[10px] text-[#8C948E] font-mono">เลขที่: {order.order_no}</p>
            <p className="text-[10px] text-[#8C948E]">
              {parseUtcDate(order.created_at).toLocaleString('th-TH')}
            </p>
          </div>

          {/* Items List */}
          <div className="border-t border-b border-dashed border-[#D5D2CB] py-2.5 space-y-1.5">
            {order.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div>
                  <div className="font-sans font-semibold text-[#181A18]">{it.product_name}</div>
                  <div className="text-[#717672] text-[10px]">
                    {it.quantity} x ฿{(it.unit_price || 0).toFixed(2)}
                  </div>
                </div>
                <span className="font-bold text-[#181A18] font-mono">฿{(it.subtotal || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Tax & Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#717672] text-xs">
              <span>ยอดรวมก่อนภาษี (Pre-VAT)</span>
              <span className="font-mono text-[#181A18]">฿{preVat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#717672] text-xs">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
              <span className="font-mono text-[#181A18]">฿{vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#181A18] text-sm pt-1 border-t border-[#EAE7E1]">
              <span>ยอดรวมสุทธิ</span>
              <span className="text-[#181A18] font-extrabold font-mono text-base">฿{(order.total_amount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[#717672] text-xs pt-0.5">
              <span>สถานะรายการ</span>
              <span className="font-semibold text-emerald-700">
                บันทึกบัญชีสำเร็จ
              </span>
            </div>

            {(order.cash_received > 0 || order.change_amount > 0) && (
              <>
                <div className="flex justify-between text-[#717672] text-xs">
                  <span>รับเงินมา</span>
                  <span className="font-mono text-[#181A18]">฿{(order.cash_received || order.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 text-xs">
                  <span>เงินทอน</span>
                  <span className="font-mono">฿{(order.change_amount || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-1 text-[10px] text-[#8C948E] font-sans">
            บันทึกข้อมูลและตัดสต็อก FIFO เรียบร้อยแล้ว
          </div>

          {/* Actions */}
          <div className="pt-2.5 flex gap-2 font-sans">
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 py-2 bg-white hover:bg-[#F7F6F2] text-[#181A18] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#EAE7E1] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#717672]" />
              <span>พิมพ์ใบเสร็จ</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2 bg-[#181A18] hover:bg-[#2C302D] text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}