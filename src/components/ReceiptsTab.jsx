import React, { useState } from 'react';
import { parseUtcDate, toLocalDateKey } from '../utils/date';
import {
  Receipt,
  FileDown,
  Printer,
  Database,
  TrendingUp,
  Banknote,
  Search,
  ChevronRight,
  Download,
  ShieldCheck
} from 'lucide-react';

export default function ReceiptsTab({
  orderHistory = [],
  onPrintThermal,
  storeSettings = null,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', '7days'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filtered Orders
  const filteredOrders = orderHistory.filter((ord) => {
    const matchesSearch =
      !search ||
      ord.order_no.toLowerCase().includes(search.toLowerCase()) ||
      (ord.payment_method && ord.payment_method.toLowerCase().includes(search.toLowerCase())) ||
      ord.items?.some((it) => it.product_name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (dateFilter === 'today') {
      const todayStr = toLocalDateKey(new Date());
      const ordDateStr = toLocalDateKey(ord.created_at);
      return todayStr === ordDateStr;
    }

    if (dateFilter === '7days') {
      const orderDate = parseUtcDate(ord.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    }

    return true;
  });

  // Active Selected Order
  const activeOrder = selectedOrder || filteredOrders[0] || null;

  // KPI Metrics
  const totalBills = filteredOrders.length;
  const totalGross = filteredOrders.reduce((sum, ord) => sum + (ord.total_amount || 0), 0);
  const avgBill = totalBills > 0 ? (totalGross / totalBills).toFixed(2) : '0.00';
  const totalProfit = filteredOrders.reduce((sum, ord) => sum + (ord.total_profit || 0), 0);
  const avgProfitMargin = totalGross > 0 ? ((totalProfit / totalGross) * 100).toFixed(1) : '0';

  // Export CSV
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      if (showAlert) showAlert('ไม่มีข้อมูลใบเสร็จเพื่อส่งออก', 'info');
      else alert('ไม่มีข้อมูลใบเสร็จเพื่อส่งออก');
      return;
    }
    const headers = ['เลขที่บิล', 'วันที่-เวลา', 'จำนวนรายการ', 'ยอดรวมสุทธิ (บาท)', 'ภาษีมูลค่าเพิ่ม 7% (บาท)', 'วิธีการชำระเงิน', 'เงินสดรับ', 'เงินทอน'];
    const rows = filteredOrders.map((ord) => {
      const vat = Number(((ord.total_amount || 0) * 7 / 107).toFixed(2));
      return [
        ord.order_no,
        `"${parseUtcDate(ord.created_at).toLocaleString('th-TH')}"`,
        ord.items?.length || 0,
        (ord.total_amount || 0).toFixed(2),
        vat.toFixed(2),
        ord.payment_method || 'เงินสด',
        (ord.cash_received || 0).toFixed(2),
        (ord.change_amount || 0).toFixed(2)
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานใบเสร็จรับเงิน_${dateFilter}_${toLocalDateKey(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full p-4 lg:p-6 space-y-6 max-w-7xl mx-auto font-['Prompt',sans-serif] bg-[#F7F6F2] select-none">
      {/* Header Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#181A18] tracking-tight">
            ประวัติใบเสร็จดิจิทัล &amp; คลังบิลอิเล็กทรอนิกส์
          </h1>
          <p className="text-xs text-[#717672] mt-1">
            Digital Receipts Archive — บันทึกถาวรในเครื่องแบบ SQLite WAL ค้นหาย้อนหลัง พิมพ์ซ้ำ และออกใบกำกับภาษีอย่างย่อ (ABB)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F6F2] text-[#181A18] text-xs font-semibold shadow-2xs border border-[#EAE7E1] transition-all cursor-pointer"
            type="button"
          >
            <FileDown className="w-4 h-4 text-[#717672]" />
            <span>ดาวน์โหลด .CSV</span>
          </button>
          <button
            onClick={() => {
              if (activeOrder) onPrintThermal(activeOrder);
              else if (showAlert) showAlert('กรุณาเลือกบิลเพื่อพิมพ์', 'warning');
              else alert('กรุณาเลือกบิลเพื่อพิมพ์');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181A18] hover:bg-[#2C302D] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            type="button"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์สลิปบิลที่เลือก</span>
          </button>
        </div>
      </section>

      {/* 4 KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#717672] font-medium block">
              ใบเสร็จ ({dateFilter === 'today' ? 'วันนี้' : dateFilter === '7days' ? '7 วัน' : 'ทั้งหมด'})
            </span>
            <div className="text-2xl font-bold text-[#181A18] mt-1 font-mono">
              {totalBills} <span className="text-sm font-normal text-[#717672]">บิล</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Local SQLite Active</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#717672] font-medium block">ยอดขายรวมบิลที่ค้นพบ</span>
            <div className="text-2xl font-bold text-[#181A18] mt-1 font-mono">
              ฿{totalGross.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 text-xs text-[#8C948E]">เฉลี่ย ฿{avgBill}/บิล</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#717672] font-medium block">กำไรขั้นต้นรวม (Gross Profit)</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              ฿{totalProfit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-700 font-semibold font-mono">
            อัตรากำไรเฉลี่ย {avgProfitMargin}% GP
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#717672] font-medium block">สถานะฐานข้อมูล</span>
            <div className="text-2xl font-bold text-[#181A18] mt-1">100% Sync</div>
          </div>
          <div className="mt-3 text-xs text-[#8C948E]">Offline-First Engine</div>
        </div>
      </section>

      {/* Split Drawer: Left List (7 Cols) + Right Live Slip (5 Cols) */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่บิล, สินค้า..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-xs pl-9 pr-3.5 py-2 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'today', label: 'วันนี้' },
              { id: '7days', label: '7 วันล่าสุด' }
            ].map((pill) => {
              const isActive = dateFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setDateFilter(pill.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-start">
          {/* LEFT 7 COLS: Receipts List */}
          <div className="lg:col-span-7 space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ไม่พบบันทึกใบเสร็จในระบบ
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = activeOrder?.id === ord.id;
                const vat = Number(((ord.total_amount || 0) * 7 / 107).toFixed(2));
                const itemCount = ord.items?.reduce((s, it) => s + (it.quantity || 1), 0) || ord.items?.length || 0;

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`group relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-md border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        <Receipt className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono">{ord.order_no}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold">
                              กำลังดู
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {parseUtcDate(ord.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. • {itemCount} ชิ้น
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isSelected
                            ? 'bg-white/20 text-white border-transparent'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        บันทึกบัญชีแล้ว
                      </span>

                      <div className="text-right">
                        <div className={`font-bold font-mono text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          ฿{(ord.total_amount || 0).toFixed(2)}
                        </div>
                        <div
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          VAT ฿{vat.toFixed(2)}
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-white translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT 5 COLS: Thermal Slip Preview */}
          <div className="lg:col-span-5">
            {activeOrder ? (
              <div className="bg-slate-50 text-slate-800 rounded-2xl p-5 border border-slate-200 flex flex-col font-mono text-xs shadow-inner">
                {/* Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1 overflow-hidden shadow-xs border border-slate-200 bg-white p-0.5">
                    <img
                      src={storeSettings?.logo_url || '/logo.png'}
                      alt="Store Logo"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="font-bold text-base text-slate-900 font-sans tracking-wide uppercase">
                    {storeSettings?.store_name || 'POUCH'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">
                    {storeSettings?.store_subtitle || 'ระบบขายปลีกและบันทึกบัญชีสินค้า'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">
                    เลขประจำตัวผู้เสียภาษี: {storeSettings?.tax_id || '0105566012345'}
                  </div>
                  <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-sans text-[11px] font-bold">
                    ใบกำกับภาษีอย่างย่อ (ABB)
                  </div>
                </div>

                {/* Slip Meta */}
                <div className="py-2.5 border-b border-dashed border-slate-300 flex flex-col gap-0.5 font-sans text-slate-600 text-xs">
                  <div className="flex justify-between">
                    <span>เลขที่บิล: <strong className="text-slate-900 font-mono">{activeOrder.order_no}</strong></span>
                    <span>แคชเชียร์ 01</span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันที่: {parseUtcDate(activeOrder.created_at).toLocaleDateString('th-TH')}</span>
                    <span>เวลา: {parseUtcDate(activeOrder.created_at).toLocaleTimeString('th-TH')} น.</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 font-sans">
                  {activeOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-800 text-xs">
                      <div>
                        <span className="font-semibold">{idx + 1}. {it.product_name}</span>
                        <div className="text-[11px] text-slate-500 pl-2">
                          {it.quantity}x @ ฿{(it.unit_price || 0).toFixed(2)}
                        </div>
                      </div>
                      <span className="font-mono font-bold">
                        ฿{(it.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 font-sans text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>ยอดรวมสินค้า</span>
                    <span className="font-mono">฿{(activeOrder.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>ภาษีมูลค่าเพิ่ม VAT 7%</span>
                    <span className="font-mono">฿{((activeOrder.total_amount || 0) * 7 / 107).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-1.5 border-t border-slate-200">
                    <span>ยอดสุทธิ</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      ฿{(activeOrder.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  {(activeOrder.cash_received > 0 || activeOrder.change_amount > 0) && (
                    <>
                      <div className="flex justify-between text-slate-500 pt-1">
                        <span>รับเงินมา</span>
                        <span className="font-mono text-slate-800">฿{(activeOrder.cash_received || activeOrder.total_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>เงินทอน</span>
                        <span className="font-mono">฿{(activeOrder.change_amount || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2.5 pt-3.5 font-sans">
                  <button
                    onClick={() => onPrintThermal(activeOrder)}
                    type="button"
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์สลิปซ้ำ</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    type="button"
                    className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>บันทึก PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                เลือกใบเสร็จเพื่อดูตัวอย่าง
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
