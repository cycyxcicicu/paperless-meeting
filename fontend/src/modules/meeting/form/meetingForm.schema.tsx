import { FormFieldGroup } from "@/common/components/form-engine/form.types";

export const createChiTietHopFormSchema = (phongHopOptions: { value: string; label: string }[]): FormFieldGroup[] => [
  {
    id: 'basic-info',
    fields: [
      {
        key: 'tenPhienHop',
        type: 'textarea',
        label: 'Tên phiên họp',
        required: true,
        placeholder: 'Nhập tên phiên họp...',
        col: 'col-span-2',
      },
      {
        key: 'thoiGianBatDau',
        type: 'date',
        label: 'Thời gian bắt đầu',
        required: true,
        showTime: true,
      },
      {
        key: 'thoiGianKetThuc',
        type: 'date',
        label: 'Thời gian kết thúc',
        required: true,
        showTime: true,
      },
      {
        key: 'diaDiem',
        type: 'select',
        label: 'Địa điểm',
        required: true,
        options: phongHopOptions,
      },
      {
        key: 'linkHopTrucTuyen',
        type: 'text',
        label: 'Link họp trực tuyến',
        placeholder: 'https://...',
      },
      {
        key: 'soPhutDenMuon',
        type: 'number',
        label: 'Số phút được đến muộn',
        min: 0,
      },
    ],
  },
];

export const createThongBaoGiayMoiFormSchema = (templateOptions: { value: string; label: string }[]): FormFieldGroup[] => [
  {
    id: 'notification',
    fields: [
      {
        key: 'mauGiayMoi',
        type: 'select',
        label: 'Mẫu giấy mời',
        required: true,
        options: templateOptions,
        col: 'col-span-2',
      },
      {
        key: 'noiDung',
        type: 'textarea',
        label: 'Nội dung',
        required: true,
        col: 'col-span-2',
        rows: 5,
      },
    ],
  },
];
