import * as React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from '@/common/utils/cn'
import { Button } from '@/common/components/ui/button'
import { ScrollDatePicker } from '@/common/components/ui/scroll-date-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/common/components/ui/popover'
import { Label } from '@/common/components/ui/label'

export interface FormDatePickerProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  disableFutureDates?: boolean
  disablePastDates?: boolean
  showTime?: boolean
}

export const FormDatePicker = ({
  name,
  label,
  description,
  required,
  placeholder = "Chọn ngày",
  className,
  disabled,
  disableFutureDates,
  disablePastDates,
  showTime,
}: FormDatePickerProps) => {
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left caption border-gray-300",
                  !field.value && "text-gray-500",
                  errorMsg && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? (
                  format(new Date(field.value), showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <ScrollDatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date.toISOString())}
                disableFutureDates={disableFutureDates}
                disablePastDates={disablePastDates}
                showTime={showTime}
              />
            </PopoverContent>
          </Popover>
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
