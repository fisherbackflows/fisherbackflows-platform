"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
    children: React.ReactNode
  }
>(({ className, value, onValueChange, disabled, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            isOpen,
            setIsOpen,
            value,
            onValueChange,
            disabled
          })
        }
        return child
      })}
    </div>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isOpen?: boolean
    setIsOpen?: (open: boolean) => void
    disabled?: boolean
  }
>(({ className, children, isOpen, setIsOpen, disabled, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    disabled={disabled}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300",
      isOpen && "ring-1 ring-slate-950 dark:ring-slate-300",
      className
    )}
    onClick={() => setIsOpen?.(!isOpen)}
    {...props}
  >
    {children}
    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string
  }
>(({ className, placeholder, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block truncate", className)}
    {...props}
  >
    {props.children || placeholder}
  </span>
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
    setIsOpen?: (open: boolean) => void
  }
>(({ className, children, isOpen, setIsOpen, ...props }, ref) => {
  if (!isOpen) return null
  
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen?.(false)}
      />
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-slate-800 dark:bg-slate-950 sm:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    onValueChange?: (value: string) => void
    setIsOpen?: (open: boolean) => void
    currentValue?: string
  }
>(({ className, children, value, onValueChange, setIsOpen, currentValue, ...props }, ref) => {
  const isSelected = value === currentValue
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative cursor-default select-none py-2 pl-8 pr-4 text-slate-900 hover:bg-slate-100 dark:text-slate-50 dark:hover:bg-slate-800",
        isSelected && "bg-slate-100 dark:bg-slate-800",
        className
      )}
      onClick={() => {
        onValueChange?.(value)
        setIsOpen?.(false)
      }}
      {...props}
    >
      {isSelected && (
        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-600 dark:text-slate-400">
          <Check className="h-4 w-4" />
        </span>
      )}
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }