"use client"

import * as React from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Save, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/lib/i18n"
import type { ExerciseLevel, Sex, UserProfile } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

function listToString(arr: string[]): string {
  return arr.join(", ")
}

function stringToList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function ProfilePage() {
  const { t } = useT()
  const { data, isLoading, mutate } = useSWR<UserProfile>(
    "/api/profile",
    fetcher,
  )

  const [form, setForm] = React.useState<UserProfile | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (data && !form) setForm(data)
  }, [data, form])

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    if (!form) return
    setForm({ ...form, [key]: value })
  }

  function updateLifestyle<K extends keyof UserProfile["lifestyle"]>(
    key: K,
    value: UserProfile["lifestyle"][K],
  ) {
    if (!form) return
    setForm({
      ...form,
      lifestyle: { ...form.lifestyle, [key]: value },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Save failed")
      const updated = (await res.json()) as UserProfile
      mutate(updated, false)
      setForm(updated)
      toast.success(t("cta.save"))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !form) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
          <Spinner />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <User className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {t("profile.kicker")}
          </p>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("profile.title")}
          </h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            {t("profile.subtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("profile.section.basic")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">
                  {t("profile.field.name")}
                </FieldLabel>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">
                  {t("profile.field.email")}
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => update("email", e.target.value || null)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="age">
                    {t("profile.field.age")}
                  </FieldLabel>
                  <Input
                    id="age"
                    type="number"
                    min={1}
                    max={119}
                    value={form.age ?? ""}
                    onChange={(e) =>
                      update(
                        "age",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sex">
                    {t("profile.field.sex")}
                  </FieldLabel>
                  <Select
                    value={form.sex ?? ""}
                    onValueChange={(v) => update("sex", v as Sex)}
                  >
                    <SelectTrigger id="sex">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">
                        {t("profile.sex.female")}
                      </SelectItem>
                      <SelectItem value="male">
                        {t("profile.sex.male")}
                      </SelectItem>
                      <SelectItem value="other">
                        {t("profile.sex.other")}
                      </SelectItem>
                      <SelectItem value="prefer_not_say">
                        {t("profile.sex.prefer_not_say")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Body */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("profile.section.body")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="height">
                  {t("profile.field.height")}
                </FieldLabel>
                <Input
                  id="height"
                  type="number"
                  min={50}
                  max={260}
                  value={form.heightCm ?? ""}
                  onChange={(e) =>
                    update(
                      "heightCm",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="weight">
                  {t("profile.field.weight")}
                </FieldLabel>
                <Input
                  id="weight"
                  type="number"
                  min={1}
                  max={400}
                  value={form.weightKg ?? ""}
                  onChange={(e) =>
                    update(
                      "weightKg",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="blood">
                  {t("profile.field.bloodGroup")}
                </FieldLabel>
                <Select
                  value={form.bloodGroup ?? ""}
                  onValueChange={(v) => update("bloodGroup", v || null)}
                >
                  <SelectTrigger id="blood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Medical */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("profile.section.medical")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="conditions">
                  {t("profile.field.conditions")}
                </FieldLabel>
                <Input
                  id="conditions"
                  value={listToString(form.conditions)}
                  onChange={(e) =>
                    update("conditions", stringToList(e.target.value))
                  }
                />
                <FieldDescription>
                  {t("profile.field.conditions.help")}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="medications">
                  {t("profile.field.medications")}
                </FieldLabel>
                <Input
                  id="medications"
                  value={listToString(form.medications)}
                  onChange={(e) =>
                    update("medications", stringToList(e.target.value))
                  }
                />
                <FieldDescription>
                  {t("profile.field.medications.help")}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="allergies">
                  {t("profile.field.allergies")}
                </FieldLabel>
                <Input
                  id="allergies"
                  value={listToString(form.allergies)}
                  onChange={(e) =>
                    update("allergies", stringToList(e.target.value))
                  }
                />
                <FieldDescription>
                  {t("profile.field.allergies.help")}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("profile.section.lifestyle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldLegend className="sr-only">
                {t("profile.section.lifestyle")}
              </FieldLegend>
              <FieldGroup>
                <Field orientation="horizontal">
                  <Switch
                    id="smoking"
                    checked={form.lifestyle.smoking}
                    onCheckedChange={(v) => updateLifestyle("smoking", v)}
                  />
                  <FieldLabel htmlFor="smoking">
                    {t("profile.field.smoking")}
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Switch
                    id="alcohol"
                    checked={form.lifestyle.alcohol}
                    onCheckedChange={(v) => updateLifestyle("alcohol", v)}
                  />
                  <FieldLabel htmlFor="alcohol">
                    {t("profile.field.alcohol")}
                  </FieldLabel>
                </Field>
                <Field>
                  <FieldLabel htmlFor="exercise">
                    {t("profile.field.exercise")}
                  </FieldLabel>
                  <Select
                    value={form.lifestyle.exercise}
                    onValueChange={(v) =>
                      updateLifestyle("exercise", v as ExerciseLevel)
                    }
                  >
                    <SelectTrigger id="exercise">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t("profile.exercise.none")}
                      </SelectItem>
                      <SelectItem value="light">
                        {t("profile.exercise.light")}
                      </SelectItem>
                      <SelectItem value="moderate">
                        {t("profile.exercise.moderate")}
                      </SelectItem>
                      <SelectItem value="intense">
                        {t("profile.exercise.intense")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : <Save className="size-4" />}
            {saving ? t("cta.saving") : t("cta.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
