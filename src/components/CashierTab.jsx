import React, { useRef, useEffect } from 'react';
import { normalizeBarcode } from '../utils/barcode';
import {
  Search,
  X,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  Minus,
  PlusCircle,
  Receipt,
  ScanBarcode,
  Sparkles,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function CashierTab({
  products = [],
  cart = [],
  addToCart,
  updateCartQty,
  removeFromCart,
  clearCart,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories = [],
  cashReceived,
  setCashReceived,
  onCheckout,
  onOpenAddProduct,
  onScanBarcode,
  storeSettings = null
}) {
  const searchInputRef = useRef(null);

  // Compute Totals
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCogs = cart.reduce((sum, item) => sum + ((item.unit_cost || 0) * item.quantity), 0);
  const grossProfit = totalAmount - totalCogs;
  const gpPercent = totalAmount > 0 ? ((grossProfit / totalAmount) * 100).toFixed(1) : 0;

  // Thai VAT 7%
  const vatAmount = Number((totalAmount * 7 / 107).toFixed(2));
  const preVatAmount = Number((totalAmount - vatAmount).toFixed(2));

  // Change Calculation
  const receivedNum = parseFloat(cashReceived) || 0;
  const changeDue = receivedNum >= totalAmount ? Number((receivedNum - totalAmount).toFixed(2)) : 0;

  // Filtered Products (Supports Thai-layout scanned barcodes transliterated to numbers)
  const cleanSearch = normalizeBarcode(searchQuery);
  const filteredProducts = products.filter((p) => {
    const qLower = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(qLower) ||
      (p.barcode && (
        p.barcode.includes(searchQuery) ||
        (cleanSearch && p.barcode.includes(cleanSearch))
      ));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // F2 and F10 Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F10' || (e.code === 'Space' && e.target === document.body)) {
        if (cart.length > 0) {
          e.preventDefault();
          onCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, onCheckout]);

  const getQuickTenderOptions = () => {
    if (totalAmount <= 0) return [100, 500, 1000];
    const roundedExact = totalAmount;
    const next100 = Math.ceil(totalAmount / 100) * 100;
    const next500 = Math.ceil(totalAmount / 500) * 500;
    const next1000 = Math.ceil(totalAmount / 1000) * 1000;
    const set = new Set([roundedExact, next100, next500, next1000]);
    return Array.from(set).sort((a, b) => a - b).slice(0, 4);
  };

  // Thai Date formatting
  const todayDateString = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex-1 flex overflow-hidden font-['Prompt',sans-serif] bg-[#F7F6F2] select-none">
      {/* 1. LEFT MAIN AREA: CATALOG & BROWSER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header & Search Area */}
        <div className="p-6 pb-2 space-y-4 shrink-0">
          {/* Top Banner: Date, Title & Action */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-[#717672] uppercase">
                {todayDateString}
              </p>
              <h1 className="text-2xl font-bold text-[#181A18] tracking-tight mt-0.5">
                ระบบขายหน้าร้าน (Point of sale)
              </h1>
            </div>

            {onOpenAddProduct && (
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="bg-white hover:bg-slate-50 border border-[#EAE7E1] text-[#181A18] rounded-2xl px-3.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                title="เพิ่มสินค้าใหม่"
              >
                <Plus className="w-4 h-4 text-[#717672] shrink-0" />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            )}
          </div>

          {/* Search Bar matching the mock-up */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#717672] absolute left-4 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  const trimmed = searchQuery.trim();
                  const normalized = normalizeBarcode(trimmed);
                  const matchesBarcode = products.some(
                    (p) => p.barcode && (p.barcode === normalized || p.barcode === trimmed)
                  );
                  if (matchesBarcode || /^\d{3,}$/.test(normalized)) {
                    e.preventDefault();
                    onScanBarcode?.(trimmed);
                    setSearchQuery('');
                  }
                }
              }}
              placeholder="ค้นหาสินค้า หรือ ยิงบาร์โค้ด..."
              className="w-full bg-white border border-[#EAE7E1] rounded-2xl pl-11 pr-28 py-3 text-xs text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            />
            <div className="absolute right-3.5 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="ล้างคำค้นหา"
                  className="text-[#8C948E] hover:text-[#181A18] p-1 rounded-lg hover:bg-[#F7F6F2] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="px-2 py-0.5 rounded-md bg-[#F7F6F2] border border-[#EAE7E1] text-[10px] font-mono text-[#717672] font-semibold">
                F2
              </span>
              <ScanBarcode className="w-4 h-4 text-[#717672]" />
            </div>
          </div>

          {/* Category Filter Pills matching the mock-up */}
          <div className="flex items-center flex-wrap gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#181A18] text-white shadow-sm'
                  : 'bg-white text-[#717672] border border-[#EAE7E1] hover:border-[#D5D2CB] hover:text-[#181A18]'
              }`}
            >
              สินค้าทั้งหมด
            </button>
            {categories
              .filter((c) => c !== 'all')
              .map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#181A18] text-white shadow-sm'
                      : 'bg-white text-[#717672] border border-[#EAE7E1] hover:border-[#D5D2CB] hover:text-[#181A18]'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>

          {/* Section Heading */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-xs font-semibold text-[#181A18]">
              {selectedCategory === 'all' ? 'สินค้าทั้งหมด' : selectedCategory}
              <span className="ml-2 font-normal text-[#717672]">
                {filteredProducts.length} รายการ
              </span>
            </h2>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-[#717672]">
              <Package className="w-10 h-10 mb-2 stroke-[1.5] text-[#A6ADA8]" />
              <p className="text-xs font-medium">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
              <p className="text-[11px] text-[#8C948E] mt-0.5">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_qty <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-white rounded-2xl p-2.5 border border-[#EAE7E1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all flex flex-col group ${
                      isOutOfStock
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:shadow-md hover:border-[#D5D2CB] hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-[#F2F0EA] relative flex items-center justify-center">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-[#A6ADA8]" />
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                            สินค้าหมด
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="mt-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1.5">
                        <h3 className="font-semibold text-xs text-[#181A18] line-clamp-1 leading-snug group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </h3>
                        <span className="font-bold text-xs text-[#181A18] font-mono shrink-0">
                          ฿{Number(p.sell_price).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-[#717672]">
                        <span className="truncate">
                          {p.category || 'ทั่วไป'} · {p.stock_qty} ชิ้น
                        </span>
                        <span className="text-[10px] text-[#8C948E] font-mono">
                          ทุน ฿{(p.cost_price || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT CART PANEL: CURRENT ORDER */}
      <div className="w-80 lg:w-96 xl:w-[410px] bg-white border-l border-[#EAE7E1] flex flex-col shrink-0 select-none shadow-[-4px_0_16px_rgba(0,0,0,0.02)]">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-[#EAE7E1] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-sm text-[#181A18]">
              รายการสั่งซื้อปัจจุบัน
            </h2>
            <span className="w-5 h-5 rounded-full bg-[#F7F6F2] border border-[#EAE7E1] text-[#181A18] text-[10px] font-bold flex items-center justify-center font-mono">
              {totalItems}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              type="button"
              className="text-xs text-[#717672] hover:text-rose-600 font-medium transition-colors cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#717672] py-16">
              <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 text-[#D5D2CB]" />
              <p className="text-xs font-semibold text-[#181A18]">ไม่มีรายการในตะกร้า</p>
              <p className="text-[11px] text-[#717672] mt-0.5">คลิกสินค้าหรือยิงบาร์โค้ดเพื่อเริ่มขาย</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="p-3 bg-[#F7F6F2] rounded-2xl border border-[#EAE7E1] flex items-center gap-3 transition-colors hover:border-[#D5D2CB]"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-white border border-[#EAE7E1] overflow-hidden shrink-0 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-[#A6ADA8]" />
                  )}
                </div>

                {/* Info & Quantity Stepper */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-semibold text-xs text-[#181A18] truncate leading-tight">
                      {item.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-[#A6ADA8] hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                      title="ลบรายการ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#717672] mt-0.5 font-mono">
                    ฿{item.unit_price.toFixed(2)} ต่อชิ้น
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper pill */}
                    <div className="flex items-center bg-white border border-[#EAE7E1] rounded-lg px-1.5 py-0.5 shadow-2xs">
                      <button
                        onClick={() => updateCartQty(item.product_id, -1)}
                        className="text-[#717672] hover:text-[#181A18] p-1 transition-colors cursor-pointer"
                        type="button"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold font-mono text-[#181A18]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.product_id, 1)}
                        className="text-[#717672] hover:text-[#181A18] p-1 transition-colors cursor-pointer"
                        type="button"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <span className="font-bold text-xs text-[#181A18] font-mono">
                      ฿{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Checkout & Totals */}
        <div className="p-5 border-t border-[#EAE7E1] bg-white space-y-4 shrink-0 shadow-xs">
          {/* Price Breakdown */}
          <div className="space-y-1.5 text-xs text-[#717672] font-sans">
            <div className="flex justify-between">
              <span>ยอดก่อนภาษี (Pre-VAT)</span>
              <span className="font-mono text-[#181A18]">฿{preVatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
              <span className="font-mono text-[#181A18]">฿{vatAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-[#EAE7E1] flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#181A18]">ยอดรวมสุทธิ (Total)</span>
              <span className="text-2xl font-extrabold text-[#181A18] font-mono">
                ฿{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick Tender & Cash Input */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {getQuickTenderOptions().map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCashReceived(opt.toString())}
                  className="px-2.5 py-1 bg-[#F7F6F2] hover:bg-[#EAE7E1] border border-[#EAE7E1] text-[#181A18] rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer shrink-0"
                >
                  ฿{opt.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCashReceived(totalAmount.toString())}
                className="px-2.5 py-1 bg-[#F7F6F2] hover:bg-[#EAE7E1] border border-[#EAE7E1] text-emerald-700 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                พอดี
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="ระบุจำนวนเงินที่รับ (เช่น 500, 1000)"
                className="w-full px-3.5 py-2 bg-[#F7F6F2] border border-[#EAE7E1] rounded-xl text-xs font-mono text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
              />
              {changeDue > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 font-mono">
                  ทอน ฿{changeDue.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Big Black CTA 'Charge' Button matching the mock-up */}
          <div className="space-y-1 text-center">
            <button
              type="button"
              onClick={onCheckout}
              className={`w-full bg-[#181A18] text-white rounded-2xl py-3.5 px-5 font-bold text-sm flex items-center justify-between shadow-md transition-all cursor-pointer group ${
                cart.length === 0 ? 'opacity-50 hover:opacity-70' : 'hover:bg-[#2C302D]'
              }`}
            >
              <span className="tracking-wide">คิดเงิน (ชำระเงิน)</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span>฿{totalAmount.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
            <p className="text-[10px] text-[#8C948E]">
              กด Spacebar หรือ F10 เพื่อชำระเงินทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}