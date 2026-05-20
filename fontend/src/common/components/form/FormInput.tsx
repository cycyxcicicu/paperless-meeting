import * as React from "react"
import { useFormContext } from "react-hook-form"
import { Input, InputProps } from '@/common/components/ui/input'
import { Label } from '@/common/components/ui/label'
import { cn } from '@/common/utils/cn'
import { Eye, EyeOff } from 'lucide-react'

export interface FormInputProps extends Omit<InputProps, 'required'> {
  name: string
  label?: string
  description?: string
  rules?: any
  uppercase?: boolean
  allowedChars?: 'alphanumeric' | 'letters' | 'no-special' | 'number-only'
  required?: boolean
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, description, required, className, uppercase, allowedChars, ...props }, ref) => {
    const { register, formState: { errors }, setValue } = useFormContext()
    const errorMsg = errors[name]?.message as string | undefined
    const [showPassword, setShowPassword] = React.useState(false)
    
    // Extract RHF's onBlur to run it after our custom logic if needed,
    // but spreading {...register} handles it. We just use setValue to update RHF.
    const registeredProps = register(name, props.rules);

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
            className={cn(
              errorMsg && "border-red-500 focus-visible:ring-red-500",
              props.type === 'password' && "pr-10"
            )}
            aria-invalid={!!errorMsg}
            {...registeredProps}
            {...props}
            ref={(e) => {
              registeredProps.ref(e);
              if (typeof ref === 'function') ref(e);
              else if (ref) (ref as React.MutableRefObject<any>).current = e;
            }}
            type={props.type === 'password' && showPassword ? 'text' : props.type}
            onBlur={(e) => {
              // Tự động trim khoảng trắng ở 2 đầu khi click ra ngoài
              if (typeof e.target.value === 'string') {
                const trimmed = e.target.value.trim();
                if (trimmed !== e.target.value) {
                  e.target.value = trimmed;
                  setValue(name, trimmed, { shouldValidate: true, shouldDirty: true });
                }
              }
              // Chạy onBlur của RHF và props ngoài
              registeredProps.onBlur(e);
              if (props.onBlur) props.onBlur(e);
            }}
            onInput={(e: any) => {
              let val = e.target.value;

              // 1. Chặn kí tự theo pattern
              if (allowedChars === 'number-only' || props.type === 'tel' || props.type === 'number') {
                val = val.replace(/[^0-9]/g, '');
              } else if (allowedChars === 'letters') {
                // Chặn số và các kí tự đặc biệt phổ biến, giữ lại chữ (bao gồm tiếng Việt) và khoảng trắng
                val = val.replace(/[0-9!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~]/g, '');
              } else if (allowedChars === 'alphanumeric') {
                // Chỉ chữ và số, không khoảng trắng, không kí tự đặc biệt
                val = val.replace(/[^a-zA-Z0-9]/g, '');
              } else if (allowedChars === 'no-special') {
                // Chữ, số và khoảng trắng (chặn kí tự đặc biệt)
                val = val.replace(/[!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~]/g, '');
              }

              // 2. Chặn tuyệt đối khoảng trắng trong mật khẩu (logic cũ vẫn giữ)
              if (props.type === 'password') {
                val = val.replace(/\s/g, '');
              }

              // 3. Tự động viết hoa nếu có yêu cầu
              if (uppercase) {
                val = val.toUpperCase();
              }

              // Cập nhật lại value nếu có thay đổi
              if (val !== e.target.value) {
                e.target.value = val;
                setValue(name, val, { shouldValidate: true, shouldDirty: true });
              }

              if (props.onInput) {
                props.onInput(e);
              }
            }}
          />
          {props.type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[50%] -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {description && !errorMsg && (
          <p className="text-[0.8rem] text-gray-500">{description}</p>
        )}
        {errorMsg && (
          <p className="text-[0.8rem] body text-red-500">{errorMsg}</p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"
