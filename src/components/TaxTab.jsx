import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  ShieldCheck,
  AlertTriangle,
  Save,
  Trash2,
  ThumbsUp,
  Calendar
} from 'lucide-react';

export default function TaxTab({
  taxSummary,
  taxCashFlow,
  taxYear,
  setTaxYear,
  taxPeriod,
  setTaxPeriod,
  expenses = [],
  onDeleteExpense,
  onSaveExpense,
  onExportCsv,
  showAlert
}) {
  const [localExpense, setLocalExpense] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    category: 'ค่าเช่าสถานที่',
    title: '',
    amount: '',
    receipt_no: '',
    note: ''
  });

  const handleInlineExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!localExpense.title || !localExpense.amount) {
      if (showAlert) showAlert('กรุณากรอกชื่อรายการและจำนวนเงิน', 'warning');
      else alert('กรุณากรอกชื่อรายการและจำนวนเงิน');
      return;
    }
    await onSaveExpense(localExpense);
    setLocalExpense({
      expense_date: new Date().toISOString().slice(0, 10),
      category: 'ค่าเช่าสถานที่',
      title: '',
      amount: '',
      receipt_no: '',
      note: ''
    });
  };

  const revenue = taxSummary?.total_revenue || 0;
  const cogs = taxSummary?.total_cogs || 0;
  const opex = taxSummary?.total_expenses || 0;
  const totalDeductionsActual = cogs + opex;
  const personalAllowance = 60000;

  // Actual method PIT
  const netTaxableActual = Math.max(0, revenue - totalDeductionsActual - personalAllowance);
  const calcThaiPit = (netIncome) => {
    if (netIncome <= 150000) return 0;
    if (netIncome <= 300000) return (netIncome - 150000) * 0.05;
    if (netIncome <= 500000) return 7500 + (netIncome - 300000) * 0.10;
    if (netIncome <= 750000) return 27500 + (netIncome - 500000) * 0.15;
    if (netIncome <= 1000000) return 65000 + (netIncome - 750000) * 0.20;
    return 115000 + (netIncome - 1000000) * 0.25;
  };

  const estimatedTaxActual = calcThaiPit(netTaxableActual);

  // 60% standard lump sum method
  const standardDeduction = revenue * 0.60;
  const netTaxableStandard = Math.max(0, revenue - standardDeduction - personalAllowance);
  const estimatedTaxStandard = calcThaiPit(netTaxableStandard);

  // VAT 1.8M threshold calculation
  const vatThreshold = 1800000;
  const vatPct = Math.min(100, Math.max(0, (revenue / vatThreshold) * 100));
  const vatRemaining = Math.max(0, vatThreshold - revenue);

  // Available Tax Years
  const currentYear = new Date().getFullYear();
  const defaultYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const backendYears = taxSummary?.available_years || [];
  const availableYears = Array.from(new Set([...defaultYears, ...backendYears, taxYear])).sort((a, b) => b - a);

  return (
    <div className="w-full p-4 lg:p-6 space-y-6 max-w-7xl mx-auto font-['Prompt',sans-serif] bg-[#F7F6F2] select-none">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#717672] mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-800 font-bold uppercase tracking-wider text-[10px]">
              ม.40(8) สรรพากร
            </span>
            <span>•</span>
            <div className="flex items-center gap-1.5 bg-white border border-[#EAE7E1] shadow-2xs rounded-xl px-3 py-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <label htmlFor="tax-year-select" className="text-[#717672] font-medium text-xs">
                รอบปีภาษี:
              </label>
              <select
                id="tax-year-select"
                value={taxYear}
                onChange={(e) => setTaxYear(Number(e.target.value))}
                className="bg-transparent font-bold text-[#181A18] text-xs focus:outline-none cursor-pointer pr-1"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    พ.ศ. {yr + 543} ({yr}) {yr === currentYear ? '• ปีปัจจุบัน' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#181A18] tracking-tight">
            ภาษีเงินได้บุคคลธรรมดาพาณิชยกรรม ม.40(8)
          </h1>
          <p className="text-xs text-[#717672] mt-1">
            ระบบตรวจวัดเพดาน VAT 1.8M และสมุดบัญชีเงินสดรับจ่าย ป.ส. 10 สอดคล้องตามประกาศกรมสรรพากร
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F7F6F2] text-[#181A18] text-xs font-semibold rounded-xl shadow-2xs border border-[#EAE7E1] transition-all cursor-pointer"
            type="button"
          >
            <Printer className="w-4 h-4 text-[#717672]" />
            <span>พิมพ์ ป.ส. 10</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#181A18] hover:bg-[#2C302D] text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
            type="button"
          >
            <FileDown className="w-4 h-4" />
            <span>ดาวน์โหลด Excel</span>
          </button>
        </div>
      </section>

      {/* VAT 1.8M Hero Telemetry Bar */}
      <section className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#181A18]">
                เพดานภาษีมูลค่าเพิ่ม 1.8 ล้านบาท (VAT Threshold)
              </span>
            </div>
            <span className="text-xs text-[#717672] block mt-0.5">
              เกณฑ์ยื่นจดภาษีมูลค่าเพิ่ม (ภ.พ.01) เมื่อรายรับเกิน 1,800,000 บาท/ปี
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] text-xs shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-[#181A18]">
              {vatPct >= 100
                ? 'เกินเกณฑ์ 1.8M แล้ว (ต้องจด VAT)'
                : vatPct >= 80
                ? 'เฝ้าระวัง: ใกล้ถึงเกณฑ์ 80%'
                : 'ปลอดภัย: ยังไม่ถึงเกณฑ์จด VAT'}
            </span>
          </div>
        </div>

        {/* Bar */}
        <div className="w-full">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                vatPct >= 100 ? 'bg-rose-500' : vatPct >= 80 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${vatPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-mono">
            <span>฿0.00</span>
            <span className="text-emerald-600 font-bold">
              ปัจจุบัน {vatPct.toFixed(2)}% (฿{revenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </span>
            <span className="font-bold text-slate-900">฿1,800,000.00 (เพดาน)</span>
          </div>
        </div>
      </section>

      {/* PIT Estimator Dual Cards */}
      <section className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#EAE7E1]">
        <div className="pb-4 border-b border-[#EAE7E1]">
          <h2 className="text-sm font-bold text-[#181A18]">
            เปรียบเทียบการคำนวณภาษีบุคคลธรรมดา ม.40(8)
          </h2>
          <p className="text-xs text-[#717672]">เลือกวิธีที่เสียภาษีน้อยที่สุดและถูกต้องตามกฎหมาย</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Method 1: Actual Cost */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative overflow-hidden flex flex-col justify-between">
            {estimatedTaxActual <= estimatedTaxStandard && (
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-bl-lg flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> แนะนำ
              </div>
            )}
            <div>
              <span className="font-bold text-xs text-slate-900 block mb-1">
                วิธีที่ 1: หักค่าใช้จ่ายตามจริง (FIFO + OPEX)
              </span>
              <p className="text-[11px] text-slate-500 mb-3">
                ใช้ต้นทุนสินค้าขายจริง (FIFO) รวมกับค่าใช้จ่ายดำเนินงานร้านที่บันทึก
              </p>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">รายได้สะสม:</span>
                  <span>฿{revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span className="font-sans">หัก ต้นทุนขาย (FIFO):</span>
                  <span>-฿{cogs.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span className="font-sans">หัก ค่าใช้จ่ายร้าน (OPEX):</span>
                  <span>-฿{opex.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-semibold pt-1.5 border-t border-slate-200 font-sans">
                  <span>เงินได้สุทธิ:</span>
                  <span className="font-mono font-bold">฿{netTaxableActual.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">ภาษีที่ต้องชำระ:</span>
              <span className="text-base font-bold text-emerald-600 font-mono">
                ฿{estimatedTaxActual.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Method 2: Standard 60% */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 block mb-1">
                วิธีที่ 2: หักค่าใช้จ่ายเหมา 60%
              </span>
              <p className="text-[11px] text-slate-500 mb-3">
                หักเหมาอัตโนมัติตามอัตรากลุ่มพาณิชย์ซื้อมาขายไป
              </p>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">รายได้สะสม:</span>
                  <span>฿{revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">หัก เหมา 60%:</span>
                  <span>-฿{standardDeduction.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">หัก ลดหย่อนส่วนตัว:</span>
                  <span>-฿{personalAllowance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-semibold pt-1.5 border-t border-slate-200 font-sans">
                  <span>เงินได้สุทธิ:</span>
                  <span className="font-mono font-bold">฿{netTaxableStandard.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">ภาษีที่ต้องชำระ:</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                ฿{estimatedTaxStandard.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Por Sor 10 Ledger Section */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              สมุดบัญชีเงินสดรับ-จ่าย (แบบ ป.ส. 10 กรมสรรพากร)
            </h2>
          </div>

          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            {[
              { id: 'all', label: `ทั้งปี ${taxYear + 543}` },
              { id: 'h1', label: 'ครึ่งปีแรก (ม.ค. - มิ.ย.)' },
              { id: 'h2', label: 'ครึ่งปีหลัง' }
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setTaxPeriod(period.id)}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  taxPeriod === period.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-4 items-start">
          {/* OPEX Form (4 Cols) */}
          <div className="xl:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
              <span>บันทึกค่าใช้จ่ายร้าน (OPEX)</span>
            </div>

            <form onSubmit={handleInlineExpenseSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">วันที่</label>
                  <input
                    type="date"
                    value={localExpense.expense_date}
                    onChange={(e) => setLocalExpense({ ...localExpense, expense_date: e.target.value })}
                    className="w-full bg-white text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">หมวดหมู่</label>
                  <select
                    value={localExpense.category}
                    onChange={(e) => setLocalExpense({ ...localExpense, category: e.target.value })}
                    className="w-full bg-white text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="ค่าเช่าสถานที่">ค่าเช่าสถานที่</option>
                    <option value="ค่าน้ำ-ค่าไฟ">ค่าน้ำ-ค่าไฟ</option>
                    <option value="ค่าแรงพนักงาน">ค่าแรงพนักงาน</option>
                    <option value="ค่าบรรจุภัณฑ์">ค่าบรรจุภัณฑ์</option>
                    <option value="ค่าการตลาด">ค่าการตลาด</option>
                    <option value="ค่าใช้จ่ายอื่นๆ">ค่าใช้จ่ายอื่นๆ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">คำอธิบาย</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าเช่าหน้าร้าน"
                  value={localExpense.title}
                  onChange={(e) => setLocalExpense({ ...localExpense, title: e.target.value })}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">จำนวนเงิน (฿)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={localExpense.amount}
                    onChange={(e) => setLocalExpense({ ...localExpense, amount: e.target.value })}
                    className="w-full bg-white text-slate-800 px-3 py-2 rounded-xl font-mono font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">เลขที่ใบเสร็จ</label>
                  <input
                    type="text"
                    placeholder="INV-001"
                    value={localExpense.receipt_no}
                    onChange={(e) => setLocalExpense({ ...localExpense, receipt_no: e.target.value })}
                    className="w-full bg-white text-slate-800 px-3 py-2 rounded-xl font-mono border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกเข้า ป.ส. 10</span>
              </button>
            </form>

            {/* Expenses List */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                >
                  <div className="truncate pr-1">
                    <span className="text-slate-800 font-medium block truncate">{exp.title}</span>
                    <span className="text-[10px] text-slate-400">{exp.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-rose-600 font-bold">-฿{Number(exp.amount).toFixed(2)}</span>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1 hover:text-rose-600 text-slate-400 transition-colors"
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por Sor 10 Table (8 Cols) */}
          <div className="xl:col-span-8 bg-slate-50 rounded-xl p-4 border border-slate-200 overflow-hidden">
            <div className="w-full overflow-x-auto max-h-[460px] overflow-y-auto">
              {!taxCashFlow?.rows || taxCashFlow.rows.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ยังไม่มีรายการเงินสดรับ-จ่ายในงวดนี้
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="py-2.5 px-3 font-semibold">วัน/เดือน/ปี</th>
                      <th className="py-2.5 px-3 font-semibold font-sans">รายการ</th>
                      <th className="py-2.5 px-3 font-semibold">เอกสารอ้างอิง</th>
                      <th className="py-2.5 px-3 font-semibold text-right text-emerald-600">เงินสดรับ</th>
                      <th className="py-2.5 px-3 font-semibold text-right text-rose-600">เงินสดจ่าย</th>
                      <th className="py-2.5 px-3 font-semibold text-right">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 text-slate-700">
                    {taxCashFlow.rows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{r.date}</td>
                        <td className="py-2.5 px-3 text-slate-900 font-sans font-medium">{r.description}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.ref_no || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          {r.cash_in > 0 ? `+${r.cash_in.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {r.cash_out > 0 ? `-${r.cash_out.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">฿{r.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
