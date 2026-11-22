import React, { useState } from 'react';
import { normalizeBarcode } from '../utils/barcode';
import {
  FileDown,
  Printer,
  Archive,
  Plus,
  Wallet,
  Boxes,
  AlertTriangle,
  Percent,
  Search,
  Barcode as BarcodeIcon,
  PlusCircle,
  Edit,
  Trash2,
  Package,
  X
} from 'lucide-react';

export default function InventoryTab({
  products = [],
  onOpenAddProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onOpenRestock,
  onOpenBarcode,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Bento Metrics
  const totalStockValue = products.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_qty || 0)), 0);
  const totalSkus = products.length;
  const lowStockCount = products.filter(p => p.stock_qty <= (p.min_stock || 5)).length;
  const avgMargin = products.length > 0
    ? (products.reduce((sum, p) => {
        const cost = p.cost_price || 0;
        const sell = p.sell_price || 0;
        const gp = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
        return sum + gp;
      }, 0) / products.length).toFixed(1)
    : 0;

  // Categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category || 'ทั่วไป')))];

  // Filtered Products (Supports Thai-layout scanned barcodes)
  const cleanQ = normalizeBarcode(search);
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name?.toLowerCase().includes(q) ||
      (p.barcode && (p.barcode.includes(search) || (cleanQ && p.barcode.includes(cleanQ)))) ||
      (p.category && p.category.toLowerCase().includes(q));
    const matchesCat = selectedCat === 'all' || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  // Export CSV with UTF-8 BOM
  const handleExportCsv = () => {
    if (products.length === 0) {
      if (showAlert) showAlert('ไม่มีข้อมูลสินค้าเพื่อส่งออก', 'info');
      else alert('ไม่มีข้อมูลสินค้าเพื่อส่งออก');
      return;
    }
    const headers = ['รหัสสินค้า', 'ชื่อสินค้า', 'หมวดหมู่', 'บาร์โค้ด', 'ต้นทุนต่อชิ้น', 'ราคาขาย', 'กำไรต่อชิ้น', 'สต็อกคงเหลือ', 'จุดสั่งซื้อซ้ำ'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category || 'ทั่วไป'}"`,
      `"${p.barcode || ''}"`,
      (p.cost_price || 0).toFixed(2),
      (p.sell_price || 0).toFixed(2),
      ((p.sell_price || 0) - (p.cost_price || 0)).toFixed(2),
      p.stock_qty,
      p.min_stock || 5
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานคลังสินค้า_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F6F2] font-['Prompt',sans-serif] select-none">
      {/* Top Header & Search Bar */}
      <div className="p-5 bg-white border-b border-[#EAE7E1] flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[#181A18]">จัดการคลังสินค้า &amp; สต็อก</h2>
          <span className="text-xs bg-[#F7F6F2] border border-[#EAE7E1] text-[#717672] px-2.5 py-0.5 rounded-full font-medium">
            {products.length} รายการ
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-[#717672] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า / บาร์โค้ด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#F7F6F2] border border-[#EAE7E1] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18] text-[#181A18] placeholder:text-[#8C948E]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717672] hover:text-[#181A18] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportCsv}
            type="button"
            className="px-3.5 py-2 bg-white hover:bg-[#F7F6F2] text-[#181A18] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#EAE7E1] cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-[#717672]" />
            <span>ส่งออก .CSV</span>
          </button>

          <button
            onClick={onOpenAddProduct}
            type="button"
            className="bg-[#181A18] hover:bg-[#2C302D] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* 4 Bento Telemetry Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Stock Value */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1]">
            <span className="text-xs text-[#717672] font-medium block">มูลค่าสินค้าในคลัง (FIFO)</span>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-[#181A18] tracking-tight font-mono">
                ฿{totalStockValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#8C948E]">
              <span>ประเมินตามราคาต้นทุนจริง</span>
              <span className="font-semibold text-emerald-600 font-mono">100% Active</span>
            </div>
          </div>

          {/* Card 2: Total SKUs */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1]">
            <span className="text-xs text-[#717672] font-medium block">จำนวนสินค้าทั้งหมด</span>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-[#181A18] tracking-tight font-mono">
                {totalSkus} <span className="text-xs font-normal text-[#717672]">รายการ</span>
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#8C948E]">
              <span>{categories.length - 1} หมวดหมู่ในระบบ</span>
            </div>
          </div>

          {/* Card 3: Low Stock Alerts */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1]">
            <span className="text-xs text-[#717672] font-medium block">สินค้าใกล้หมด (เตือนสต็อก)</span>
            <div className="mt-2.5">
              <span className={`text-xl font-bold tracking-tight font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-[#181A18]'}`}>
                {lowStockCount} <span className="text-xs font-normal text-[#717672]">รายการ</span>
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#8C948E]">
              <span>{lowStockCount > 0 ? 'ควรสั่งซื้อเพิ่มเข้าร้าน' : 'ระดับสต็อกเพียงพอทุกรายการ'}</span>
            </div>
          </div>

          {/* Card 4: Avg Margin */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1]">
            <span className="text-xs text-[#717672] font-medium block">อัตรากำไรเฉลี่ย (GP)</span>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-emerald-700 tracking-tight font-mono">
                {avgMargin}% <span className="text-xs font-normal text-[#717672]">GP เฉลี่ย</span>
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#8C948E]">
              <span>คำนวณจากราคาขายและต้นทุน</span>
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === cat
                  ? 'bg-[#181A18] text-white shadow-xs'
                  : 'bg-white text-[#717672] hover:text-[#181A18] border border-[#EAE7E1]'
              }`}
            >
              {cat === 'all' ? 'ทั้งหมด' : cat}
            </button>
          ))}
        </div>

        {/* Product Inventory Table (Clean White Minimal Card) */}
        <div className="bg-white rounded-2xl border border-[#EAE7E1] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <table className="w-full text-left text-xs text-[#717672]">
            <thead className="bg-[#F7F6F2] border-b border-[#EAE7E1] text-[#181A18] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">รูปภาพ</th>
                <th className="py-3 px-4">บาร์โค้ด</th>
                <th className="py-3 px-4">ชื่อสินค้า / หมวดหมู่</th>
                <th className="py-3 px-4 text-right">ต้นทุน/หน่วย</th>
                <th className="py-3 px-4 text-right">กำไร/หน่วย</th>
                <th className="py-3 px-4 text-right">ราคาขายปลีก</th>
                <th className="py-3 px-4 text-center">สต็อกคงเหลือ</th>
                <th className="py-3 px-4 text-right">มูลค่าสต็อก (ทุน)</th>
                <th className="py-3 px-4 text-center">บาร์โค้ด &amp; จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE7E1]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#717672]">
                    ไม่พบรายการสินค้าที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stock_qty <= 0;
                  const isLowStock = p.stock_qty <= (p.min_stock || 5);
                  const itemTotalCostValue = p.stock_qty * (p.cost_price || 0);

                  return (
                    <tr key={p.id} className="hover:bg-[#FBFBFA] transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="w-12 h-12 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] overflow-hidden flex items-center justify-center shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-[#A6ADA8]" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-[#181A18]">
                        {p.barcode || '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-[#181A18]">{p.name}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#F7F6F2] rounded text-[10px] text-[#717672] font-medium border border-[#EAE7E1]">
                          {p.category || 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#181A18] font-mono">
                        ฿{(p.cost_price || 0).toFixed(2)}
                        {p.pack_cost > 0 && (
                          <div className="text-[10px] text-[#717672] font-sans">
                            (ลัง {p.pack_qty} ชิ้น / ฿{p.pack_cost})
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-emerald-700 font-mono">
                        +฿{((p.sell_price || 0) - (p.cost_price || 0)).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#181A18] text-sm font-mono">
                        ฿{(p.sell_price || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock_qty} ชิ้น
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#181A18] font-mono">
                        ฿{itemTotalCostValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenBarcode(p)}
                            type="button"
                            title="ดาวน์โหลด / พิมพ์บาร์โค้ดติดสินค้า"
                            className="px-2 py-1 bg-[#F7F6F2] text-[#181A18] hover:bg-[#EAE7E1] rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-[#EAE7E1] cursor-pointer"
                          >
                            <BarcodeIcon className="w-3.5 h-3.5 text-[#717672]" />
                            <span>บาร์โค้ด</span>
                          </button>

                          <button
                            onClick={() => onOpenRestock(p)}
                            type="button"
                            title="เติมสต็อกสินค้า"
                            className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-200/60 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>เติมของ</span>
                          </button>

                          <button
                            onClick={() => onOpenEditProduct(p)}
                            type="button"
                            title="แก้ไขข้อมูลสินค้า"
                            className="p-1.5 text-[#717672] hover:text-[#181A18] hover:bg-[#F7F6F2] rounded-lg transition-colors border border-[#EAE7E1] cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteProduct(p.id, p.name)}
                            type="button"
                            title="ลบสินค้านี้"
                            className="p-1.5 text-[#717672] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-[#EAE7E1] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}