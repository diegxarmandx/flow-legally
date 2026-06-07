"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { createIntakeAction, type IntakeActionState } from "@/lib/actions/legalflow-actions";
import { documentChecklistByCaseType } from "@/lib/data/default-documents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CaseType, PaymentStatus, UrgencyLevel } from "@/types/legalflow";
import { labelFor } from "@/lib/utils/format";

const initialState: IntakeActionState = { status: "idle" };

function isCaseType(value: string): value is CaseType {
  return Object.values(CaseType).some((caseType) => caseType === value);
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full sm:w-auto" type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? "Creating intake" : "Create intake and workspace"}
    </Button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-seal">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      {errors[0]}
    </p>
  );
}

export function IntakeForm() {
  const [state, formAction] = useActionState(createIntakeAction, initialState);
  const [caseType, setCaseType] = useState<CaseType>(CaseType.IMMIGRATION);
  const documents = useMemo(() => documentChecklistByCaseType[caseType], [caseType]);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.message}
        </div>
      ) : null}

      <Card>
        <h2 className="text-base font-semibold text-ink">Client information</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="clientName">
              Client name
            </label>
            <input
              className="focus-ring mt-2 min-h-11 w-full rounded-md border border-ledger bg-white px-3 text-sm"
              id="clientName"
              name="clientName"
              autoComplete="name"
              required
            />
            <FieldError errors={state.fieldErrors?.clientName} />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="email">
              Email
            </label>
            <input
              className="focus-ring mt-2 min-h-11 w-full rounded-md border border-ledger bg-white px-3 text-sm"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <FieldError errors={state.fieldErrors?.email} />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="phone">
              Phone
            </label>
            <input
              className="focus-ring mt-2 min-h-11 w-full rounded-md border border-ledger bg-white px-3 text-sm"
              id="phone"
              name="phone"
              autoComplete="tel"
              required
            />
            <FieldError errors={state.fieldErrors?.phone} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-ink">Case intake</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="caseType">
              Case type
            </label>
            <select
              className="focus-ring mt-2 min-h-11 w-full rounded-md border border-ledger bg-white px-3 text-sm"
              id="caseType"
              name="caseType"
              value={caseType}
              onChange={(event) => {
                if (isCaseType(event.target.value)) {
                  setCaseType(event.target.value);
                }
              }}
            >
              {Object.values(CaseType).map((value) => (
                <option key={value} value={value}>
                  {labelFor(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="urgencyLevel">
              Urgency
            </label>
            <select
              className="focus-ring mt-2 min-h-11 w-full rounded-md border border-ledger bg-white px-3 text-sm"
              id="urgencyLevel"
              name="urgencyLevel"
              defaultValue={UrgencyLevel.STANDARD}
            >
              {Object.values(UrgencyLevel).map((value) => (
                <option key={value} value={value}>
                  {labelFor(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="paymentStatus">
              Payment status
            </label>
            <select
              className="focus-ring mt-2 min-h-11 w-full rounded-md border border-ledger bg-white px-3 text-sm"
              id="paymentStatus"
              name="paymentStatus"
              defaultValue={PaymentStatus.PENDING}
            >
              {Object.values(PaymentStatus).map((value) => (
                <option key={value} value={value}>
                  {labelFor(value)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold text-ink" htmlFor="description">
            Case description
          </label>
          <textarea
            className="focus-ring mt-2 min-h-36 w-full rounded-md border border-ledger bg-white px-3 py-3 text-sm leading-6"
              id="description"
              name="description"
              minLength={24}
              required
            />
          <FieldError errors={state.fieldErrors?.description} />
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold text-ink" htmlFor="internalIntakeNotes">
            Internal intake notes
          </label>
          <textarea
            className="focus-ring mt-2 min-h-24 w-full rounded-md border border-ledger bg-white px-3 py-3 text-sm leading-6"
            id="internalIntakeNotes"
            name="internalIntakeNotes"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-ink">Required documents</h2>
        <p className="mt-1 text-sm text-docket">Defaults adjust by case type and can be edited later.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {documents.map((title) => (
            <label
              key={title}
              className="flex min-h-12 items-center gap-3 rounded-md border border-ledger bg-paper px-3 py-2 text-sm font-medium text-ink"
            >
              <input
                className="h-4 w-4 rounded border-ledger text-brief focus:ring-brief"
                type="checkbox"
                name="requiredDocuments"
                value={title}
                defaultChecked
              />
              {title}
            </label>
          ))}
        </div>
        <FieldError errors={state.fieldErrors?.requiredDocuments} />
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-ledger bg-white/75 p-4 shadow-hairline sm:flex-row sm:items-center">
        <p className="max-w-2xl text-sm leading-6 text-docket">
          Submitting creates or connects the client, opens the case, requests documents, generates
          follow-ups, creates a mock AI summary, logs activity, and redirects to the case workspace.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
