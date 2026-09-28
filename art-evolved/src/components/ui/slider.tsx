import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { thumbLabel?: string }
>(({ className, thumbLabel, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={cn('museum-slider relative flex w-full touch-none select-none items-center py-2', className)} {...props}>
    <SliderPrimitive.Track className="relative h-px w-full grow overflow-hidden bg-fg/25">
      <SliderPrimitive.Range className="absolute h-full bg-fg" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label={thumbLabel}
      className="block h-3 w-3 rotate-45 border border-fg bg-bg transition-transform duration-200 ease-museum hover:scale-125 focus-visible:scale-125 focus-visible:bg-accent focus-visible:outline-none"
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName
