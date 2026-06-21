import React, { useState, useRef } from 'react';
import { ArrowLeft, Code, FileDown, Printer, RefreshCw, Save, X } from 'lucide-react';
import { compileTemplate, defaultTemplate, mockPreviewData, TemplateField, variablesList } from './template.data';
import { RichTextEditor } from '../RichTextEditor';
import { templateApi } from '../../services/template.api';
import { toast } from '@/lib/toast';

interface TemplateEditorProps {
  templateData: any;
  setTemplateData: React.Dispatch<React.SetStateAction<any>>;
  onBack: (shouldRefresh?: boolean) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ templateData, setTemplateData, onBack }) => {
  const [focusedField, setFocusedField] = useState<TemplateField>("noiDung");
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const richTextEditorRef = useRef<any>(null);

  const handleReset = () => {
    setTemplateData({ ...defaultTemplate });
  };

  const handleSave = async () => {
    if (!templateData.tenMau || !templateData.tenMau.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập tên mẫu');
      return;
    }
    if (!templateData.maMau || !templateData.maMau.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập mã mẫu');
      return;
    }

    setSaving(true);
    try {
      const contentJson = JSON.stringify(templateData);
      const payload = {
        name: templateData.tenMau,
        code: templateData.maMau,
        contentJson,
        templateType: 'INVITATION' as const,
        status: 'ACTIVE' as const
      };

      let response;
      if (templateData.id) {
        response = await templateApi.update(templateData.id, payload);
      } else {
        response = await templateApi.create(payload);
      }

      if (response.success) {
        toast.success(templateData.id ? 'Cập nhật mẫu thành công' : 'Tạo mẫu thành công');
        onBack(true);
      } else {
        toast.error(response.message || 'Lưu mẫu thất bại');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi lưu mẫu');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    toast.info('Đang xử lý...', 'Hệ thống đang sinh file PDF từ mẫu thư mời');
    try {
      const blob = await templateApi.exportPdf(templateData, mockPreviewData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateData.maMau || 'invitation'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Thành công', 'Tải file PDF thành công');
    } catch (e: any) {
      toast.error('Lỗi xuất PDF', e.message || 'Không thể tạo file PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = () => {
    alert("Đây là tính năng Demo: Giả lập tải xuống file Word (.docx) thành công!");
  };

  const handleInsertVariable = (varKey: string) => {
    const field = focusedField;
    const placeholder = `{{${varKey}}}`;
    
    if (field === 'noiDung' && richTextEditorRef.current) {
      richTextEditorRef.current.insertText(placeholder);
      return;
    }

    // Fallback for regular input/textarea fields
    setTemplateData((prev: any) => {
      let currentVal = String(prev[field] || '');
      const inputEl = inputRefs.current[field];
      if (inputEl) {
        const start = inputEl.selectionStart || 0;
        const end = inputEl.selectionEnd || 0;
        const newVal = currentVal.substring(0, start) + placeholder + currentVal.substring(end);
        
        // Restore cursor position after state update
        setTimeout(() => {
          inputEl.focus();
          const newPos = start + placeholder.length;
          inputEl.setSelectionRange(newPos, newPos);
        }, 0);

        return {
          ...prev,
          [field]: newVal
        } as typeof defaultTemplate;
      }

      // If no input ref, fallback to append
      currentVal = currentVal + (currentVal && !currentVal.endsWith(' ') ? ' ' : '') + placeholder;
      return {
        ...prev,
        [field]: currentVal
      } as typeof defaultTemplate;
    });
  };

  const getPaperStyle = (khoGiay?: string) => {
    switch(khoGiay) {
      case 'A6': return { width: '148mm', minHeight: '105mm', padding: '10mm 10mm' };
      case 'A4':
      default: return { width: '210mm', minHeight: '297mm', padding: '20mm 20mm' };
    }
  };

  return (
    <div className="template-editor-global-times h-[calc(100vh-64px)] flex flex-col bg-gray-50 print:h-auto print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          /* Hide parent app containers like Sidebar/Topbar if they exist */
          .fixed, header, nav, aside { display: none !important; }
        }
        
        .template-editor-global-times,
        .template-editor-global-times * {
          font-family: 'Times New Roman', Times, serif !important;
        }
      `}</style>
      
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onBack()}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg btn-primary text-gray-900">Thiết kế mẫu thư mời</h1>
            <p className="text-xs text-gray-500">Bấm vào các biến để tự động chèn vào nội dung</p>
          </div>
        </div>
        <div className="flex items-center gap-2">

          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Reset mẫu
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#C8102E] text-white px-4 py-1.5 rounded-lg text-sm btn-primary hover:bg-[#A90F14] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu mẫu'}
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Form Builder */}
        <div className="w-1/2 flex flex-col bg-white border-r border-gray-200 shadow-xl z-10 relative print:hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs heading text-gray-500 uppercase mb-2">Danh sách biến (Bấm để chèn)</h3>
            <div className="flex flex-wrap gap-1.5">
              {variablesList.map(v => (
                <button 
                  key={v.key}
                  onMouseDown={e => {
                    e.preventDefault();
                    handleInsertVariable(v.key);
                  }}
                  className="text-[10px] btn-primary bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-md hover:border-[#C8102E] hover:text-[#C8102E] shadow-sm transition-colors"
                >
                  [{v.label}]
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tên mẫu</label>
                <input 
                  value={templateData.tenMau}
                  onChange={e => setTemplateData({...templateData, tenMau: e.target.value})}
                  onFocus={() => setFocusedField('tenMau')}
                  ref={el => { inputRefs.current['tenMau'] = el; }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Mã mẫu</label>
                <input 
                  value={templateData.maMau}
                  onChange={e => setTemplateData({...templateData, maMau: e.target.value})}
                  onFocus={() => setFocusedField('maMau')}
                  ref={el => { inputRefs.current['maMau'] = el; }}
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Header Trái</label>
                <textarea 
                  value={templateData.headerTrai}
                  onChange={e => setTemplateData({...templateData, headerTrai: e.target.value})}
                  onFocus={() => setFocusedField('headerTrai')}
                  ref={el => { inputRefs.current['headerTrai'] = el; }}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Header Phải</label>
                <textarea 
                  value={templateData.headerPhai}
                  onChange={e => setTemplateData({...templateData, headerPhai: e.target.value})}
                  onFocus={() => setFocusedField('headerPhai')}
                  ref={el => { inputRefs.current['headerPhai'] = el; }}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Ngày tháng, địa danh</label>
              <input 
                value={templateData.ngayThang}
                onChange={e => setTemplateData({...templateData, ngayThang: e.target.value})}
                onFocus={() => setFocusedField('ngayThang')}
                ref={el => { inputRefs.current['ngayThang'] = el; }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Tiêu đề (VD: THƯ MỜI)</label>
              <input 
                value={templateData.tieuDe}
                onChange={e => setTemplateData({...templateData, tieuDe: e.target.value})}
                onFocus={() => setFocusedField('tieuDe')}
                ref={el => { inputRefs.current['tieuDe'] = el; }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none uppercase font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">{"Trích yếu nội dung (VD: Về việc: Tham dự cuộc họp {{meetingName}})"}</label>
              <input 
                value={templateData.trichYeu || ""}
                onChange={e => setTemplateData({...templateData, trichYeu: e.target.value})}
                onFocus={() => setFocusedField('trichYeu' as any)}
                ref={el => { inputRefs.current['trichYeu'] = el; }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Nội dung chính</label>
              <div onClick={() => setFocusedField('noiDung')} className="relative">
                <RichTextEditor 
                  ref={richTextEditorRef}
                  value={templateData.noiDung}
                  onChange={v => setTemplateData({...templateData, noiDung: v})}
                  minHeight="200px"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Chữ ký (Bên phải)</label>
              <textarea 
                value={templateData.chuKy}
                onChange={e => setTemplateData({...templateData, chuKy: e.target.value})}
                onFocus={() => setFocusedField('chuKy')}
                ref={el => { inputRefs.current['chuKy'] = el; }}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#C8102E] outline-none resize-none text-center"
              />
            </div>
            
            <div className="h-8" />
          </div>
        </div>

        {/* Right Column: Live A4 Preview */}
        <div className="w-1/2 overflow-y-auto bg-gray-100 p-8 custom-scrollbar print:w-full print:bg-white print:p-0 print:overflow-visible">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="text-sm btn-primary text-gray-500">Xem trước văn bản (Live Preview)</h2>
            <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-md btn-primary">
              Auto-updating
            </div>
          </div>
          
          <style>{`
            .preview-times-new-roman, 
            .preview-times-new-roman *,
            .preview-times-new-roman .ql-editor,
            .preview-times-new-roman .ql-editor * {
              font-family: 'Times New Roman', Times, serif !important;
            }
          `}</style>
          <div className="preview-times-new-roman bg-white shadow-xl mx-auto rounded-sm overflow-hidden text-black transition-all print:shadow-none print:m-0" 
               style={{ boxSizing: 'border-box', ...getPaperStyle(templateData.khoGiay) }}>
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-1/2 text-center text-sm leading-tight">
                {compileTemplate(templateData.headerTrai).split('\n').map((line, idx, arr) => {
                  const isLast = idx === arr.length - 1 && arr.length > 1;
                  return (
                    <div key={idx} className={isLast ? "font-normal" : "font-semibold"}>
                      {line}
                    </div>
                  );
                })}
              </div>
              <div className="w-1/2 text-center">
                <div className="text-sm font-bold whitespace-pre-wrap leading-tight">{compileTemplate(templateData.headerPhai)}</div>
              </div>
            </div>

            <div className="text-right italic text-[13px] mb-8 pr-12">
              {compileTemplate(templateData.ngayThang)}
            </div>

            <div className="text-center mb-8">
              <h1 className="text-xl font-bold uppercase">{compileTemplate(templateData.tieuDe)}</h1>
              {templateData.trichYeu && (
                <div className="text-[15px] font-normal mt-1 text-gray-800">{compileTemplate(templateData.trichYeu)}</div>
              )}
            </div>

            <div 
              className="text-[14px] mb-8 leading-relaxed text-justify ql-editor px-0 py-0" 
              dangerouslySetInnerHTML={{ __html: compileTemplate(templateData.noiDung) }}
            />

            <div className="flex justify-between mt-12">
              <div className="w-1/2" />
              <div className="w-1/2 text-center">
                <div className="text-[14px] font-bold uppercase whitespace-pre-wrap mb-[80px]">
                  {compileTemplate(templateData.chuKy.split('\n\n\n\n')[0] || '')}
                </div>
                <div className="text-[14px] font-bold whitespace-pre-wrap">
                  {compileTemplate(templateData.chuKy.split('\n\n\n\n')[1] || '')}
                </div>
              </div>
            </div>
          </div>
          <div className="h-12" />
        </div>
      </div>

      {showJsonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg btn-primary text-gray-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-500" />
                Cấu trúc JSON Mẫu thư mời
              </h3>
              <button onClick={() => setShowJsonModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-[#1E1E1E]">
              <pre className="text-[13px] text-green-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(templateData, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button onClick={() => setShowJsonModal(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 btn-primary rounded-xl transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
