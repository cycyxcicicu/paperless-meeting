import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { MultiSelect, MultiSelectOption } from "@/common/components/ui/multi-select"
import { cn } from '@/common/utils/cn'

export interface FormMultiSelectProps {
  name: string
  label?: string
  options: MultiSelectOption[]
  placeholder?: string
  description?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export const FormMultiSelect = ({
  name,
  label,
  options,
  placeholder,
  description,
  required,
  className,
  disabled
}: FormMultiSelectProps) => {
  const { control, formState: { errors } } = useFormContext()
  const errorMsg = errors[name]?.message as string | undefined

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label với dấu sao bắt buộc */}
      {label && (
        <label className="block text-sm body text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <MultiSelect
            options={options}
            values={field.value || []}
            onChange={field.onChange}
            placeholder={placeholder}
            disabled={disabled}
            error={!!errorMsg}
          />
        )}
      />

      {description && !errorMsg && (
        <p className="text-[0.8rem] text-gray-500">{description}</p>
      )}
      {errorMsg && (
        <p className="text-[0.8rem] body text-red-500">{errorMsg}</p>
      )}
    </div>
  )
}
