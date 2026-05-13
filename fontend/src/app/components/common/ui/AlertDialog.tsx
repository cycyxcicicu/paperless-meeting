import * as React from "react"
import { Modal } from "./Modal"
import { Button } from "./Button"
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info' | 'success'
  isLoading?: boolean
}

const iconMap = {
  warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
  danger: <XCircle className="h-6 w-6 text-red-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
  success: <CheckCircle2 className="h-6 w-6 text-green-500" />
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = 'warning',
  isLoading = false
}: AlertDialogProps) {
  
  const confirmVariant = type === 'danger' ? 'danger' : 'primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-[425px]">
      <div className="flex flex-col items-center gap-4 py-4 text-center sm:flex-row sm:text-left">
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
          type === 'warning' && "bg-yellow-100",
          type === 'danger' && "bg-red-100",
          type === 'info' && "bg-blue-100",
          type === 'success' && "bg-green-100"
        )}>
          {iconMap[type]}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4 border-t pt-4">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
