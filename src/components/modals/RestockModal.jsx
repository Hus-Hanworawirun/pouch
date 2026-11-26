import React from 'react';
import { Archive, X, Package } from 'lucide-react';

export default function RestockModal({
  isOpen,
  onClose,
  product,
  restockForm,
  setRestockForm,
  onSubmitRestock
}) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Prompt',sans-serif] animate-fadeIn select-none">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#EAE7E1] shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#EAE7E1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-[#181A18] flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#181A18]">
                รับเข้าสต็อกสินค้า (FIFO Batch)
              </h3>
              <p className="text-[11px] text-[#717672]">
                บันทึกประวัติการรับของและคำนวณต้นทุนสินค้าล็อตใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#717672] hover:text-[#181A18] p-1.5 rounded-lg hover:bg-[#F7F6F2] transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview Card */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#F7F6F2] rounded-xl border border-[#EAE7E1]">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#EAE7E1] overflow-hidden flex items-center justify-center shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-5 h-5 text-[#A6ADA8]" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-[#181A18] truncate">{product.name}</h4>
              <p className="text-[11px] text-[#717672]">
                สต็อกปัจจุบัน: <span className="font-bold text-emerald-700 font-mono">{product.stock_qty}</span> ชิ้น • ทุนเดิม: ฿{(product.cost_price || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmitRestock} noValidate className="space-y-3.5">
            <div>
              <label className="font-semibold text-[#181A18] block mb-1">
                จำนวนที่รับเข้าเพิ่ม (ชิ้น) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="เช่น 24"
                value={restockForm.add_qty}
                onChange={(e) => setRestockForm({ ...restockForm, add_qty: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-sm font-bold font-mono text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#181A18] block mb-1">
                ต้นทุนต่อหน่วยล็อตนี้ (฿/ชิ้น)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={`ค่าเริ่มต้น: ${(product.cost_price || 0).toFixed(2)}`}
                value={restockForm.batch_cost}
                onChange={(e) => setRestockForm({ ...restockForm, batch_cost: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] font-mono text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
              />
              <span className="text-[10px] text-[#717672] mt-1 block">
                หากเว้นว่าง ระบบจะใช้ราคาต้นทุนเดิม (฿{(product.cost_price || 0).toFixed(2)}/ชิ้น)
              </span>
              {parseInt(restockForm.add_qty, 10) > 0 && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-[#181A18] flex items-center justify-between">
                  <span>รวมต้นทุนซื้อล็อตนี้ ({parseInt(restockForm.add_qty, 10)} ชิ้น):</span>
                  <span className="font-bold font-mono text-emerald-800">
                    ฿{(
                      parseInt(restockForm.add_qty, 10) *
                      (restockForm.batch_cost !== '' && !isNaN(parseFloat(restockForm.batch_cost))
                        ? parseFloat(restockForm.batch_cost)
                        : (product.cost_price || 0))
                    ).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-[#181A18] block mb-1">
                หมายเหตุการรับเข้า / ซัพพลายเออร์
              </label>
              <input
                type="text"
                placeholder="เช่น สั่งเพิ่มจาก บจก. ซัพพลาย"
                value={restockForm.note}
                onChange={(e) => setRestockForm({ ...restockForm, note: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="updateCost"
                checked={restockForm.update_cost_price}
                onChange={(e) => setRestockForm({ ...restockForm, update_cost_price: e.target.checked })}
                className="w-4 h-4 rounded text-[#181A18] focus:ring-[#181A18] border-[#EAE7E1] accent-[#181A18]"
              />
              <label htmlFor="updateCost" className="text-xs text-[#717672] cursor-pointer">
                อัปเดตราคาต้นทุนมาตรฐานของสินค้าตัวนี้ตามล็อตใหม่ด้วย
              </label>
            </div>

            <div className="pt-3 border-t border-[#EAE7E1] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#F7F6F2] text-[#717672] hover:text-[#181A18] text-xs font-semibold transition-colors border border-[#EAE7E1] cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#181A18] hover:bg-[#2C302D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                ยืนยันการรับเข้า
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}