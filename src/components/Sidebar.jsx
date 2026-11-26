import React from 'react';
import {
  ShoppingBag,
  Boxes,
  BarChart3,
  Receipt,
  Landmark,
  Barcode,
  Database,
  Sparkles,
  RotateCcw,
  ArrowUpCircle,
  RotateCw,
  Pencil
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLoadSeed,
  onClearData,
  cartCount = 0,
  orderHistoryCount = 0,
  taxSummary = null,
  appVersion = '1.1.3',
  onCheckUpdate = () => {},
  isCheckingUpdate = false,
  storeSettings = null,
  onOpenStoreSettings = () => {}
}) {
  return (
    <aside className="w-56 xl:w-64 bg-[#141715] text-[#A6ADA8] flex flex-col shrink-0 border-r border-[#232824] select-none font-['Prompt',sans-serif]">
      {/* Brand Header */}
      <div
        onClick={onOpenStoreSettings}
        className="p-4 border-b border-[#232824] flex items-center gap-3 hover:bg-[#1A1F1B] transition-colors cursor-pointer group"
        title="คลิกเพื่อตั้งค่าชื่อร้านและโลโก้"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md border border-[#2D342F] bg-[#1A1F1B] p-0.5 group-hover:border-emerald-500/60 transition-colors">
          <img
            src={storeSettings?.logo_url || '/logo.png'}
            alt="Store Logo"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h1 className="font-bold text-base text-white tracking-wide truncate group-hover:text-emerald-400 transition-colors">
              {storeSettings?.store_name || 'Pouch'}
            </h1>
            <span className="opacity-0 group-hover:opacity-100 text-[#8C948E] group-hover:text-white transition-opacity p-0.5">
              <Pencil className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-[#8C948E] truncate">
            {storeSettings?.store_subtitle || 'ระบบแคชเชียร์ & คลังสต็อก'}
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 pt-3 pb-1.5 space-y-1.5 overflow-y-auto scrollbar-none">
        {/* 1. ขายหน้าร้าน (Cashier) */}
        <button
          onClick={() => setActiveTab('pos')}
          type="button"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 ease-out cursor-pointer ${
            activeTab === 'pos'
              ? 'bg-[#1E2520] border-2 border-[#D8D2BC] text-[#F7F6F2] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
              : 'bg-transparent border-2 border-transparent text-[#8C948E] hover:text-[#E2DDD0] hover:bg-[#181E1A]'
          }`}
        >
          <ShoppingBag className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'pos' ? 'text-[#F7F6F2]' : 'text-[#8C948E]'}`} />
          <span className="truncate">ขายหน้าร้าน (POS)</span>
          {cartCount > 0 && (
            <span className={`ml-auto font-bold px-2 py-0.5 rounded-full text-[10px] transition-colors ${
              activeTab === 'pos' ? 'bg-[#D8D2BC] text-[#141715]' : 'bg-[#232824] text-[#A6ADA8]'
            }`}>
              {cartCount}
            </span>
          )}
        </button>

        {/* 2. คลังสินค้า & ต้นทุน (Inventory) */}
        <button
          onClick={() => setActiveTab('inventory')}
          type="button"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 ease-out cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#1E2520] border-2 border-[#D8D2BC] text-[#F7F6F2] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
              : 'bg-transparent border-2 border-transparent text-[#8C948E] hover:text-[#E2DDD0] hover:bg-[#181E1A]'
          }`}
        >
          <Boxes className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'inventory' ? 'text-[#F7F6F2]' : 'text-[#8C948E]'}`} />
          <span className="truncate">คลังสินค้า &amp; ต้นทุน</span>
        </button>

        {/* 3. ภาพรวมกำไร-ขาดทุน */}
        <button
          onClick={() => setActiveTab('accounting')}
          type="button"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 ease-out cursor-pointer ${
            activeTab === 'accounting'
              ? 'bg-[#1E2520] border-2 border-[#D8D2BC] text-[#F7F6F2] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
              : 'bg-transparent border-2 border-transparent text-[#8C948E] hover:text-[#E2DDD0] hover:bg-[#181E1A]'
          }`}
        >
          <BarChart3 className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'accounting' ? 'text-[#F7F6F2]' : 'text-[#8C948E]'}`} />
          <span className="truncate">ภาพรวมกำไร-ขาดทุน</span>
        </button>

        {/* 4. ประวัติใบเสร็จดิจิทัล */}
        <button
          onClick={() => setActiveTab('receipts')}
          type="button"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 ease-out cursor-pointer ${
            activeTab === 'receipts'
              ? 'bg-[#1E2520] border-2 border-[#D8D2BC] text-[#F7F6F2] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
              : 'bg-transparent border-2 border-transparent text-[#8C948E] hover:text-[#E2DDD0] hover:bg-[#181E1A]'
          }`}
        >
          <Receipt className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'receipts' ? 'text-[#F7F6F2]' : 'text-[#8C948E]'}`} />
          <span className="truncate">ประวัติใบเสร็จดิจิทัล</span>
          {orderHistoryCount > 0 && (
            <span className={`ml-auto font-semibold px-2 py-0.5 rounded-full text-[10px] transition-colors ${
              activeTab === 'receipts' ? 'bg-[#D8D2BC] text-[#141715]' : 'bg-[#232824] text-[#A6ADA8]'
            }`}>
              {orderHistoryCount}
            </span>
          )}
        </button>

        {/* 5. บัญชีภาษีสรรพากร */}
        <button
          onClick={() => setActiveTab('tax')}
          type="button"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 ease-out cursor-pointer ${
            activeTab === 'tax'
              ? 'bg-[#1E2520] border-2 border-[#D8D2BC] text-[#F7F6F2] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
              : 'bg-transparent border-2 border-transparent text-[#8C948E] hover:text-[#E2DDD0] hover:bg-[#181E1A]'
          }`}
        >
          <Landmark className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'tax' ? 'text-[#F7F6F2]' : 'text-[#8C948E]'}`} />
          <span className="truncate">บัญชีภาษี สรรพากร</span>
        </button>
      </nav>

      {/* VAT Progress Indicator in Sidebar Footer */}
      {taxSummary && (
        <div className="p-3.5 bg-[#101412] border-t border-[#232824] text-xs space-y-2">
          <div className="flex justify-between items-center text-[11px] text-[#8C948E]">
            <span>เกณฑ์ VAT 1.8M</span>
            <span className="font-bold text-amber-400">{taxSummary.vat?.progress_percentage || 0}%</span>
          </div>
          <div className="w-full bg-[#1A1F1B] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                taxSummary.vat?.is_required ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, taxSummary.vat?.progress_percentage || 0)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-[#717872] truncate">
            {taxSummary.vat?.is_required
              ? 'เกินเกณฑ์ 1.8M ต้องจด VAT'
              : `ยอดขายปีนี้ ฿${(taxSummary.total_revenue || 0).toLocaleString()}`}
          </p>
        </div>
      )}

      {/* DATA MANAGEMENT (DEMO / CLEAR) */}
      <div className="p-3 bg-[#101412] border-t border-[#232824] text-xs space-y-1.5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#717872] font-semibold px-1">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-[#8C948E]" />
            <span>ฐานข้อมูลระบบ</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onLoadSeed}
            className="py-1.5 px-2 bg-[#1A1F1B] hover:bg-[#222924] text-amber-300 rounded-lg flex items-center justify-center gap-1 font-medium text-[11px] transition-colors border border-[#232824] cursor-pointer"
            title="โหลดสินค้าตัวอย่าง 5 รายการ เพื่อทดสอบระบบ"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>ใส่ Demo</span>
          </button>
          <button
            type="button"
            onClick={onClearData}
            className="py-1.5 px-2 bg-[#1A1F1B] hover:bg-rose-950/60 text-[#8C948E] hover:text-rose-300 rounded-lg flex items-center justify-center gap-1 font-medium text-[11px] transition-colors border border-[#232824] cursor-pointer"
            title="ล้างข้อมูลสินค้า ประวัติบิล และบัญชีทั้งหมด คืนค่าเริ่มต้น"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างระบบ</span>
          </button>
        </div>
      </div>

      {/* APP VERSION & AUTO-UPDATE FOOTER */}
      <div className="p-3 bg-[#0D100E] border-t border-[#232824] text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#8C948E]" title="เวอร์ชันปัจจุบันของโปรแกรม">
          <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[11px] text-[#A6ADA8]">v{appVersion}</span>
        </div>
        <button
          type="button"
          onClick={onCheckUpdate}
          disabled={isCheckingUpdate}
          className="py-1 px-2.5 bg-[#1A1F1B] hover:bg-[#222924] text-white rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-colors border border-[#232824] disabled:opacity-60 cursor-pointer"
          title="ตรวจหาเวอร์ชันใหม่จาก GitHub Releases"
        >
          <RotateCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin text-emerald-400' : 'text-[#8C948E]'}`} />
          <span>{isCheckingUpdate ? 'กำลังเช็ค...' : 'ตรวจหาอัปเดต'}</span>
        </button>
      </div>
    </aside>
  );
}