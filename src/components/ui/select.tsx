import * as React from "react"

export function Select({ children, onValueChange, value, required, disabled }: any) {
  return (
    <select
      className="w-full border rounded px-3 py-2 text-sm"
      onChange={e => onValueChange && onValueChange(e.target.value)}
      value={value}
      required={required}
      disabled={disabled}
    >
      {children}
    </select>
  )
}

export function SelectTrigger({ children, ...props }: any) {
  return <>{children}</>
}
export function SelectValue({ placeholder }: any) {
  return <option value="" disabled hidden>{placeholder}</option>
}
export function SelectContent({ children }: any) {
  return <>{children}</>
}
export function SelectItem({ value, children, disabled }: any) {
  return <option value={value} disabled={disabled}>{children}</option>
} 