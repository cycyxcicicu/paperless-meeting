import * as React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/common/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select"
import { cn } from '@/common/utils/cn'

export interface Option {
  label: string
  value: string
}

export interface FormSelectProps {
  name: string
  label?: string
  options: Option[]
  placeholder?: string
  description?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export const FormSelect = ({
  name,
  label,
  options,
  placeholder = "Chọn giá trị...",
  description,
  required,
  className,
  disabled
}: FormSelectProps) => {
  const { control, formState: { errors } } = useFormContext()
  const errorMsg = errors[name]?.message as string | undefined

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
            disabled={disabled}
          >
            <SelectTrigger
              id={name}
              className={cn(errorMsg && "border-red-500 focus:ring-red-500")}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
