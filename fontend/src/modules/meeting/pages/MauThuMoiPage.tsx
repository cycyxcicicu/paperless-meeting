import React, { useState } from 'react';
import { defaultTemplate } from '../components/mau-thu-moi/template.data';
import { TemplateList } from '../components/mau-thu-moi/TemplateList';
import { TemplateEditor } from '../components/mau-thu-moi/TemplateEditor';

export default function MauThuMoiPage() {
  const [showList, setShowList] = useState(true);
  const [templateData, setTemplateData] = useState({ ...defaultTemplate });
  const [templates, setTemplates] = useState([
    { id: 1, name: "Thư mời họp hội đồng", code: "THU_MOI_HOP_HOI_DONG", desc: "Dùng cho các cuộc họp xét duyệt, đánh giá hội đồng." },
    { id: 2, name: "Thư mời họp giao ban", code: "THU_MOI_GIAO_BAN", desc: "Dùng cho giao ban định kỳ hàng tuần/tháng." },
    { id: 3, name: "Thư mời họp chuyên đề", code: "THU_MOI_CHUYEN_DE", desc: "Dùng cho các cuộc họp chuyên đề đột xuất." },
  ]);

  const handleEdit = (row?: any) => {
    setTemplateData({ 
      ...defaultTemplate, 
      tenMau: row?.name || defaultTemplate.tenMau, 
      maMau: row?.code || defaultTemplate.maMau 
    });
    setShowList(false);
  };

  const handleBack = () => {
    setShowList(true);
  };

  if (showList) {
    return (
      <TemplateList 
        templates={templates} 
        setTemplates={setTemplates} 
        onEdit={handleEdit} 
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
