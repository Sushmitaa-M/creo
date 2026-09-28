import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  LogOut,
  PackageMinus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

export type ConfirmTone = "danger" | "warning" | "info" | "success";

export interface ConfirmOptions {
  title: string;
  description?: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: "danger" | "warning" | "logout" | "remove_plan" | "trash" | "info" | "success" | "check";
  isAlertOnly?: boolean;
  className?: string;
}

export type AlertInput =
  | string
  | {
      title: string;
      description?: string;
      details?: string[];
      confirmText?: string;
      tone?: ConfirmTone;
      icon?: "danger" | "warning" | "logout" | "remove_plan" | "trash" | "info" | "success" | "check";
      className?: string;
    };

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (input: AlertInput) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export function useAlert() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useAlert must be used within a ConfirmProvider");
  }
  return context.alert;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions({ ...opts, isAlertOnly: false });
      setIsOpen(true);
      setIsProcessing(false);
    });
  }, []);

  const alert = useCallback((input: AlertInput) => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      if (typeof input === "string") {
        setOptions({
          title: "Notice",
          description: input,
          confirmText: "OK",
          tone: "info",
          icon: "info",
          isAlertOnly: true,
        });
      } else {
        setOptions({
          ...input,
          confirmText: input.confirmText || "OK",
          tone: input.tone || (input.icon === "success" || input.icon === "check" ? "success" : "info"),
          icon: input.icon || (input.tone === "success" ? "success" : "info"),
          isAlertOnly: true,
          className: input.className,
        });
      }
      setIsOpen(true);
      setIsProcessing(false);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setIsProcessing(true);
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setIsProcessing(false);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {isOpen && options && (
        <ConfirmDialog
          isOpen={isOpen}
          title={options.title}
          description={options.description}
          details={options.details}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          tone={options.tone || "danger"}
          icon={options.icon}
          isAlertOnly={options.isAlertOnly}
          className={options.className}
          isProcessing={isProcessing}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: "danger" | "warning" | "logout" | "remove_plan" | "trash" | "info" | "success" | "check";
  isAlertOnly?: boolean;
  className?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  details,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  icon,
  isAlertOnly = false,
  className,
  isProcessing = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Icon resolution
  const renderIcon = () => {
    const selectedIcon =
      icon ||
      (tone === "success"
        ? "success"
        : tone === "warning"
        ? "warning"
        : tone === "info"
        ? "info"
        : "danger");

    switch (selectedIcon) {
      case "success":
      case "check":
        return <CheckCircle2 className="size-5 text-emerald-600" />;
      case "logout":
        return <LogOut className="size-5 text-amber-600" />;
      case "remove_plan":
        return <PackageMinus className="size-5 text-rose-600" />;
      case "trash":
        return <Trash2 className="size-5 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="size-5 text-amber-600" />;
      case "info":
        return <AlertCircle className="size-5 text-[#2B7BC4]" />;
      case "danger":
      default:
        return <AlertTriangle className="size-5 text-rose-600" />;
    }
  };

  const getToneBadgeStyle = () => {
    switch (tone) {
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      case "info":
        return "bg-[#2B7BC4]/10 border-[#2B7BC4]/20 text-[#2B7BC4]";
      case "danger":
      default:
        return "bg-rose-500/10 border-rose-500/20 text-rose-500";
    }
  };

  const getConfirmButtonStyle = () => {
    switch (tone) {
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-500/50";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/20 border border-amber-500/50";
      case "info":
        return "bg-[#2B7BC4] hover:brightness-110 text-white shadow-md shadow-blue-900/20 border border-[#2B7BC4]/50";
      case "danger":
      default:
        return "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/20 border border-rose-500/50";
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-[#05080F]/80 backdrop-blur-md transition-opacity duration-200 overflow-y-auto ${className || ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[24px] bg-[#161C2D] p-6 shadow-2xl border border-white/[0.05] text-left transition-all duration-200 transform scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Close (X) button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 size-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#9CA3AF] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Tone Icon Badge */}
          <div
            className={`size-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${getToneBadgeStyle()}`}
          >
            {renderIcon()}
          </div>

          <div className="flex-1 pr-4">
            <h3
              id="confirm-dialog-title"
              className="text-base sm:text-lg font-black text-white tracking-tight leading-snug"
            >
              {title}
            </h3>

            {description && (
              <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Structured Details Bullet Points if provided */}
        {details && details.length > 0 && (
          <div
            className={`mt-4 rounded-[16px] p-3.5 border ${
              tone === "danger"
                ? "bg-rose-500/5 border-rose-500/10"
                : tone === "warning"
                ? "bg-amber-500/5 border-amber-500/10"
                : tone === "success"
                ? "bg-emerald-500/5 border-emerald-500/10"
                : "bg-blue-500/5 border-blue-500/10"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
              Action Summary & Impacts:
            </p>
            <ul className="space-y-1.5 text-xs text-[#9CA3AF]">
              {details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    className={`size-1.5 rounded-full shrink-0 mt-1.5 ${
                      tone === "danger"
                        ? "bg-rose-500"
                        : tone === "warning"
                        ? "bg-amber-500"
                        : tone === "success"
                        ? "bg-emerald-500"
                        : "bg-[#2B7BC4]"
                    }`}
                  />
                  <span className="leading-snug">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl border border-white/[0.12] text-white hover:bg-white/[0.05] active:scale-95 text-xs font-bold transition-all cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            autoFocus
            className={`px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isAlertOnly ? "w-full" : ""
            } ${getConfirmButtonStyle()}`}
          >
            {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

