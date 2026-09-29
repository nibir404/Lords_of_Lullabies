import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'museum-btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-sans uppercase tracking-museum transition-[background,color,border-color,transform,opacity] duration-300 ease-museum focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40 active:translate-y-px',
  {
    variants: {
      variant: {
        primary: 'bg-fg text-bg hover:bg-accent hover:text-bg',
        outline: 'border border-fg/50 bg-bg/45 text-fg backdrop-blur-sm hover:border-fg hover:bg-fg hover:text-bg',
        ghost: 'bg-transparent text-fg/90 hover:text-fg',
        link: 'bg-transparent p-0 text-fg underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-[11px]',
        md: 'h-10 px-5 text-[11px]',
        lg: 'h-14 px-8 text-[12px]',
        icon: 'h-9 w-9 text-[11px]',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { buttonVariants }
