import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/common/components/ui/dialog";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  preventClose?: boolean; // Thêm prop này
}

export function Modal({ isOpen, onClose, title, description, children, className, preventClose }: ModalProps) {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Nếu preventClose là true, không cho phép đóng qua onOpenChange (Esc, click ngoài)
        if (preventClose) return;
        if (!open) onClose();
      }}
    >
      <DialogContent 
        className={className}
        // Chặn phím Esc và click ra ngoài nếu preventClose = true
        onPointerDownOutside={(e) => preventClose && e.preventDefault()}
        onEscapeKeyDown={(e) => preventClose && e.preventDefault()}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
