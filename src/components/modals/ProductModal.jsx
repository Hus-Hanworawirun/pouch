import React from 'react';
import { Package, X, RefreshCw, Calculator, Camera } from 'lucide-react';

export default function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  productForm,
  setProductForm,
  onSaveProduct,
  imagePreview,
  setImagePreview,
  setImageFile,
  onAutoGenerateBarcode,
  onCostCalculation,
  existingCategories = []
}) {
  if (!isOpen) return null;

  const defaultCategories = ['กาแฟ Specialty', 'เครื่องดื่มคราฟต์', 'ขนม & เบเกอรี่', 'เมล็ดกาแฟถุง', 'อาหารและทานเล่น', 'ทั่วไป'];
  const allCategories = Array.from(new Set([...defaultCategories, ...existingCategories.filter(c => c !== 'all')]));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Prompt',sans-serif] animate-fadeIn select-none">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#EAE7E1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#EAE7E1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-[#181A18] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#181A18]">
                {editingProduct ? 'แก้ไขสินค้า & สต็อก' : 'เพิ่มสินค้าใหม่ & กำหนดต้นทุน-กำไร'}
              </h3>
              <p className="text-[11px] text-[#717672]">
                กำหนดราคาทุน กำไร ราคาขายหน้าร้าน และการจัดการสต็อกสินค้า
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

        {/* Form */}
        <form onSubmit={onSaveProduct} noValidate className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Product Name */}
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-[#181A18]">
                ชื่อสินค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น กาแฟอาราบิกาคั่วบด 250g"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-xs text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18] transition-all font-medium"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="font-semibold text-[#181A18]">หมวดหมู่สินค้า</label>
              <input
                type="text"
                list="category-suggestions"
                placeholder="เลือกหรือพิมพ์หมวดหมู่"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-xs text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18] transition-all"
              />
              <datalist id="category-suggestions">
                {allCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Barcode */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#181A18]">บาร์โค้ด (Code 128 / EAN-13)</label>
                <button
                  type="button"
                  onClick={onAutoGenerateBarcode}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>สร้างอัตโนมัติ</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="เช่น 885901234567"
                value={productForm.barcode}
                onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-xs font-mono text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18] transition-all"
              />
            </div>

            {/* Smart Pricing Box (Supports Multi-Pack Purchases) */}
            <div className="md:col-span-2 p-4 bg-[#F7F6F2] rounded-2xl border border-[#EAE7E1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#181A18] flex items-center gap-1.5 text-xs">
                  <Calculator className="w-4 h-4 text-[#717672]" />
                  <span>คำนวณต้นทุนต่อหน่วย &amp; ราคาขาย (Smart Pricing)</span>
                </span>
                <span className="text-[10px] text-[#717672] font-medium">
                  รองรับการซื้อหลายแพ็ค / ยกลัง
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                <div>
                  <label className="text-[11px] text-[#717672] block mb-1 font-medium">
                    จำนวนแพ็คที่ซื้อ
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={productForm.pack_count || '1'}
                    onChange={(e) => onCostCalculation('pack_count', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#EAE7E1] font-mono font-bold text-xs text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#717672] block mb-1 font-medium">
                    ราคาต่อแพ็ค (฿)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="เช่น 40"
                    value={productForm.pack_cost}
                    onChange={(e) => onCostCalculation('pack_cost', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#EAE7E1] font-mono font-bold text-xs text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#717672] block mb-1 font-medium">
                    จำนวนชิ้นต่อแพ็ค
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="เช่น 4"
                    value={productForm.pack_qty}
                    onChange={(e) => onCostCalculation('pack_qty', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#EAE7E1] font-mono font-bold text-xs text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#717672] block mb-1 font-medium">
                    ต้นทุน/หน่วย (฿) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="10.00"
                    value={productForm.cost_price}
                    onChange={(e) => onCostCalculation('cost_price', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#EAE7E1] font-mono font-bold text-xs text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#717672] block mb-1 font-medium">
                    กำไร/ชิ้น (฿)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="เช่น 2.00"
                    value={productForm.profit_margin}
                    onChange={(e) => onCostCalculation('profit_margin', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#EAE7E1] font-mono font-bold text-xs text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
                  />
                </div>
              </div>

              {/* Multi-Pack Purchase Summary */}
              {parseFloat(productForm.pack_cost) > 0 && (
                <div className="px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-200/80 flex flex-wrap items-center justify-between text-xs text-[#181A18]">
                  <div className="flex items-center gap-1.5">
                    <span>ซื้อ <b>{productForm.pack_count || 1}</b> แพ็ค × <b>{productForm.pack_qty || 1}</b> ชิ้น =</span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {(parseInt(productForm.pack_count, 10) || 1) * (parseInt(productForm.pack_qty, 10) || 1)} ชิ้น
                    </span>
                    <span className="text-[11px] text-emerald-700">(ลงสต็อกเริ่มต้นให้อัตโนมัติ)</span>
                  </div>
                  <div className="font-mono text-[#181A18] font-semibold">
                    ยอดซื้อรวม ฿{((parseFloat(productForm.pack_count) || 1) * (parseFloat(productForm.pack_cost) || 0)).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Recommended Selling Price */}
              <div className="pt-2.5 border-t border-[#EAE7E1] flex items-center justify-between">
                <div>
                  <label className="font-bold text-[#181A18] block text-xs">
                    ราคาขายหน้าร้าน (Sell Price) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#717672]">ราคารวมภาษีเพื่อขายหน้าร้าน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#181A18] text-sm">฿</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={productForm.sell_price}
                    onChange={(e) => onCostCalculation('sell_price', e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-xl bg-white border-2 border-[#181A18] font-bold font-mono text-[#181A18] text-right focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Stock & Min Stock */}
            <div className="space-y-1">
              <label className="font-semibold text-[#181A18]">
                จำนวนสต็อกเริ่มต้น <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={productForm.stock_qty}
                onChange={(e) => setProductForm({ ...productForm, stock_qty: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] font-mono text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#181A18]">จุดเตือนสต็อกต่ำ (ROP)</label>
              <input
                type="number"
                min="0"
                value={productForm.min_stock}
                onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] font-mono text-[#181A18] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
              />
            </div>

            {/* Product Image */}
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-[#181A18]">รูปภาพสินค้า</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] overflow-hidden flex items-center justify-center shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-[#A6ADA8]" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-[#717672] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-[#EAE7E1] file:text-xs file:font-semibold file:bg-white file:text-[#181A18] hover:file:bg-[#F7F6F2] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
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
              {editingProduct ? 'บันทึกการแก้ไข' : 'บันทึกสินค้าเข้าระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}