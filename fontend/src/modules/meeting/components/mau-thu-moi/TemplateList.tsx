import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { DataTable, DataToolbar } from '@/common/components/table-engine';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { defaultTemplate, compileTemplate } from './template.data';

interface TemplateListProps {
  templates: any[];
  setTemplates?: (templates: any[]) => void;
  onEdit: (row?: any) => void;
  onDelete?: (id: string) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({ templates, setTemplates, onEdit, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const filteredTemplates = templates.filter(t => 
    (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePreview = (row: any) => {
    try {
      const data = JSON.parse(row.contentJson);
      setPreviewTemplate({
        ...defaultTemplate,
        ...data,
        tenMau: row.name,
        maMau: row.code
      });
    } catch (e) {
      setPreviewTemplate({
        ...defaultTemplate,
        tenMau: row.name,
        maMau: row.code
      });
    }
  };

  const getPaperStyle = (khoGiay?: string) => {
    switch(khoGiay) {
      case 'A6': return { width: '148mm', minHeight: '105mm', padding: '10mm 10mm' };
      case 'A4':
      default: return { width: '210mm', minHeight: '297mm', padding: '20mm 20mm' };
    }
  };

  const handleDelete = (row: any) => {
    if (confirm(`Bạn có chắc chắn muốn xóa mẫu: ${row.name}?`)) {
      if (onDelete) {
        onDelete(row.id);
      } else if (setTemplates) {
        setTemplates(templates.filter(t => t.id !== row.id));
      }
    }
  };

  const tableConfig = {
    columns: [
      { 
        key: 'code', 
        header: 'Mã mẫu', 
        width: '250px',
        render: (row: any) => <span className="text-[11px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 border border-gray-200">{row.code}</span>
      },
      { 
        key: 'name', 
        header: 'Tên mẫu',
        render: (row: any) => <span className="btn-primary text-gray-900">{row.name}</span>
      }
    ],
    rowActions: [
      {
        key: 'preview',
        label: 'Xem trước',
        icon: <Eye className="w-4 h-4" />,
        variant: 'primary' as const,
        onClick: (row: any) => handlePreview(row)
      },
      {
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <Edit className="w-4 h-4" />,
        onClick: (row: any) => onEdit(row)
      },
      {
        key: 'delete',
        label: 'Xóa',
        icon: <Trash2 className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: (row: any) => handleDelete(row)
      }
    ]
  };

  return (
    <div className="template-list-global-times flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
      <style>{`
        .template-list-global-times,
        .template-list-global-times * {
          font-family: 'Times New Roman', Times, serif !important;
        }
      `}</style>
      <div className="px-8 pt-8 pb-4 shrink-0">
        <PageHeader 
          breadcrumbs={[
            { name: 'Trang chủ', path: '/' },
            { name: 'Quản lý phiên họp', path: '/phien-hop' },
            { name: 'Mẫu thư mời' }
          ]}
        />
      </div>

      <div className="flex-1 px-8 pb-8 overflow-y-auto custom-scrollbar">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex flex-col h-full overflow-hidden">
          <DataToolbar 
            searchPlaceholder="Tìm kiếm theo mã, tên mẫu..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            primaryAction={{
              label: 'Thêm mới',
              icon: <Plus className="w-4 h-4" />,
              onClick: () => onEdit()
            }}
          />
          
          <div className="flex-1 overflow-auto">
            <DataTable 
              data={filteredTemplates}
              config={tableConfig}
            />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-100 rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
              <h3 className="text-lg btn-primary text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Xem trước mẫu: {previewTemplate.tenMau}
              </h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <style>{`
                .preview-times-new-roman, 
                .preview-times-new-roman *,
                .preview-times-new-roman .ql-editor,
                .preview-times-new-roman .ql-editor * {
                  font-family: 'Times New Roman', Times, serif !important;
                }
              `}</style>
              <div className="preview-times-new-roman bg-white shadow-xl mx-auto rounded-sm overflow-hidden text-black transition-all" 
                   style={{ boxSizing: 'border-box', ...getPaperStyle(previewTemplate.khoGiay) }}>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="w-1/2 text-center text-sm leading-tight">
                    {compileTemplate(previewTemplate.headerTrai).split('\n').map((line, idx, arr) => {
                      const isLast = idx === arr.length - 1 && arr.length > 1;
                      return (
                        <div key={idx} className={isLast ? "font-normal" : "font-semibold"}>
                          {line}
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-1/2 text-center">
                    <div className="text-sm font-bold whitespace-pre-wrap leading-tight">{compileTemplate(previewTemplate.headerPhai)}</div>
                  </div>
                </div>

                <div className="text-right italic text-[13px] mb-8 pr-12">
                  {compileTemplate(previewTemplate.ngayThang)}
                </div>

                <div className="text-center mb-8">
                  <h1 className="text-xl font-bold uppercase">{compileTemplate(previewTemplate.tieuDe)}</h1>
                  {previewTemplate.trichYeu && (
                    <div className="text-[15px] font-normal mt-1 text-gray-800">{compileTemplate(previewTemplate.trichYeu)}</div>
                  )}
                </div>

                <div 
                  className="text-[14px] mb-8 leading-relaxed text-justify ql-editor px-0 py-0" 
                  dangerouslySetInnerHTML={{ __html: compileTemplate(previewTemplate.noiDung) }}
                />

                <div className="flex justify-between mt-12">
                  <div className="w-1/2" />
                  <div className="w-1/2 text-center">
                    <div className="text-[14px] font-bold uppercase whitespace-pre-wrap mb-[80px]">
                      {compileTemplate(previewTemplate.chuKy.split('\n\n\n\n')[0] || '')}
                    </div>
                    <div className="text-[14px] font-bold whitespace-pre-wrap">
                      {compileTemplate(previewTemplate.chuKy.split('\n\n\n\n')[1] || '')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-12" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
