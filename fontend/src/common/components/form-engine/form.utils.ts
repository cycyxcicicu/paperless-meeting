import { DynamicProp, FormFieldConfig, FormMode } from './form.types';

export const evaluateDynamicValue = <T>(
  prop: DynamicProp<T> | undefined,
  context: { values: any; mode: FormMode; field: FormFieldConfig },
  defaultValue: T
): T => {
  if (prop === undefined) return defaultValue;
  if (typeof prop === 'function') {
    return (prop as Function)(context);
  }
  return prop;
};

export const isFieldHidden = (field: FormFieldConfig, context: { values: any; mode: FormMode; field: FormFieldConfig }) => {
  return evaluateDynamicValue(field.hidden, context, false);
};

export const isFieldDisabled = (field: FormFieldConfig, context: { values: any; mode: FormMode; field: FormFieldConfig }) => {
  return evaluateDynamicValue(field.disabled, context, false);
};

export const isFieldRequired = (field: FormFieldConfig, context: { values: any; mode: FormMode; field: FormFieldConfig }) => {
  return evaluateDynamicValue(field.required, context, false);
};

export const trimFormValues = (values: any): any => {
  if (typeof values === 'string') {
    return values.trim();
  }
  if (Array.isArray(values)) {
    return values.map(trimFormValues);
  }
  if (values !== null && typeof values === 'object') {
    const trimmedObject: any = {};
    for (const key in values) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        trimmedObject[key] = trimFormValues(values[key]);
      }
    }
    return trimmedObject;
  }
  return values;
};

export const getFieldRules = (field: FormFieldConfig, context: { values: any; mode: FormMode; field: FormFieldConfig }) => {
  const isReq = isFieldRequired(field, context);
  const rules: any = {};
  
  if (isReq) {
    rules.required = field.errorMessages?.required || 'Vui lòng nhập trường này';
  }
  if (field.minLength !== undefined) {
    rules.minLength = { value: field.minLength, message: field.errorMessages?.minLength || `Độ dài tối thiểu là ${field.minLength} ký tự` };
  }
  if (field.maxLength !== undefined) {
    rules.maxLength = { value: field.maxLength, message: field.errorMessages?.maxLength || `Độ dài tối đa là ${field.maxLength} ký tự` };
  }
  if (field.min !== undefined) {
    rules.min = { value: field.min, message: field.errorMessages?.min || `Giá trị tối thiểu là ${field.min}` };
  }
  if (field.max !== undefined) {
    rules.max = { value: field.max, message: field.errorMessages?.max || `Giá trị tối đa là ${field.max}` };
  }
  if (field.pattern) {
    rules.pattern = { value: field.pattern, message: field.errorMessages?.pattern || 'Định dạng không hợp lệ' };
  }
  if (field.email) {
    rules.pattern = { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: field.errorMessages?.email || 'Email không đúng định dạng' };
  }
  
  // Note: customValidators would need to be handled via the 'validate' rule in RHF
  if (field.customValidators && field.customValidators.length > 0) {
    rules.validate = (value: any) => {
      for (const validator of field.customValidators!) {
        const error = validator(value, context.values);
        if (error) return error;
      }
      return true;
    };
  }
  
  return rules;
};
