import { Loader2 } from "lucide-react"
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react"

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ")

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-brand-900 hover:bg-accent-strong focus-visible:outline-brand-600 disabled:bg-line disabled:text-ink-soft",
  secondary:
    "bg-surface text-ink border border-line hover:border-brand-400 hover:text-brand-700 focus-visible:outline-brand-600 disabled:text-ink-soft",
  ghost:
    "bg-transparent text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600 disabled:text-ink-soft",
  danger:
    "bg-transparent text-red-700 border border-line hover:border-red-300 hover:bg-red-50 focus-visible:outline-red-600 disabled:text-ink-soft",
}

export function Button({
  variant = "primary",
  busy = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  busy?: boolean
}) {
  return (
    <button
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
        buttonVariants[variant],
        className
      )}
      disabled={disabled || busy}
      {...props}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "min-h-11 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-200",
        className
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "min-h-11 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-200",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cx("mb-1.5 block text-sm font-medium text-ink", className)}
      {...props}
    >
      {children}
    </label>
  )
}

export function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="text-red-600" aria-hidden>
            {" "}
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  )
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "green" | "amber" | "brand" | "red"
  children: ReactNode
}) {
  const tones = {
    neutral: "bg-canvas text-ink-soft border-line",
    green: "bg-green-50 text-green-800 border-green-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}

export function Spinner({ label = "Načítání" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ink-soft">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  )
}
