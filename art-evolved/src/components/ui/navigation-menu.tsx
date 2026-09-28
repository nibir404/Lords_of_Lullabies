import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cn } from '@/lib/utils'

export const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, ...props }, ref) => <NavigationMenuPrimitive.Root ref={ref} className={cn('relative', className)} {...props} />)
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

export const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => <NavigationMenuPrimitive.List ref={ref} className={cn('flex flex-col', className)} {...props} />)
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

export const NavigationMenuItem = NavigationMenuPrimitive.Item

export const NavigationMenuLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Link
    ref={ref}
    className={cn(
      'group flex cursor-pointer items-baseline justify-between border-b border-fg/10 py-4 font-sans text-2xl tracking-tight text-fg/80 outline-none transition-[color,padding] duration-500 ease-museum hover:pl-3 hover:text-fg focus-visible:pl-3 focus-visible:text-accent data-[active]:text-fg',
      className,
    )}
    {...props}
  />
))
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName
