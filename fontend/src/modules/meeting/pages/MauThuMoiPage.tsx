import React, { useState, useEffect } from 'react';
import { defaultTemplate } from '../components/mau-thu-moi/template.data';
import { TemplateList } from '../components/mau-thu-moi/TemplateList';
import { TemplateEditor } from '../components/mau-thu-moi/TemplateEditor';
import { templateApi } from '../services/template.api';
import { toast } from '@/lib/toast';

export default function MauThuMoiPage() {
  const [showList, setShowList] = useState(true);
  const [templateData, setTemplateData] = useState({ ...defaultTemplate });
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await templateApi.list();
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        toast.error(response.message || 'Không thể tải danh sách mẫu');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (row?: any) => {
    if (row) {
      try {
        const data = JSON.parse(row.contentJson);
        setTemplateData({
          ...defaultTemplate,
          ...data,
          id: row.id,
          tenMau: row.name,
          maMau: row.code
        });
      } catch (e) {
        setTemplateData({ 
          ...defaultTemplate, 
          id: row.id,
          tenMau: row.name, 
          maMau: row.code 
        });
      }
    } else {
      setTemplateData({ ...defaultTemplate });
    }
    setShowList(false);
  };

  const handleBack = (shouldRefresh?: boolean) => {
    setShowList(true);
    if (shouldRefresh) {
      fetchTemplates();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await templateApi.delete(id);
      if (response.success) {
        toast.success('Xóa mẫu thư mời thành công');
        fetchTemplates();
      } else {
        toast.error(response.message || 'Không thể xóa mẫu thư mời');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  if (showList) {
    return (
      <TemplateList 
        templates={templates} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
      />
    );
  }

  return (
    <TemplateEditor 
      templateData={templateData} 
      setTemplateData={setTemplateData} 
      onBack={handleBack} 
    />
  );
}
