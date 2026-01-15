"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { PlusCircle, MinusCircle } from "lucide-react"

import { cn } from "@/lib/utils" // Assuming this path is correctly configured in your project

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "bg-neutral-800 rounded-lg mb-3", // Dark background, rounded corners, margin for separation
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 rounded-lg py-4 px-5 text-left text-base font-medium text-white transition-all outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900", // Added 'group', Adjusted padding, text, focus style
          className
        )}
        {...props}
      >
        {children}
        <PlusCircle className="size-6 shrink-0 text-[#BAFE68] group-data-[state=open]:hidden" />
        <MinusCircle className="size-6 shrink-0 text-[#BAFE68] group-data-[state=closed]:hidden" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm text-neutral-300" // Adjusted text color
      {...props}
    >
      <div className={cn("pb-4 pt-2 px-5", className)}>{children}</div> {/* Adjusted padding */}
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
