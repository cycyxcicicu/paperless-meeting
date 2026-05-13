import * as React from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "../ui/Typography/Label"
import { Input } from "../ui/Input"
import { cn } from "@/lib/utils"
import { UploadCloud } from "lucide-react"

export interface FormFileUploadProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  className?: string
  accept?: string
  multiple?: boolean
}

export const FormFileUpload = ({
  name,
  label,
  description,
  required,
  className,
  accept,
  multiple = false
}: FormFileUploadProps) => {
  const { register, formState: { errors } } = useFormContext()
  const errorMsg = errors[name]?.message as string | undefined

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id={name}
          type="file"
          accept={accept}
          multiple={multiple}
          className={cn(
            "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer pt-1.5",
            errorMsg && "border-red-500 focus-visible:ring-red-500"
          )}
          {...register(name)}
        />
        <UploadCloud className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      {description && !errorMsg && (
        <p className="text-[0.8rem] text-gray-500">{description}</p>
      )}
      {errorMsg && (
        <p className="text-[0.8rem] font-medium text-red-500">{errorMsg}</p>
      )}
    </div>
  )
}
