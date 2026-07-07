export type FormMode = 'create' | 'update' | 'view' | 'information';

export type FieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'upload-file'
  | 'date'
  | 'async-select'
  | 'checkbox'
  | 'toggle';

export interface FieldOption {
  value: string | number;
  label: string;
}

export interface AsyncOptionLoaderParams {
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

export interface AsyncOptionLoaderResult {
  options: FieldOption[];
  hasMore: boolean;
  total?: number;
}

export type DynamicProp<T> = T | ((ctx: { values: any; mode: FormMode; field: FormFieldConfig }) => T);

export interface FormFieldConfig {
  key: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  showPlaceholder?: boolean; // undefined/true = tự sinh placeholder, false = ẩn placeholder
  disableFutureDates?: boolean;
  disablePastDates?: boolean;
  showTime?: boolean;
  
  // Validation & Rules
  required?: DynamicProp<boolean>;
  showRequiredStar?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  errorMessages?: Record<string, string>;
  customValidators?: Array<(value: any, values: any) => string | undefined>;
  
  // States
  hidden?: DynamicProp<boolean>;
  disabled?: DynamicProp<boolean>;
  
  // Layout
  col?: string; // Tailwind col classes like "col-span-1", "md:col-span-2"
  className?: string;
  offset?: string;
  breakAfter?: boolean;

  // Specific to select / options
  options?: FieldOption[];
  multiple?: boolean;
  clearable?: boolean;
  
  // Specific to async-select
  displayField?: string;
  valueField?: string;
  pageSize?: number;
  loadOptions?: (params: AsyncOptionLoaderParams) => Promise<AsyncOptionLoaderResult>;
  
  // Specific to upload
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedFileKinds?: string[];
  
  // Custom Render cho phép màn hình tự ghi đè UI nếu cần
  render?: (context: {
    field: FormFieldConfig;
    values: any;
    mode: FormMode;
    disabled: boolean;
    required: boolean;
    error?: string;
  }) => React.ReactNode;
  
  // Specific to textarea
  rows?: number;
  
  // Others
  helperText?: string;
  uppercase?: boolean; // Tự động đổi hoa khi nhập
  allowedChars?: 'alphanumeric' | 'letters' | 'no-special' | 'number-only'; // Chặn kí tự ngay khi gõ
}

export interface FormFieldGroup {
  id: string;
  title?: string;
  description?: string;
  className?: string; // Layout for the group (e.g., grid cols)
  fields: FormFieldConfig[];
}
