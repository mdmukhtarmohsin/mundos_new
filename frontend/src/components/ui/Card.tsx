import { cn } from '../../utils/cn'
import type { PropsWithChildren, HTMLAttributes } from 'react'

export function Card({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn('rounded-xl bg-white border border-slate-200', className)} {...props} />
}
export function CardHeader({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn('p-4 border-b', className)} {...props} />
}
export function CardContent({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn('p-4', className)} {...props} />
}

