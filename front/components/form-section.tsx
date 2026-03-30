import React from "react"

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-accent/30 px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">
          {title}
        </h3>
      </div>
      <div className="px-4 py-3">
        {children}
      </div>
    </div>
  )
}

interface FormFieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, children, className = "" }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

export const inputClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"

export const selectClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"

export const readOnlyClass =
  "h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-muted-foreground outline-none"
