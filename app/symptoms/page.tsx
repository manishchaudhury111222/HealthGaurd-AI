import { Stethoscope } from "lucide-react"
import { SymptomForm } from "@/components/symptom-form"

export default function SymptomsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Stethoscope className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            New Diagnosis
          </p>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Tell us how you&apos;re feeling
          </h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            Walk through a quick four-step assessment. We&apos;ll analyze your
            entries instantly and surface a likely condition with risk and
            recommendations.
          </p>
        </div>
      </div>
      <SymptomForm />
    </div>
  )
}
