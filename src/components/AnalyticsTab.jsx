import React, { useState, useMemo } from 'react';
import { parseUtcDate, toLocalDateKey } from '../utils/date';
import {
  TrendingUp,
  TrendingDown,
  FileDown,
  DollarSign,
  Boxes,
  Receipt,
  Search,
  History,
  Eye,
  Award,
  Calendar,
  Layers,
  CheckCircle2,
  PieChart,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';

export default function AnalyticsTab({
  orderHistory = [],
  stockLogs = [],
  products = [],
  expenses = [],
  reportTimeframe = 'today',
  setReportTimeframe,
  onViewReceipt,
  showAlert
}) {
  const [activeSubTab, setActiveSubTab] = useState('orders'); // 'orders' or 'stock_logs'
  const [search, setSearch] = useState('');

  // Filter Orders by Timeframe
  const filteredOrders = useMemo(() => {
    return orderHistory.filter((ord) => {
      if (!ord.created_at) return true;
      const orderDate = parseUtcDate(ord.created_at);
      const now = new Date();

      if (reportTimeframe === 'today') {
        return toLocalDateKey(orderDate) === toLocalDateKey(now);
      }
      if (reportTimeframe === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      }
      if (reportTimeframe === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });
  }, [orderHistory, reportTimeframe]);

  // Filter Expenses by Timeframe
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expDate = exp.expense_date ? parseUtcDate(exp.expense_date) : parseUtcDate(exp.created_at || Date.now());
      const now = new Date();

      if (reportTimeframe === 'today') {
        return toLocalDateKey(expDate) === toLocalDateKey(now);
      }
      if (reportTimeframe === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return expDate >= sevenDaysAgo;
      }
      if (reportTimeframe === 'month') {
        return (
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });
  }, [expenses, reportTimeframe]);

  // Core P&L Financial Calculations
  const grossSales = filteredOrders.reduce((sum, ord) => sum + (ord.total_amount || 0), 0);
  const totalCogs = filteredOrders.reduce((sum, ord) => {
    const orderCogs = ord.items?.reduce(
      (itemSum, it) => itemSum + ((it.unit_cost || 0) * (it.quantity || 1)),
      0
    ) || ord.total_cost || 0;
    return sum + orderCogs;
  }, 0);
  const grossProfit = grossSales - totalCogs;
  const gpMargin = grossSales > 0 ? Number(((grossProfit / grossSales) * 100).toFixed(1)) : 0;

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const netMargin = grossSales > 0 ? Number(((netProfit / grossSales) * 100).toFixed(1)) : 0;

  const orderCount = filteredOrders.length;
  const avgTicket = orderCount > 0 ? (grossSales / orderCount).toFixed(2) : '0.00';

  // Real Dynamic Time Buckets for Chart
  const chartData = useMemo(() => {
    if (reportTimeframe === 'today') {
      const slots = [
        { label: '08:00 - 10:00', shortLabel: '08:00', startHour: 8, endHour: 10, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: '10:00 - 12:00', shortLabel: '10:00', startHour: 10, endHour: 12, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: '12:00 - 14:00', shortLabel: '12:00', startHour: 12, endHour: 14, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: '14:00 - 16:00', shortLabel: '14:00', startHour: 14, endHour: 16, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: '16:00 - 18:00', shortLabel: '16:00', startHour: 16, endHour: 18, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: '18:00 - 20:00', shortLabel: '18:00', startHour: 18, endHour: 20, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: '20:00 - 22:00', shortLabel: '20:00', startHour: 20, endHour: 22, sales: 0, cogs: 0, profit: 0, orders: 0 },
      ];

      filteredOrders.forEach((ord) => {
        const d = parseUtcDate(ord.created_at);
        const h = d.getHours();
        const slot = slots.find((s) => h >= s.startHour && h < s.endHour) || slots[slots.length - 1];
        if (slot) {
          const cogs = ord.items?.reduce((s, it) => s + ((it.unit_cost || 0) * (it.quantity || 1)), 0) || ord.total_cost || 0;
          slot.sales += ord.total_amount || 0;
          slot.cogs += cogs;
          slot.profit += (ord.total_amount || 0) - cogs;
          slot.orders += 1;
        }
      });
      return slots;
    }

    if (reportTimeframe === 'week') {
      const slots = [];
      const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dateStr = toLocalDateKey(targetDate);
        const displayLabel = `${dayNames[targetDate.getDay()]} ${targetDate.getDate()}/${targetDate.getMonth() + 1}`;
        slots.push({
          dateStr,
          label: displayLabel,
          shortLabel: dayNames[targetDate.getDay()],
          sales: 0,
          cogs: 0,
          profit: 0,
          orders: 0
        });
      }

      filteredOrders.forEach((ord) => {
        const orderDateStr = toLocalDateKey(ord.created_at);
        const slot = slots.find((s) => s.dateStr === orderDateStr);
        if (slot) {
          const cogs = ord.items?.reduce((s, it) => s + ((it.unit_cost || 0) * (it.quantity || 1)), 0) || ord.total_cost || 0;
          slot.sales += ord.total_amount || 0;
          slot.cogs += cogs;
          slot.profit += (ord.total_amount || 0) - cogs;
          slot.orders += 1;
        }
      });
      return slots;
    }

    if (reportTimeframe === 'month') {
      const slots = [
        { label: 'สัปดาห์ 1 (1-7)', shortLabel: 'สัปดาห์ 1', startDay: 1, endDay: 7, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: 'สัปดาห์ 2 (8-14)', shortLabel: 'สัปดาห์ 2', startDay: 8, endDay: 14, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: 'สัปดาห์ 3 (15-21)', shortLabel: 'สัปดาห์ 3', startDay: 15, endDay: 21, sales: 0, cogs: 0, profit: 0, orders: 0 },
        { label: 'สัปดาห์ 4 (22-31)', shortLabel: 'สัปดาห์ 4', startDay: 22, endDay: 31, sales: 0, cogs: 0, profit: 0, orders: 0 },
      ];

      filteredOrders.forEach((ord) => {
        const d = parseUtcDate(ord.created_at);
        const day = d.getDate();
        const slot = slots.find((s) => day >= s.startDay && day <= s.endDay) || slots[3];
        if (slot) {
          const cogs = ord.items?.reduce((s, it) => s + ((it.unit_cost || 0) * (it.quantity || 1)), 0) || ord.total_cost || 0;
          slot.sales += ord.total_amount || 0;
          slot.cogs += cogs;
          slot.profit += (ord.total_amount || 0) - cogs;
          slot.orders += 1;
        }
      });
      return slots;
    }

    // 'all' timeframe: Past 6 months
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const slots = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      slots.push({
        year,
        month,
        label: `${monthNames[month]} ${year + 543}`,
        shortLabel: monthNames[month],
        sales: 0,
        cogs: 0,
        profit: 0,
        orders: 0
      });
    }

    filteredOrders.forEach((ord) => {
      const d = parseUtcDate(ord.created_at);
      const slot = slots.find((s) => s.year === d.getFullYear() && s.month === d.getMonth());
      if (slot) {
        const cogs = ord.items?.reduce((s, it) => s + ((it.unit_cost || 0) * (it.quantity || 1)), 0) || ord.total_cost || 0;
        slot.sales += ord.total_amount || 0;
        slot.cogs += cogs;
        slot.profit += (ord.total_amount || 0) - cogs;
        slot.orders += 1;
      }
    });
    return slots;
  }, [filteredOrders, reportTimeframe]);

  // Real Peak Slot
  const peakSlot = useMemo(() => {
    let max = null;
    chartData.forEach((s) => {
      if (!max || s.sales > max.sales) {
        max = s;
      }
    });
    return max && max.sales > 0 ? max : null;
  }, [chartData]);

  // Max value for Chart scaling
  const maxChartVal = useMemo(() => {
    const maxSales = Math.max(...chartData.map((s) => s.sales), 0);
    return maxSales > 0 ? maxSales * 1.15 : 1000;
  }, [chartData]);

  // Top 5 Profit Champions
  const topContributors = useMemo(() => {
    const map = {};
    filteredOrders.forEach((ord) => {
      ord.items?.forEach((it) => {
        const key = it.product_name;
        if (!map[key]) {
          map[key] = {
            name: it.product_name,
            qty: 0,
            revenue: 0,
            cogs: 0,
            profit: 0
          };
        }
        const cogs = (it.unit_cost || 0) * (it.quantity || 1);
        map[key].qty += it.quantity || 1;
        map[key].revenue += it.subtotal || 0;
        map[key].cogs += cogs;
        map[key].profit += (it.subtotal || 0) - cogs;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [filteredOrders]);

  // Search in Orders
  const searchedOrders = useMemo(() => {
    return filteredOrders.filter((ord) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        ord.order_no?.toLowerCase().includes(q) ||
        ord.items?.some((it) => it.product_name?.toLowerCase().includes(q))
      );
    });
  }, [filteredOrders, search]);

  // Search in Stock Logs
  const searchedStockLogs = useMemo(() => {
    return stockLogs.filter((log) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (log.product_name && log.product_name.toLowerCase().includes(q)) ||
        (log.type && log.type.toLowerCase().includes(q)) ||
        (log.note && log.note.toLowerCase().includes(q)) ||
        (log.barcode && log.barcode.includes(q))
      );
    });
  }, [stockLogs, search]);

  // Export CSV with UTF-8 BOM
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      if (showAlert) showAlert('ไม่มีข้อมูลออเดอร์เพื่อส่งออก', 'info');
      else alert('ไม่มีข้อมูลออเดอร์เพื่อส่งออก');
      return;
    }
    const headers = [
      'เลขที่บิล',
      'วันที่-เวลา',
      'จำนวนรายการ',
      'ยอดขายรวม (บาท)',
      'ต้นทุน FIFO (บาท)',
      'กำไรขั้นต้น (บาท)',
      'อัตรากำไร GP%',
      'สถานะบัญชี'
    ];
    const rows = filteredOrders.map((ord) => {
      const cogs = ord.items?.reduce((s, it) => s + ((it.unit_cost || 0) * (it.quantity || 1)), 0) || ord.total_cost || 0;
      const profit = (ord.total_amount || 0) - cogs;
      const gp = ord.total_amount > 0 ? ((profit / ord.total_amount) * 100).toFixed(1) : 0;
      return [
        ord.order_no,
        `"${parseUtcDate(ord.created_at).toLocaleString('th-TH')}"`,
        ord.items?.length || ord.items_count || 1,
        (ord.total_amount || 0).toFixed(2),
        cogs.toFixed(2),
        profit.toFixed(2),
        `${gp}%`,
        'ลงบัญชีแล้ว'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานกำไรขาดทุน_FIFO_${reportTimeframe}_${toLocalDateKey(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full p-4 lg:p-6 space-y-6 max-w-7xl mx-auto font-['Prompt',sans-serif] bg-[#F7F6F2] select-none">
      {/* Header & Controls */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#181A18] tracking-tight">
            ภาพรวมกำไร-ขาดทุน & บัญชีต้นทุน FIFO
          </h1>
          <p className="text-xs text-[#717672] mt-1">
            วิเคราะห์ผลประกอบการ กำไรขั้นต้น และตัดสต็อกต้นทุน FIFO จากฐานข้อมูลจริง
          </p>
        </div>

        {/* Date Filter Pills & Export Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 bg-white rounded-2xl border border-[#EAE7E1] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            {[
              { id: 'today', label: 'ยอดวันนี้' },
              { id: 'week', label: '7 วันนี้' },
              { id: 'month', label: 'เดือนนี้' },
              { id: 'all', label: 'สะสมทั้งหมด' }
            ].map((pill) => {
              const isActive = reportTimeframe === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setReportTimeframe(pill.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#181A18] text-white shadow-xs'
                      : 'text-[#717672] hover:text-[#181A18]'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#181A18] hover:bg-[#2C302D] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            type="button"
            title="ส่งออกไฟล์รายงานเป็น Excel/CSV"
          >
            <FileDown className="w-4 h-4" />
            <span>ส่งออก .CSV</span>
          </button>
        </div>
      </section>

      {/* Top 4 Bento KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <span className="text-xs text-[#717672] font-medium block">ยอดขายรวม (Gross Sales)</span>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-[#181A18] font-mono">
              ฿{grossSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#8C948E]">
            <span className="text-emerald-700 font-medium">
              {reportTimeframe === 'today' ? 'วันนี้' : reportTimeframe === 'week' ? '7 วันที่ผ่านมา' : reportTimeframe === 'month' ? 'เดือนนี้' : 'ยอดสะสมทั้งหมด'}
            </span>
            <span className="font-mono">{orderCount} บิลขาย</span>
          </div>
        </div>

        {/* Card 2: COGS FIFO */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <span className="text-xs text-[#717672] font-medium block">ต้นทุนขาย FIFO (COGS)</span>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-[#181A18] font-mono">
              ฿{totalCogs.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#8C948E]">
            <span>ต้นทุน {grossSales > 0 ? ((totalCogs / grossSales) * 100).toFixed(1) : 0}%</span>
            <span>เฉลี่ย ฿{avgTicket}/บิล</span>
          </div>
        </div>

        {/* Card 3: Gross Profit */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <span className="text-xs text-[#717672] font-medium block">กำไรขั้นต้น (Gross Profit)</span>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              ฿{grossProfit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#8C948E]">
            <span className="text-emerald-700 font-bold">อัตรากำไร GP {gpMargin}%</span>
            <span>หักต้นทุนสินค้าจริง</span>
          </div>
        </div>

        {/* Card 4: Net Operating Profit */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <span className="text-xs text-[#717672] font-medium block">กำไรสุทธิ (Net Operating Profit)</span>
          <div className="my-2.5">
            <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              ฿{netProfit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#8C948E]">
            <span>หักค่าใช้จ่าย ฿{totalExpenses.toFixed(2)}</span>
            <span className="font-bold text-emerald-600 font-mono">Net {netMargin}%</span>
          </div>
        </div>
      </section>

      {/* Middle Section: Real Dynamic Interactive Chart & Top 5 Champions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 8 Cols: Real Dynamic Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  กราฟยอดขายและต้นทุนจริง (Dynamic P&L)
                </span>
                {peakSlot && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    พีคสุด: {peakSlot.shortLabel} (฿{peakSlot.sales.toLocaleString('th-TH')})
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">
                คำนวณแบบ Real-time ตามช่วงเวลา {reportTimeframe === 'today' ? 'รายชั่วโมงวันนี้' : reportTimeframe === 'week' ? '7 วันย้อนหลัง' : reportTimeframe === 'month' ? 'สัปดาห์ในเดือนนี้' : 'รายเดือน'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600"></span>
                <span className="text-slate-600 text-xs">ยอดขาย</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300"></span>
                <span className="text-slate-600 text-xs">ต้นทุน FIFO</span>
              </div>
            </div>
          </div>

          {/* Real Bar Visualization */}
          <div className="w-full pt-2">
            {grossSales === 0 ? (
              <div className="h-48 w-full flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl p-4">
                <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-semibold text-slate-600">
                  ยังไม่มีข้อมูลการขายจริงในช่วงเวลานี้
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  เมื่อคิดเงินและบันทึกออเดอร์ กราฟจะพล็อตยอดขายและต้นทุนตามช่วงเวลาจริงอัตโนมัติ
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visual Chart Bars */}
                <div className="h-48 w-full flex items-end justify-between gap-2 px-1 pt-6 pb-2 border-b border-slate-100">
                  {chartData.map((slot, idx) => {
                    const salesHeightPct = maxChartVal > 0 ? Math.min(100, Math.max(4, (slot.sales / maxChartVal) * 100)) : 4;
                    const cogsHeightPct = maxChartVal > 0 ? Math.min(100, Math.max(2, (slot.cogs / maxChartVal) * 100)) : 2;
                    const isPeak = peakSlot && peakSlot.shortLabel === slot.shortLabel && slot.sales > 0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                        title={`${slot.label}\nยอดขาย: ฿${slot.sales.toFixed(2)}\nต้นทุน: ฿${slot.cogs.toFixed(2)}\nกำไร: ฿${slot.profit.toFixed(2)} (${slot.orders} บิล)`}
                      >
                        {/* Peak indicator */}
                        {isPeak && (
                          <div className="absolute -top-5 text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap animate-bounce">
                            Peak
                          </div>
                        )}

                        {/* Dual Column Bars */}
                        <div className="w-full max-w-[36px] flex items-end justify-center gap-1.5 h-full">
                          {/* Sales Bar */}
                          <div
                            style={{ height: `${salesHeightPct}%` }}
                            className={`w-1/2 rounded-t-md transition-all duration-300 ${
                              isPeak ? 'bg-emerald-600' : 'bg-emerald-600/80 group-hover:bg-emerald-600'
                            }`}
                          />
                          {/* COGS Bar */}
                          <div
                            style={{ height: `${cogsHeightPct}%` }}
                            className="w-1/2 rounded-t-md bg-slate-300 group-hover:bg-slate-400 transition-all duration-300"
                          />
                        </div>

                        {/* Hover Tooltip Card */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs z-30 pointer-events-none min-w-[130px] whitespace-nowrap">
                          <span className="font-bold text-white border-b border-slate-700 pb-1 mb-1">{slot.label}</span>
                          <span className="text-emerald-400 font-mono">ขาย: ฿{slot.sales.toFixed(2)}</span>
                          <span className="text-slate-300 font-mono">ทุน: ฿{slot.cogs.toFixed(2)}</span>
                          <span className="text-emerald-300 font-mono font-bold">กำไร: +฿{slot.profit.toFixed(2)}</span>
                          <span className="text-slate-400 text-[10px] mt-0.5">{slot.orders} รายการ</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Timeline Labels */}
                <div className="flex justify-between items-center text-slate-500 text-xs px-1">
                  {chartData.map((slot, idx) => (
                    <span
                      key={idx}
                      className={`text-center truncate flex-1 ${
                        peakSlot && peakSlot.shortLabel === slot.shortLabel ? 'text-emerald-600 font-bold' : ''
                      }`}
                    >
                      {slot.shortLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>คำนวณจากยอดออเดอร์ในระบบจริง</span>
            </span>
            <span className="text-emerald-600 font-bold font-mono">
              อัตรากำไรขั้นต้นรวม {gpMargin}% GP
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Top 5 Profit Champions */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] flex flex-col justify-between">
          <div className="mb-3">
            <span className="text-sm font-bold text-[#181A18]">5 อันดับสินค้าทำกำไรสูงสุด</span>
            <span className="text-xs text-[#717672] block">Top Gross Profit Contributors</span>
          </div>

          <div className="space-y-2.5 my-auto">
            {topContributors.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ยังไม่มีข้อมูลการขายในรอบนี้
              </div>
            ) : (
              topContributors.map((item, idx) => {
                const gp = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(0) : 0;
                const profitShare = grossProfit > 0 ? Math.min(100, (item.profit / grossProfit) * 100).toFixed(0) : 0;

                return (
                  <div
                    key={item.name}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-slate-800 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-emerald-600 font-mono shrink-0 pl-2">
                        +฿{item.profit.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>ขาย {item.qty} ชิ้น • ยอด ฿{item.revenue.toFixed(0)}</span>
                      <span className="font-semibold text-emerald-600">GP {gp}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${profitShare}%` }}
                        className="h-full bg-emerald-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-right text-xs text-slate-500 font-medium">
            รวมกำไร 5 อันดับ: <span className="font-bold font-mono text-slate-900">฿{topContributors.reduce((s, it) => s + it.profit, 0).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Condensed Real P&L Statement (งบกำไรขาดทุนย่อ) */}
      <section className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE7E1]">
          <div>
            <h3 className="font-bold text-sm text-[#181A18]">งบกำไรขาดทุนย่อ (Condensed P&L Statement)</h3>
            <p className="text-xs text-[#717672]">สรุปรายได้ หักต้นทุน FIFO และค่าใช้จ่ายดำเนินงานจริง</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F7F6F2] border border-[#EAE7E1] text-[#717672] text-xs font-mono font-semibold">
            {reportTimeframe === 'today' ? 'รายวัน' : reportTimeframe === 'week' ? 'สัปดาห์นี้' : reportTimeframe === 'month' ? 'รายเดือน' : 'สะสมทั้งหมด'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">1. รายได้จากการขาย (Revenue)</span>
            <span className="text-lg font-bold font-mono text-slate-900">฿{grossSales.toFixed(2)}</span>
            <span className="text-[11px] text-slate-400 block mt-1">100.0% ของยอดขาย</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">2. ต้นทุนสินค้า FIFO (COGS)</span>
            <span className="text-lg font-bold font-mono text-slate-700">฿{totalCogs.toFixed(2)}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {grossSales > 0 ? ((totalCogs / grossSales) * 100).toFixed(1) : 0}% ของยอดขาย
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-emerald-700 font-semibold block mb-1">3. กำไรขั้นต้น (Gross Profit)</span>
            <span className="text-lg font-bold font-mono text-emerald-600">฿{grossProfit.toFixed(2)}</span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">GP Margin {gpMargin}%</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">4. ค่าใช้จ่ายดำเนินงาน (Expenses)</span>
            <span className="text-lg font-bold font-mono text-rose-600">฿{totalExpenses.toFixed(2)}</span>
            <span className="text-[11px] text-slate-400 block mt-1">{filteredExpenses.length} รายการค่าใช้จ่าย</span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-800 font-bold block mb-1">5. กำไรสุทธิ (Net Profit)</span>
            <span className={`text-lg font-bold font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ฿{netProfit.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">Net Margin {netMargin}%</span>
          </div>
        </div>
      </section>

      {/* Audit Tables Section */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('orders')}
              type="button"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>บันทึกออเดอร์ขายจริง ({filteredOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('stock_logs')}
              type="button"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'stock_logs'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ประวัติเคลื่อนไหวสต็อกจริง ({stockLogs.length})</span>
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขบิล, สินค้า..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-xs pl-9 pr-3.5 py-2 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Orders Table */}
        {activeSubTab === 'orders' && (
          <div className="w-full overflow-x-auto pt-2">
            {searchedOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ไม่พบรายการออเดอร์ในช่วงเวลานี้
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700">
                    <th className="py-2.5 px-3 font-semibold">รหัสบิล</th>
                    <th className="py-2.5 px-3 font-semibold">วัน-เวลา</th>
                    <th className="py-2.5 px-3 font-semibold">รายการสินค้า</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ยอดขาย (฿)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ต้นทุน FIFO (฿)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">กำไรขั้นต้น (฿)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">สถานะบัญชี</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ใบเสร็จ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {searchedOrders.map((ord) => {
                    const cogs = ord.items?.reduce(
                      (s, it) => s + ((it.unit_cost || 0) * (it.quantity || 1)),
                      0
                    ) || ord.total_cost || 0;
                    const profit = (ord.total_amount || 0) - cogs;
                    const gp = ord.total_amount > 0 ? ((profit / ord.total_amount) * 100).toFixed(1) : 0;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {ord.order_no}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {parseUtcDate(ord.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-800 truncate block max-w-[220px]" title={ord.items?.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}>
                            {ord.items?.map((it) => it.product_name).join(', ') || 'สินค้าทั่วไป'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ฿{(ord.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          ฿{cogs.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          +฿{profit.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">({gp}%)</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ลงบัญชีแล้ว
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onViewReceipt(ord)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1 ml-auto whitespace-nowrap cursor-pointer"
                            type="button"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูบิล</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Stock Logs Table */}
        {activeSubTab === 'stock_logs' && (
          <div className="w-full overflow-x-auto pt-2">
            {searchedStockLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ยังไม่มีบันทึกประวัติการเคลื่อนไหวสต็อก
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700">
                    <th className="py-2.5 px-3 font-semibold">วัน-เวลา</th>
                    <th className="py-2.5 px-3 font-semibold">สินค้า</th>
                    <th className="py-2.5 px-3 font-semibold">ประเภทรายการ</th>
                    <th className="py-2.5 px-3 font-semibold text-right">จำนวนที่เปลี่ยน</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ต้นทุน/ชิ้น</th>
                    <th className="py-2.5 px-3 font-semibold text-right">มูลค่ารวม (฿)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">สต็อกปัจจุบัน</th>
                    <th className="py-2.5 px-3 font-semibold">หมายเหตุ / เลขที่บิล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {searchedStockLogs.map((log) => {
                    const isPositive = log.change_qty > 0;
                    const isPurchase = log.type === 'PURCHASE_IN' || log.type === 'INITIAL_STOCK';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {parseUtcDate(log.created_at || Date.now()).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          <div className="truncate max-w-[200px]">{log.product_name || 'สินค้า'}</div>
                          {log.barcode && <span className="text-[10px] text-slate-400 font-mono">{log.barcode}</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isPurchase
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {log.type === 'PURCHASE_IN' ? 'รับเข้าสต็อก' : log.type === 'INITIAL_STOCK' ? 'สต็อกเริ่มต้น' : 'ตัดสต็อกขาย'}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? `+${log.change_qty}` : `${log.change_qty}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ฿{(log.unit_cost || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ฿{(log.total_cost || Math.abs(log.change_qty * (log.unit_cost || 0))).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {log.current_stock !== undefined && log.current_stock !== null ? `${log.current_stock} ชิ้น` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{log.note || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
