import React, { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';

export default function AlertModal({
  isOpen,
  onClose,
  type = 'warning', // 'warning' | 'error' | 'success' | 'info'
  title = '',
  message = '',
  detail = '',
  storeSettings = null
}) {
  const openedAtRef = useRef(0);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    openedAtRef.current = Date.now();
    // Move focus off buttons/inputs onto the modal container so trailing scanner Enter does not trigger click
    dialogRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
        // Ignore trailing scanner Enter/Space within 350ms of opening
        if (Date.now() - openedAtRef.current < 350) {
          e.preventDefault();
          return;
        }
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

  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200/60',
      defaultTitle: 'แจ้งเตือนจากระบบ'
    },
    error: {
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200/60',
      defaultTitle: 'เกิดข้อผิดพลาด'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200/60',
      defaultTitle: 'ดำเนินการสำเร็จ'
    },
    info: {
      icon: Info,
      color: 'text-[#181A18]',
      bg: 'bg-[#F7F6F2]',
      border: 'border-[#EAE7E1]',
      defaultTitle: 'ข้อความแจ้งเตือน'
    }
  };

  const config = typeConfig[type] || typeConfig.warning;
  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none font-['Prompt',sans-serif] animate-fadeIn">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white border border-[#EAE7E1] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-scaleUp outline-none"
      >
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

        {/* Modal Body */}
        <div className="p-6 text-center space-y-3.5">
          <div className={`w-12 h-12 rounded-full ${config.bg} border ${config.border} flex items-center justify-center mx-auto ${config.color}`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#181A18]">{displayTitle}</h4>
            <p className="text-xs text-[#717672] leading-relaxed max-w-xs mx-auto break-words whitespace-pre-line">
              {message}
            </p>
            {detail && (
              <p className="text-[11px] text-[#8C948E] font-mono mt-1 bg-[#F7F6F2] py-1 px-2.5 rounded-lg border border-[#EAE7E1] inline-block">
                {detail}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-[#181A18] hover:bg-[#2C302D] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
