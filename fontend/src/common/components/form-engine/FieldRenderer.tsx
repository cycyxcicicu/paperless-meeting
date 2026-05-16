import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormMode, FormFieldConfig } from './form.types';
import { isFieldDisabled, isFieldRequired, getFieldRules } from './form.utils';
import { FormInput } from '../form/FormInput';
import { FormSelect } from '../form/FormSelect';
import { FormMultiSelect } from '../form/FormMultiSelect';
import { FormDatePicker } from '../form/FormDatePicker';

interface FieldRendererProps {
  field: FormFieldConfig;
  mode: FormMode;
  values: any;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, mode, values }) => {
  const context = { values, mode, field };
  const disabled = isFieldDisabled(field, context);
  const required = isFieldRequired(field, context);
  const { register, formState: { errors } } = useFormContext();

  // Tự động sinh placeholder nếu không truyền và showPlaceholder !== false
  const getAutoPlaceholder = (): string | undefined => {
    // showPlaceholder === false → ẩn hẳn, bất kể có truyền placeholder cứng hay không
    if (field.showPlaceholder === false) return undefined;
    // Nếu đã truyền placeholder cụ thể, ưu tiên dùng nó
    if (field.placeholder) return field.placeholder;
    // Mặc định (showPlaceholder undefined hoặc true): tự sinh từ label
    if (!field.label) return undefined;
    switch (field.type) {
      case 'text':
      case 'password':
      case 'email':
      case 'phone':
      case 'number':
      case 'textarea':
        return `Nhập ${field.label.toLowerCase()}`;
      case 'select':
        return `Chọn ${field.label.toLowerCase()}`;
      default:
        return undefined;
    }
  };

  const autoPlaceholder = getAutoPlaceholder();

  const commonProps = {
    name: field.key,
    label: field.label,
    placeholder: autoPlaceholder,
    disabled: disabled || mode === 'view',
    required: required,
    className: field.className,
    description: field.helperText,
    rules: getFieldRules(field, context),
  };

  // Nếu field có tự định nghĩa cách render (Custom Component)
  if (field.render) {
    return <>{field.render({ field, values, mode, disabled, required, error: errors[field.key]?.message as string })}</>;
  }

  switch (field.type) {
    case 'text':
    case 'password':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <FormInput
          {...commonProps}
          type={field.type === 'phone' ? 'tel' : field.type}
          autoComplete={field.type === 'password' ? 'new-password' : 'off'}
          uppercase={field.uppercase}
          allowedChars={field.allowedChars}
        />
      );
    
    case 'select':
      if (field.multiple) {
        return (
          <FormMultiSelect
            {...commonProps}
            options={(field.options || []).map(o => ({ value: String(o.value), label: o.label }))}
          />
        );
      }
      return (
        <FormSelect
          {...commonProps}
          options={(field.options || []).map(o => ({ value: String(o.value), label: o.label }))}
        />
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          {field.label && (
            <label htmlFor={field.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {field.label} {required && <span className="text-red-500">*</span>}
            </label>
          )}
          <textarea
            {...register(field.key, commonProps.rules)}
            id={field.key}
            placeholder={field.placeholder}
            disabled={commonProps.disabled}
            rows={field.rows || 4}
            className="flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-400 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          {errors[field.key]?.message && (
            <p className="text-[0.8rem] body text-red-500">{errors[field.key]?.message as string}</p>
          )}
        </div>
      );

    case 'date':
      return (
        <FormDatePicker
          name={field.key}
          label={field.label}
          description={field.helperText}
          required={required}
          placeholder={autoPlaceholder}
          disabled={commonProps.disabled}
          disableFutureDates={field.disableFutureDates}
          showTime={field.showTime}
        />
      );

    // Fallback for custom or unimplemented fields
    default:
      return (
        <div className="p-3 border border-dashed border-red-300 bg-red-50 rounded-xl text-red-500 text-xs">
          Component for type <b>{(field as any).type}</b> is not yet implemented.
        </div>
      );
  }
};
