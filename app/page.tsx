import CareerFairMap from "@/components/career-fair-map"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Career Fair Mapping System</h1>
      <CareerFairMap />
    </main>
  )
}
