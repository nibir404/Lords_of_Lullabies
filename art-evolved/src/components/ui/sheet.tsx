import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close
export const SheetTitle = SheetPrimitive.Title
export const SheetDescription = SheetPrimitive.Description

const sheetVariants = cva('museum-sheet fixed z-50 flex flex-col border-fg/20 bg-panel text-fg', {
  variants: {
    side: {
      right: 'inset-y-0 right-0 h-full w-[min(560px,100vw)] border-l data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right',
      left: 'inset-y-0 left-0 h-full w-[min(460px,100vw)] border-r data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left',
      bottom: 'inset-x-0 bottom-0 max-h-[85vh] border-t data-[state=open]:animate-sheet-in-bottom',
    },
  },
  defaultVariants: { side: 'right' },
})

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants>
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="museum-overlay fixed inset-0 z-50 bg-bg/40" />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      {children}
      <SheetPrimitive.Close className="absolute right-5 top-5 font-sans text-[10px] uppercase tracking-museum text-fg/60 hover:text-fg focus-visible:outline-none">
        Close ✕
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName
