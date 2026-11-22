import React from 'react';
import {
  Download,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
  ArrowUpCircle
} from 'lucide-react';

export default function UpdateModal({
  isOpen,
  onClose,
  updateState,
  onRestart,
  onCheckAgain
}) {
  if (!isOpen) return null;

  const {
    status = 'idle', // 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error'
    version = '',
    currentVersion = '1.1.1',
    percent = 0,
    speed = 0,
    transferred = 0,
    total = 0,
    message = '',
    isPackaged = false
  } = updateState || {};

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none font-['Prompt',sans-serif] animate-fadeIn">
      <div className="bg-white border border-[#EAE7E1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#EAE7E1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] flex items-center justify-center text-[#181A18]">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#181A18]">ระบบอัปเดตโปรแกรม</h3>
              <p className="text-[11px] text-[#717672]">
                เวอร์ชันปัจจุบัน: <span className="font-mono font-semibold text-[#181A18]">v{currentVersion}</span>
                {!isPackaged && <span className="ml-1 text-amber-600 font-medium">(Dev Mode)</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#717672] hover:text-[#181A18] hover:bg-[#F7F6F2] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Status 1: Checking */}
          {status === 'checking' && (
            <div className="py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F7F6F2] border border-[#EAE7E1] flex items-center justify-center mx-auto text-[#181A18] animate-spin">
                <RotateCw className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-[#181A18]">กำลังตรวจหาเวอร์ชันใหม่...</h4>
              <p className="text-xs text-[#717672]">กำลังเชื่อมต่อไปยัง GitHub Releases</p>
            </div>
          )}

          {/* Status 2: Available */}
          {status === 'available' && (
            <div className="py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto text-amber-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-[#181A18]">พบเวอร์ชันใหม่ {version}!</h4>
              <p className="text-xs text-[#717672]">ระบบกำลังเริ่มดาวน์โหลดตัวติดตั้งให้อัตโนมัติ...</p>
            </div>
          )}

          {/* Status 3: Downloading */}
          {status === 'downloading' && (
            <div className="py-3 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mx-auto text-emerald-700 animate-bounce">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#181A18]">กำลังดาวน์โหลดเวอร์ชัน {version}</h4>
                <p className="text-xs text-[#717672] mt-0.5">
                  ดาวน์โหลดแล้ว {formatBytes(transferred)} / {formatBytes(total)} ({formatBytes(speed)}/s)
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-medium text-[#717672]">
                  <span>ความคืบหน้า</span>
                  <span className="text-[#181A18] font-bold">{percent}%</span>
                </div>
                <div className="w-full bg-[#F7F6F2] h-2.5 rounded-full overflow-hidden border border-[#EAE7E1]">
                  <div
                    className="h-full bg-[#181A18] transition-all duration-300 rounded-full"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Status 4: Downloaded (Ready to Install) */}
          {status === 'downloaded' && (
            <div className="py-3 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#181A18]">ดาวน์โหลดเวอร์ชัน {version} สำเร็จแล้ว!</h4>
                <p className="text-xs text-[#717672] mt-1">
                  พร้อมติดตั้งทันที คลิกปุ่มด้านล่างเพื่อรีสตาร์ตและเปิดใช้งานเวอร์ชันใหม่
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onRestart}
                  className="w-full py-2.5 bg-[#181A18] hover:bg-[#2C302D] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>รีสตาร์ตเพื่อติดตั้งทันที</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-white hover:bg-[#F7F6F2] text-[#717672] hover:text-[#181A18] rounded-xl text-xs font-medium transition-colors border border-[#EAE7E1] cursor-pointer"
                >
                  ไว้ติดตั้งภายหลังเมื่อปิดโปรแกรม
                </button>
              </div>
            </div>
          )}

          {/* Status 5: Not Available (Up to date or Notice) */}
          {status === 'not-available' && (
            <div className="py-3 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mx-auto text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#181A18]">
                  {message ? 'ระบบอัปเดตโปรแกรม' : 'โปรแกรมเป็นเวอร์ชันล่าสุดแล้ว'}
                </h4>
                <p className="text-xs text-[#717672] mt-1 max-w-xs mx-auto">
                  {message || (
                    <>ปัจจุบันใช้งานเวอร์ชัน <span className="font-mono text-[#181A18] font-bold">v{currentVersion}</span> ไม่พบรายการอัปเดตใหม่</>
                  )}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCheckAgain}
                  className="px-4 py-2 bg-white hover:bg-[#F7F6F2] text-[#181A18] rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 border border-[#EAE7E1] shadow-2xs cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#717672]" />
                  <span>ตรวจสอบอีกครั้ง</span>
                </button>
              </div>
            </div>
          )}

          {/* Status 6: Error */}
          {status === 'error' && (
            <div className="py-3 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center mx-auto text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#181A18]">เกิดข้อผิดพลาดในการตรวจหาอัปเดต</h4>
                <p className="text-xs text-rose-600 mt-1 max-w-xs mx-auto truncate font-mono">
                  {message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ GitHub ได้'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCheckAgain}
                  className="px-4 py-2 bg-white hover:bg-[#F7F6F2] text-[#181A18] rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 border border-[#EAE7E1] shadow-2xs cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#717672]" />
                  <span>ลองใหม่อีกครั้ง</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}