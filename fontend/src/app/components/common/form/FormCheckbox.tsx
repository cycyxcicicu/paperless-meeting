import * as React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Checkbox } from "../ui/Checkbox"
import { Label } from "../ui/Typography/Label"
import { cn } from "@/lib/utils"

export interface FormCheckboxProps {
  name: string
  label: string
  description?: string
  className?: string
  disabled?: boolean
}

export const FormCheckbox = ({
  name,
  label,
  description,
  className,
  disabled
}: FormCheckboxProps) => {
  const { control, formState: { errors } } = useFormContext()
  const errorMsg = errors[name]?.message as string | undefined

  return (
    <div className={cn("items-top flex space-x-2", className)}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Checkbox
            id={name}
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
            className={cn(errorMsg && "border-red-500")}
          />
        )}
      />
      <div className="grid gap-1.5 leading-none">
        <Label
          htmlFor={name}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            errorMsg && "text-red-500"
          )}
        >
          {label}
        </Label>
        {description && !errorMsg && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        {errorMsg && (
          <p className="text-sm font-medium text-red-500">{errorMsg}</p>
        )}
      </div>
    </div>
  )
}
