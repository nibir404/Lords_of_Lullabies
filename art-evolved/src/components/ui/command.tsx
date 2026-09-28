import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { cn } from '@/lib/utils'

export const Command = React.forwardRef<React.ElementRef<typeof CommandPrimitive>, React.ComponentPropsWithoutRef<typeof CommandPrimitive>>(
  ({ className, ...props }, ref) => <CommandPrimitive ref={ref} className={cn('flex h-full w-full flex-col overflow-hidden text-fg', className)} {...props} />,
)
Command.displayName = CommandPrimitive.displayName

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-fg/15 px-6">
    <span aria-hidden className="mr-4 font-sans text-[10px] uppercase tracking-museum text-fg/50">
      Search
    </span>
    <CommandPrimitive.Input
      ref={ref}
      className={cn('h-16 w-full bg-transparent font-serif text-2xl text-fg outline-none placeholder:text-fg/30', className)}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

export const CommandList = React.forwardRef<React.ElementRef<typeof CommandPrimitive.List>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(
  ({ className, ...props }, ref) => <CommandPrimitive.List ref={ref} className={cn('max-h-[52vh] overflow-y-auto overflow-x-hidden p-2', className)} {...props} />,
)
CommandList.displayName = CommandPrimitive.List.displayName

export const CommandEmpty = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Empty>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>>(
  (props, ref) => <CommandPrimitive.Empty ref={ref} className="px-4 py-8 font-serif text-lg text-fg/60" {...props} />,
)
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

export const CommandGroup = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Group>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Group
      ref={ref}
      className={cn('overflow-hidden p-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-museum [&_[cmdk-group-heading]]:text-fg/45', className)}
      {...props}
    />
  ),
)
CommandGroup.displayName = CommandPrimitive.Group.displayName

export const CommandItem = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Item>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn('flex cursor-pointer select-none items-baseline justify-between gap-4 px-3 py-2.5 font-sans text-sm text-fg/80 outline-none transition-colors data-[selected=true]:bg-fg data-[selected=true]:text-bg', className)}
      {...props}
    />
  ),
)
CommandItem.displayName = CommandPrimitive.Item.displayName
