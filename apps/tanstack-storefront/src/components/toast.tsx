import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CheckCircle2, XCircle } from "lucide-react"

type Toast = {
  id: number
  message: string
  tone: "success" | "error"
}

const ToastContext = createContext<{
  push: (message: string, tone?: Toast["tone"]) => void
}>({ push: () => {} })

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const push = useCallback(
    (message: string, tone: Toast["tone"] = "success") => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, tone }])
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id))
      }, 4000)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-lg"
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" aria-hidden />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
