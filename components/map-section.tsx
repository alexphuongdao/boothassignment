"use client"
import CompanySlot from "./company-slot"

export default function MapSection({ section, companies, onAssignCompany, onRemoveCompany }) {
  // Determine if this is a wall section (A or N)
  const isWallSection = section.isWallSection
  const cols = isWallSection ? 1 : 2
  const rows = section.position === "top" ? 7 : 8

  return (
    <div className="flex flex-col bg-white rounded-md shadow-sm p-2">
      <h3 className="text-sm font-semibold mb-2 text-center">{section.name}</h3>
      <div
        className={`grid gap-1 ${isWallSection ? "grid-cols-1" : "grid-cols-2"}`}
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {section.slots.map((slot) => {
          const company = slot.companyId ? companies.find((c) => c.id === slot.companyId) : null

          return (
            <CompanySlot
              key={slot.id}
              slot={slot}
              company={company}
              onAssignCompany={onAssignCompany}
              onRemoveCompany={onRemoveCompany}
            />
          )
        })}
      </div>

      {/* Wall indicator for sections A and N */}
      {isWallSection && (
        <div
          className={`h-full w-2 bg-gray-300 absolute ${section.id.includes("A") ? "left-0" : "right-0"} top-0`}
        ></div>
      )}
    </div>
  )
}
