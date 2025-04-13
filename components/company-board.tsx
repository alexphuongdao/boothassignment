"use client"

import { useDrag } from "react-dnd"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function CompanyItem({ company, onAssignCompany }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "company",
    item: { id: company.id, name: company.name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={drag}
            className={`company-item h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium bg-white border border-gray-200 shadow-sm cursor-grab ${
              isDragging ? "opacity-50" : "opacity-100"
            }`}
          >
            {company.symbol}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{company.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function CompanyBoard({ companies, onAssignCompany }) {
  return (
    <div className="grid grid-cols-10 gap-2 md:grid-cols-15 lg:grid-cols-20">
      {companies.map((company) => (
        <CompanyItem key={company.id} company={company} onAssignCompany={onAssignCompany} />
      ))}
    </div>
  )
}
