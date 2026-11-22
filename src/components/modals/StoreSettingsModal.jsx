import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Store,
  Upload,
  Camera,
  Save,
  CheckCircle2,
  FileText,
  Building2,
  Sparkles
} from 'lucide-react';

export default function StoreSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  showAlert
}) {
  const [form, setForm] = useState({
    store_name: 'Pouch',
    store_subtitle: 'ระบบแคชเชียร์ & คลังสต็อก',
    tax_id: '0105566012345'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('/logo.png');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings) {
      setForm({
        store_name: settings.store_name || 'Pouch',
        store_subtitle: settings.store_subtitle || 'ระบบแคชเชียร์ & คลังสต็อก',
        tax_id: settings.tax_id || '0105566012345'
      });
      setLogoPreview(settings.logo_url || '/logo.png');
      setLogoFile(null);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.store_name.trim()) {
      if (showAlert) showAlert('กรุณากรอกชื่อร้านค้า', 'warning');
      else alert('กรุณากรอกชื่อร้านค้า');
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append('store_name', form.store_name.trim());
    formData.append('store_subtitle', form.store_subtitle.trim());
    formData.append('tax_id', form.tax_id.trim());
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      await onSaveSettings(formData);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 700);
    } catch (err) {
      if (showAlert) showAlert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message, 'error');
      else alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none font-['Prompt',sans-serif] animate-fadeIn">
      <div className="bg-white border border-[#EAE7E1] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE7E1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F7F6F2] border border-[#EAE7E1] flex items-center justify-center text-[#181A18]">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#181A18]">ตั้งค่าข้อมูลร้านค้า &amp; แบรนด์</h3>
              <p className="text-[11px] text-[#717672]">กำหนดชื่อร้าน, โลโก้ และเลขผู้เสียภาษีสำหรับแสดงบนระบบและใบเสร็จ</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Logo Upload & Live Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#F7F6F2] rounded-2xl border border-[#EAE7E1]">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#EAE7E1] bg-white shadow-2xs p-0.5 flex items-center justify-center group-hover:border-[#181A18] transition-colors">
                <img
                  src={logoPreview}
                  alt="Store Logo Preview"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/logo.png';
                  }}
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] transition-opacity">
                <Camera className="w-4 h-4 mb-0.5" />
                <span>เปลี่ยนรูป</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-semibold text-xs text-[#181A18]">โลโก้ร้านค้า (Store Logo)</h4>
              <p className="text-[11px] text-[#717672] mt-0.5">
                รองรับไฟล์ PNG, JPG หรือ WebP (แนะนำรูปทรงสี่เหลี่ยมจัตุรัสหรือวงกลม)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#181A18] rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 border border-[#EAE7E1] shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#717672]" />
                <span>อัปโหลดรูปภาพใหม่</span>
              </button>
            </div>
          </div>

          {/* 2. Store Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#181A18] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ชื่อร้านค้า (Store Name) *</span>
            </label>
            <input
              type="text"
              required
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              placeholder="ระบุชื่อร้านค้าของคุณ (เช่น Pouch, ร้านสุขใจ)"
              className="w-full px-3.5 py-2.5 bg-[#F7F6F2] border border-[#EAE7E1] rounded-xl text-xs text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18] font-medium"
            />
          </div>

          {/* 3. Store Subtitle / Slogan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#181A18] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>คำบรรยาย / สโลแกนร้านค้า (Subtitle)</span>
            </label>
            <input
              type="text"
              value={form.store_subtitle}
              onChange={(e) => setForm({ ...form, store_subtitle: e.target.value })}
              placeholder="เช่น ระบบแคชเชียร์ & คลังสต็อก, มินิมาร์ทบริการ 24 ชม."
              className="w-full px-3.5 py-2.5 bg-[#F7F6F2] border border-[#EAE7E1] rounded-xl text-xs text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18]"
            />
          </div>

          {/* 4. Tax ID (เลขประจำตัวผู้เสียภาษี) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#181A18] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>เลขประจำตัวผู้เสียภาษี 13 หลัก (Tax ID สำหรับใบเสร็จ)</span>
            </label>
            <input
              type="text"
              maxLength={20}
              value={form.tax_id}
              onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              placeholder="เช่น 0105566012345 หรือเลขบัตรประชาชน 13 หลัก"
              className="w-full px-3.5 py-2.5 bg-[#F7F6F2] border border-[#EAE7E1] rounded-xl text-xs text-[#181A18] placeholder:text-[#8C948E] focus:outline-none focus:ring-2 focus:ring-[#181A18]/20 focus:border-[#181A18] font-mono"
            />
            <p className="text-[10px] text-[#717672]">
              ข้อมูลนี้จะถูกนำไปพิมพ์ลงบนสลิปใบเสร็จและใบกำกับภาษีอย่างย่อ (ABB)
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#EAE7E1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-white hover:bg-[#F7F6F2] text-[#717672] hover:text-[#181A18] rounded-xl text-xs font-medium transition-colors border border-[#EAE7E1] cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#181A18] hover:bg-[#2C302D] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {successToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}