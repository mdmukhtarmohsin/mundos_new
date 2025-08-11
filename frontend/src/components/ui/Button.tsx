import { cn } from '../../utils/cn'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const variants: Record<string, string> = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-200 hover:bg-slate-50',
    ghost: 'hover:bg-slate-100',
  }
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-9 px-4 text-sm rounded-lg',
    lg: 'h-11 px-6 text-base rounded-xl',
  }
  return (
    <button className={cn('inline-flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed', variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

