import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 border px-2 py-0.5 font-sans text-[11px] uppercase tracking-museum transition-colors', {
  variants: {
    variant: {
      default: 'border-fg/25 text-fg/80',
      solid: 'border-fg bg-fg text-bg',
      accent: 'border-accent text-accent',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
