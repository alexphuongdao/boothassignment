"use client"

import { useDrop, useDrag } from "react-dnd"
import { X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function CompanySlot({ slot, company, onAssignCompany, onRemoveCompany }) {
  // Make the slot a drop target for companies
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "company",
    drop: (item) => {
      onAssignCompany(slot.id, item.id, "slot")
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  // Make the slot draggable if it has a company
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "company",
    item: company ? { id: company.id, name: company.name } : null,
    canDrag: !!company,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  // Combine the drag and drop refs
  const combineRefs = (el) => {
    drop(el)
    if (company) {
      drag(el)
    }
  }

  return (
    <div
      ref={combineRefs}
      className={`company-slot h-8 w-8 flex items-center justify-center rounded-sm text-xs font-medium transition-colors ${
        isOver ? "bg-blue-100" : company ? "bg-blue-50" : "bg-gray-100"
      } ${company ? "border border-blue-200 cursor-grab" : "border border-gray-200"} ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      {company ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative w-full h-full flex items-center justify-center">
                <span>{company.symbol}</span>
                <button
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveCompany(company.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{company.name}</p>
              <p className="text-xs text-muted-foreground">
                Section {slot.id.split("-")[0]}, Slot {slot.position}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-gray-400">{slot.position}</span>
      )}
    </div>
  )
}
