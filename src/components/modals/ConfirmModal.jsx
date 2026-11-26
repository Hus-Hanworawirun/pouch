import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'ยืนยันการทำรายการ',
  message = '',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger', // 'danger' | 'primary'
  storeSettings = null
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const storeName = storeSettings?.store_name || 'Pouch';
  const storeLogo = storeSettings?.logo_url || '/logo.png';
  const storeSubtitle = storeSettings?.store_subtitle || 'ระบบแคชเชียร์ & คลังสต็อก';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none font-['Prompt',sans-serif] animate-fadeIn">
      <div className="bg-white border border-[#EAE7E1] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        {/* Brand Header */}
        <div className="px-5 py-3.5 border-b border-[#EAE7E1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#EAE7E1] bg-[#F7F6F2]">
              <img
                src={storeLogo}
                alt={storeName}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#181A18] leading-tight">{storeName}</h3>
              <p className="text-[10px] text-[#717672] leading-none">{storeSubtitle}</p>
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

        {/* Body */}
        <div className="p-6 text-center space-y-3.5">
          <div className={`w-12 h-12 rounded-full ${variant === 'danger' ? 'bg-rose-50 border-rose-200/60 text-rose-600' : 'bg-amber-50 border-amber-200/60 text-amber-600'} border flex items-center justify-center mx-auto`}>
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#181A18]">{title}</h4>
            <p className="text-xs text-[#717672] leading-relaxed max-w-xs mx-auto break-words whitespace-pre-line">
              {message}
            </p>
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white hover:bg-[#F7F6F2] text-[#717672] hover:text-[#181A18] rounded-xl text-xs font-semibold transition-colors border border-[#EAE7E1] cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#181A18] hover:bg-[#2C302D]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
