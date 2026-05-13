import * as React from "react"
import { useFormContext } from "react-hook-form"
import { Input, InputProps } from "../ui/Input"
import { Label } from "../ui/Typography/Label"
import { cn } from "@/lib/utils"

export interface FormInputProps extends InputProps {
  name: string
  label?: string
  description?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, description, required, className, ...props }, ref) => {
    const { register, formState: { errors } } = useFormContext()
    const errorMsg = errors[name]?.message as string | undefined

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={name}>
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Input
          id={name}
          className={cn(errorMsg && "border-red-500 focus-visible:ring-red-500")}
          aria-invalid={!!errorMsg}
          {...register(name)}
          {...props}
        />
        {description && !errorMsg && (
          <p className="text-[0.8rem] text-gray-500">{description}</p>
        )}
        {errorMsg && (
          <p className="text-[0.8rem] font-medium text-red-500">{errorMsg}</p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"
