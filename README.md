# FlowLegally

FlowLegally is a full-stack legal-tech SaaS demo built for a Software Engineer application at Glade.ai. It shows how workflow automation can help a law firm move client matters from intake to attorney review without relying on a generic chatbot.

## Why This Was Built For Glade.ai

Glade.ai builds automation for service businesses where staff spend too much time coordinating intake, missing information, follow-ups, and handoffs. FlowLegally applies that product thesis to a law firm workflow: intake details become structured cases, missing documents become operational blockers, payment state affects readiness, and a case service produces useful attorney-facing summaries.

## Problem Statement

Law firm intake teams often track case readiness across email, spreadsheets, notes, and memory. That creates bottlenecks: missing documents are not visible, payment follow-ups slip, attorneys review incomplete files, and clients receive inconsistent communication. This demo turns those operational states into a clear dashboard and case workspace.

## Core Features

- Legal operations dashboard with active cases, incomplete intake, missing documents, pending payment, and ready-for-review metrics.
- Today's Automation Queue showing generated document reminders, payment follow-ups, ready-for-review routing, AI summaries, and priority triage.
- Client list with search, case counts, last activity, and latest case status.
- Professional intake form with Zod validation and case-type document checklists.
- Case workspace with client info, review readiness, case summary, document requests, follow-up tasks, notes, and an automation-aware timeline.
- Mock case summary service with structured outputs: situation, risks, missing information, next steps, and priority.
- Review-readiness service that turns intake, document, payment, summary, and follow-up state into an attorney handoff checklist.
- Follow-up automation service that creates questionnaire, document, payment, and high-priority review tasks while avoiding duplicate active tasks.
- Prisma/PostgreSQL schema and seed data, plus fallback demo mode when no database is configured.
- Engineering page written for hiring reviewers.

## Product Walkthrough

1. Open `/dashboard` to see operational bottlenecks and recent case readiness.
2. Review Today's Automation Queue to see which rules generated reminders, payment follow-ups, summaries, and readiness actions.
3. Open `/clients` to search clients and jump into case workspaces.
4. Use `/intake/new` to create a client intake. The app creates the case, document requests, follow-ups, case summary, and activity logs.
5. Open `/cases/[id]` to mark intake complete, update payment, mark documents received, complete tasks, add notes, regenerate the case summary, and inspect the automation timeline.
6. Open `/engineering` to review architecture, tradeoffs, edge cases, and Glade.ai relevance.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Zod validation
- Server Actions
- Vitest
- Summary and readiness services

## Architecture Overview

The app uses server-rendered pages with Server Actions for mutations. UI components call actions, actions call the repository layer, and the repository layer delegates to either Prisma/PostgreSQL or the fallback demo store.

Business logic stays out of React components:

- `lib/services/case-status.ts` calculates readiness and status.
- `lib/services/automation-insights.ts` derives Today's Automation Queue from case, payment, document, summary, and follow-up data.
- `lib/services/automation-timeline.ts` maps activity logs into automation, team, and attorney timeline entries.
- `lib/services/review-readiness.ts` builds the attorney handoff checklist and next best action.
- `lib/services/follow-up-automation.ts` creates operational follow-up tasks.
- `lib/services/summary.ts` generates deterministic mock case summaries.
- `lib/services/activity-log.ts` centralizes activity messages.
- `lib/validations/legalflow.ts` defines Zod schemas.

## Database Schema Explanation

The Prisma schema models a firm-scoped legal workflow:

- `Firm` has many `User` and `Client` records.
- `Client` has many `Case` records.
- `Case` has many `DocumentRequest`, `FollowUpTask`, `InternalNote`, and `ActivityLog` records.
- `Case` has one `Summary`, including source and version metadata so future provider-backed summaries can be introduced without changing the case workspace contract.

The schema uses enums for case status, case type, document status, follow-up status/type, payment status, urgency, and activity type. `Case.status` is stored for dashboard filtering and recalculated after relevant mutations.

## Automation Logic Explanation

The follow-up service creates:

- Questionnaire follow-up when intake is incomplete.
- Document reminder when requested or missing documents block readiness.
- Payment follow-up when payment is pending, partial, or overdue.
- Attorney triage task for high or critical urgency.

It checks existing open tasks by type to avoid duplicate active follow-ups for the same issue.

The dashboard automation queue uses the same operational data to show what the platform handled today: generated document reminders, payment follow-ups, ready-for-review routing, summary generation, and priority triage. It reports observed workflow actions rather than guessed savings.

The case timeline classifies activity logs as automation, team, or attorney work. Automation-generated events include summary generation, document requests, follow-up creation, ready-for-review routing, and priority triage. Human events include notes, payment updates, received documents, completed follow-ups, and attorney review starts.

## Case Summary Explanation

The case summary service is intentionally mock-generated and deterministic. It accepts case type, description, urgency, missing documents, payment status, and intake notes, then returns structured content useful to a law firm. The service is shaped so a real provider can be added later without redesigning the UI or data model.

## Review Readiness Explanation

The review-readiness service derives a practical attorney handoff checklist from the current case state. It checks intake completion, blocking documents, payment status, summary availability, and unresolved follow-ups, then returns a readiness percentage, blockers, and the next best action.

## Local Setup

Install dependencies:

```bash
npm install
```

Run in fallback demo mode without PostgreSQL:

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Environment Variables

Copy the example file when using PostgreSQL:

```bash
cp .env.example .env
```

Required for PostgreSQL mode:

```bash
DATABASE_URL="postgresql://legalflow:legalflow@localhost:5432/legalflow_ai?schema=public"
```

When `DATABASE_URL` is absent, the app uses the seeded fallback store.

## Seed Data Instructions

Start PostgreSQL:

```bash
docker compose up -d
```

Create tables and seed realistic demo data:

```bash
npm run db:migrate
npm run db:seed
```

The seed includes one fictional law firm, two users, eight clients, ten cases, mixed statuses, missing documents, pending payment, ready-for-review examples, follow-up tasks, case summaries, notes, and activity logs.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deployment Notes

For deployment, configure `DATABASE_URL`, run Prisma migrations, and seed only non-production demo environments. A production version should add authentication, firm membership, role-based access, file uploads, client messaging integrations, observability, and a real summary provider.

## Future Improvements

- Real authentication and firm membership.
- Secure document upload and storage.
- Email/SMS reminders for follow-up tasks.
- Provider-backed case summaries with evaluation sets.
- Audit views and attorney assignment queues.
- Analytics for intake conversion and bottleneck aging.

## Interview Talking Points

- The product is specific to legal operations and Glade.ai’s service-business automation thesis.
- The summary workflow is operations-first rather than chatbot-first.
- The app supports both reviewer-friendly fallback mode and real Prisma/PostgreSQL mode.
- Business rules are isolated and tested.
- The engineering page documents tradeoffs and future production paths.
