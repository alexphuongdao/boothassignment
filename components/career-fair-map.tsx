"use client"

import { useState, useEffect, useRef } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import MapSection from "./map-section"
import CompanyBoard from "./company-board"
import { updateGoogleSheet } from "@/lib/google-sheets"
import { Move, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

// Generate sections from A to N with special layout
const generateSections = () => {
  const sections = []

  // Create sections A to N (14 sections) 
  for (let i = 65; i <= 78; i++) {
    const sectionName = String.fromCharCode(i)
    const isWallSection = sectionName === "A" || sectionName === "N"
    const slotsPerRow = isWallSection ? 1 : 2

    // First half (top) - 7 rows
    const topSection = {
      id: `${sectionName}-Top`,
      name: `Section ${sectionName} (Top)`,
      slots: Array(7 * slotsPerRow)
        .fill(null)
        .map((_, index) => ({
          id: `${sectionName}-Top-${index + 1}`,
          position: index + 1,
          companyId: null,
        })),
      isWallSection,
      position: "top",
    }

    // Second half (bottom) - 8 rows
    const bottomSection = {
      id: `${sectionName}-Bottom`,
      name: `Section ${sectionName} (Bottom)`,
      slots: Array(8 * slotsPerRow)
        .fill(null)
        .map((_, index) => ({
          id: `${sectionName}-Bottom-${index + 1}`,
          position: index + 1,
          companyId: null,
        })),
      isWallSection,
      position: "bottom",
    }

    sections.push(topSection, bottomSection)
  }

  return sections
}

// Sample companies data later on switch with the Google Sheets API
// In a real application fetch this data from an API or database
const generateCompanies = () => {
  const companyNames = [
    "Apple",
    "Google",
    "Microsoft",
    "Amazon",
    "Facebook",
    "Tesla",
    "Netflix",
    "Adobe",
    "IBM",
    "Intel",
    "Oracle",
    "Salesforce",
    "Twitter",
    "Uber",
    "Airbnb",
    "Spotify",
    "Dropbox",
    "Slack",
    "Zoom",
    "PayPal",
    "Square",
    "Stripe",
    "Shopify",
    "Twilio",
    "LinkedIn",
    "Pinterest",
    "Snapchat",
    "Reddit",
    "Yelp",
    "Lyft",
    "DoorDash",
    "Instacart",
    "Robinhood",
    "Coinbase",
    "Palantir",
    "Snowflake",
    "MongoDB",
    "Databricks",
    "Cloudflare",
    "Okta",
  ]

  return companyNames.map((name, index) => ({
    id: `company-${index + 1}`,
    name,
    symbol: name.charAt(0),
  }))
}

// Group sections by their letter (A-N)
const groupSectionsByLetter = (sections) => {
  const groupedSections = {}

  sections.forEach((section) => {
    const letter = section.id.split("-")[0]
    if (!groupedSections[letter]) {
      groupedSections[letter] = []
    }
    groupedSections[letter].push(section)
  })

  return Object.values(groupedSections)
}

export default function CareerFairMap() {
  const [sections, setSections] = useState(generateSections())
  const [companies, setCompanies] = useState(generateCompanies())
  const [unassignedCompanies, setUnassignedCompanies] = useState(generateCompanies())
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const mapRef = useRef(null)

  // Group sections by letter
  const groupedSections = groupSectionsByLetter(sections)

  // Handle company assignment to a slot with proper swapping
  const handleAssignCompany = (slotId, companyId, sourceType) => {
    // Find the target slot
    let targetSlotInfo = { sectionIndex: -1, slotIndex: -1, existingCompanyId: null }

    sections.forEach((section, sectionIndex) => {
      section.slots.forEach((slot, slotIndex) => {
        if (slot.id === slotId) {
          targetSlotInfo = {
            sectionIndex,
            slotIndex,
            existingCompanyId: slot.companyId,
          }
        }
      })
    })

    // Create a copy of the sections to modify
    const updatedSections = [...sections]

    // If the target slot already has a company
    if (targetSlotInfo.existingCompanyId) {
      // If dragging from unassigned board, move existing company to unassigned
      if (sourceType === "unassigned") {
        // Find the existing company and add it to unassigned
        const existingCompany = companies.find((c) => c.id === targetSlotInfo.existingCompanyId)
        if (existingCompany) {
          setUnassignedCompanies((prev) => [...prev, existingCompany])
        }
      } else if (sourceType === "slot") {
        // If dragging from another slot, find that slot and update it
        let sourceSlotFound = false

        for (let i = 0; i < updatedSections.length && !sourceSlotFound; i++) {
          for (let j = 0; j < updatedSections[i].slots.length && !sourceSlotFound; j++) {
            const slot = updatedSections[i].slots[j]
            if (slot.companyId === companyId && slot.id !== slotId) {
              // Swap the companies
              updatedSections[i].slots[j] = {
                ...slot,
                companyId: targetSlotInfo.existingCompanyId,
              }
              sourceSlotFound = true
            }
          }
        }
      }
    } else if (sourceType === "slot") {
      // If target is empty and source is a slot, clear the source slot
      for (let i = 0; i < updatedSections.length; i++) {
        for (let j = 0; j < updatedSections[i].slots.length; j++) {
          const slot = updatedSections[i].slots[j]
          if (slot.companyId === companyId && slot.id !== slotId) {
            updatedSections[i].slots[j] = {
              ...slot,
              companyId: null,
            }
          }
        }
      }
    }

    // Update the target slot with the new company
    if (targetSlotInfo.sectionIndex >= 0) {
      updatedSections[targetSlotInfo.sectionIndex].slots[targetSlotInfo.slotIndex] = {
        ...updatedSections[targetSlotInfo.sectionIndex].slots[targetSlotInfo.slotIndex],
        companyId,
      }
    }

    setSections(updatedSections)

    // If dragging from unassigned, remove from unassigned list
    if (sourceType === "unassigned") {
      setUnassignedCompanies((prev) => prev.filter((company) => company.id !== companyId))
    }

    // Update Google Sheet
    updateGoogleSheetData(updatedSections)
  }

  // Handle removing a company from a slot
  const handleRemoveCompany = (companyId) => {
    // Find the company in the full companies list
    const company = companies.find((c) => c.id === companyId)

    if (company) {
      // Add it back to unassigned companies
      setUnassignedCompanies((prev) => [...prev, company])

      // Remove it from the slot
      const updatedSections = sections.map((section) => {
        const updatedSlots = section.slots.map((slot) => {
          if (slot.companyId === companyId) {
            return { ...slot, companyId: null }
          }
          return slot
        })
        return { ...section, slots: updatedSlots }
      })

      setSections(updatedSections)

      // Update Google Sheet
      updateGoogleSheetData(updatedSections)
    }
  }

  // Update Google Sheet with current assignments
  const updateGoogleSheetData = async (updatedSections) => {
    try {
      const data = updatedSections.flatMap((section) =>
        section.slots
          .filter((slot) => slot.companyId)
          .map((slot) => {
            const company = companies.find((c) => c.id === slot.companyId)
            return {
              section: section.id,
              position: slot.position,
              companyId: slot.companyId,
              companyName: company ? company.name : "Unknown",
            }
          }),
      )

      await updateGoogleSheet(data)
    } catch (error) {
      console.error("Failed to update Google Sheet:", error)
    }
  }

  // Handle map dragging
  const handleMouseDown = (e) => {
    if (e.target.closest(".company-slot") || e.target.closest(".company-item")) {
      return // Don't start dragging the map if we're interacting with a slot or company
    }

    setIsDragging(true)
    setStartPosition({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    setPosition({
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Save current layout to Google Sheets
  const handleSave = async () => {
    try {
      await updateGoogleSheetData(sections)
      toast({
        title: "Layout saved (placeholder)",
        description: "In a real app, your career fair layout would be saved to Google Sheets",
      })
    } catch (error) {
      toast({
        title: "Error saving layout",
        description: "There was a problem with the placeholder save function",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    // Add event listeners for map dragging
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isDragging, startPosition])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Move className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Drag the map to reposition</span>
          </div>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save to Google Sheets
          </Button>
        </div>

        <div
          className="relative overflow-auto border rounded-lg bg-gray-50 p-4"
          style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}
        >
          {/* 
          <div
            ref={mapRef}
            className="absolute cursor-move"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
          > */}
            {/* Career fair layout with hallways */}
            <div className="flex flex-row gap-4">
              {groupedSections.map((sectionGroup, groupIndex) => {
                // Sort sections so top is first, bottom is second
                const sortedSections = [...sectionGroup].sort((a, b) => (a.position === "top" ? -1 : 1))

                const letter = sortedSections[0].id.split("-")[0]

                return (
                  <div key={groupIndex} className="flex flex-col">
                    {/* Top section */}
                    <MapSection
                      section={sortedSections[0]}
                      companies={companies}
                      onAssignCompany={handleAssignCompany}
                      onRemoveCompany={handleRemoveCompany}
                    />

                    {/* Horizontal hallway */}
                    <div className="h-6 bg-yellow-100 border border-yellow-300 rounded-md my-2 flex items-center justify-center">
                      <span className="text-xs text-yellow-800">Hallway</span>
                    </div>

                    {/* Bottom section */}
                    <MapSection
                      section={sortedSections[1]}
                      companies={companies}
                      onAssignCompany={handleAssignCompany}
                      onRemoveCompany={handleRemoveCompany}
                    />
                  </div>
                )
              })}
            </div>
            {/* </div>*/}
          
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Unassigned Companies</h2>
          <CompanyBoard
            companies={unassignedCompanies}
            onAssignCompany={(companyId, slotId) => {
              handleAssignCompany(slotId, companyId, "unassigned")
            }}
          />
        </div>
      </div>
    </DndProvider>
  )
}
