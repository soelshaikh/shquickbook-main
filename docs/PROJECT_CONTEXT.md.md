🚫 STRICT RULES (NON-NEGOTIABLE)

❌ DO NOT modify:

dataService.ts

apiClient.ts

indexedDB.ts

cacheManager.ts

Any React Query hook files

Architecture or folder structure

❌ DO NOT add new abstractions

❌ DO NOT refactor unrelated code

❌ DO NOT add error boundaries

✅ ONLY modify page-level UI logic

✅ ONLY fix the bugs listed below

🐞 BUG #1 — Duplicate Invoice Created on “Save & Close”
Problem

Clicking Save & Close creates TWO invoices.

Requirement

Ensure exactly ONE create/update operation per user action

Save → create/update without closing

Save & Close → create/update AND close

No shared logic that causes duplicate creation

Acceptance Criteria

Save & Close creates one invoice

No duplicate optimistic entries

No duplicate IndexedDB records

🐞 BUG #2 — App Crashes After Clicking “Save”
Error
InvoiceRow.tsx:37
Cannot read properties of undefined (reading 'icon')

Root Cause

The optimistic invoice object does NOT match the shape expected by the UI.

Requirement

Fix the optimistic invoice shape

Do NOT touch InvoiceRow.tsx

Do NOT add defensive checks in UI components

Ensure optimistic invoice includes all required UI fields

Match the shape of invoices returned by apiClient

Acceptance Criteria

Clicking Save does NOT crash the app

Optimistic invoice renders correctly

Undo still works

No runtime errors

🧪 VERIFICATION CHECKLIST

After fixing, verify:

Save → invoice appears instantly (optimistic)

Save & Close → invoice appears once, form closes

Undo → optimistic invoice removed

IndexedDB contains one record

No console errors

Architecture untouched

📦 OUTPUT FORMAT (MANDATORY)

After finishing, respond with:

Files changed

Cause of Bug #1

Cause of Bug #2

Exact fix applied for each

Confirmation: architecture untouched

⚠️ IMPORTANT

If anything is unclear:

STOP

Ask one clarification question

Do NOT guess

✅ End of Prompt

If you want, after Claude responds:

I’ll review the fix

Validate the optimistic data shape

Confirm it’s safe to move to the next issue

You are a senior full-stack engineer.
I will describe my project requirements.
First, understand them and then ask clarifying questions before writing any code.  : need prompt like this way we need to add in clade ai, comaand

Here is a clean, professional base prompt you can use in Claude / RovoDev CLI that sets the right behavior before any coding starts.

You can reuse this for every major task.

🧠 BASE PROMPT — REQUIREMENTS FIRST, NO CODE
You are a senior full-stack engineer and software architect.

I will describe my project requirements.

Your task:
1. First, read and fully understand the requirements.
2. Summarize your understanding in your own words.
3. Identify assumptions you might be making.
4. Ask all necessary clarifying questions.
5. WAIT for my confirmation before writing ANY code.

Strict rules:
- ❌ Do NOT write any code in this step.
- ❌ Do NOT suggest implementation yet.
- ❌ Do NOT refactor or optimize anything.
- ✅ Focus only on understanding, risks, and open questions.
- ✅ Respect existing architecture unless explicitly told otherwise.

Only after I confirm your understanding and answer your questions,
you may proceed to design or implementation.

If anything is unclear, ask questions instead of guessing.

✅ How to Use This in Practice

Paste the above prompt in Claude / RovoDev

Then paste:

Your .md requirements

Or the issue description (e.g. Issue #1.4)

Let Claude respond with:

Understanding

Questions

You reply “Confirmed, proceed” or correct it

Only then allow code

🔁 Optional (Stricter Version for Bug Fixes)

If you want extra safety, use this variant:

If the task is a bug fix:
- Identify root cause first
- Propose fix strategy
- WAIT for approval
- Then implement

🎯 Why This Works

Prevents Claude from jumping into code

Avoids architecture drift

Forces clarity before action

Matches how a real tech lead works

If you want, next I can:

Create a standard prompt template per Jira issue

Create a “no-architecture-change” guard prompt

Create a review-only prompt

Just tell me 👍

for this whole chat thread , cna you give me .md file or anything, so i just add in chat thread , so we can start and you remberr everthing , becasue if this is long  chat , then momory is broken

Absolutely 👍
This is a very good instinct — long threads do lose context over time.

Below is a single, clean .md file you can paste at the start of any new chat (Claude / ChatGPT / RovoDev).
It rehydrates 100% of the important context, rules, architecture, and current status so work can continue safely.

📄 PROJECT_CONTEXT.md

Superhuman for QuickBooks — Frontend Architecture & Status

1. Project Overview

Project: Superhuman for QuickBooks
Frontend Stack:

React 18

Vite

TypeScript

React Query (@tanstack/react-query)

Zustand (UI-only state)

IndexedDB (Dexie.js)

Tailwind + shadcn/ui

Goal:
Build a Superhuman-like, keyboard-first, offline-capable frontend for QuickBooks data.

2. Team Responsibilities

My Role: Frontend Developer / Acting TL

Scope: Frontend ONLY

Backend: Handled by another team member

Backend APIs: NOT available yet

⚠️ Important:
Do NOT assume backend implementation details.
If APIs are needed, define TypeScript interfaces only.

3. Architectural Principles (NON-NEGOTIABLE)
✅ Data Architecture

dataService.ts is the SINGLE entry point for all data

3-tier cache:

Memory cache (LRU, <5ms)

IndexedDB (Dexie, 10–30ms)

API client (mock for now)

✅ IndexedDB Rules

IndexedDB is a CACHE, not a source of truth

Backend API will be the source of truth later

IndexedDB supports:

Offline reads

Optimistic writes

Sync queue

✅ Mock Data Rules

Mock data is allowed ONLY in apiClient.ts

UI components must NEVER import mock data

UI may import types only

✅ UI Rules

Forms are presentational

Pages own mutations

Hooks call dataService

UI → Hooks → dataService → cache/API

❌ Forbidden

Changing architecture without approval

Adding new abstractions casually

UI components calling services directly

Defensive UI hacks for data bugs

4. Completed Work (Issue #1 Series)
✅ Issue 1.1 — Data Layer Design (NO CODE)

Folder structure defined

Read / Write flows documented

Definition of Done agreed

✅ Issue 1.2 — Core Services (NO UI TOUCH)

Implemented:

dataService.ts

apiClient.ts (mock adapter only)

cacheManager.ts

indexedDB.ts (Dexie + syncQueue)

No UI changes.

✅ Issue 1.3 — React Query Hooks (NO UI TOUCH)

Created hooks:

useInvoices

useBills

useTransactions

useJournalEntries

Hooks:

Call dataService only

Correct query keys

Proper staleTime / gcTime

⚠️ Issue 1.4 — UI Detachment from Mock Data (IN PROGRESS)

Goal:

Pages use hooks instead of mock data

Forms trigger mutations

Optimistic updates + Undo supported

Current Bugs Identified:

❌ Duplicate invoice created on Save & Close

❌ App crash after Save due to incomplete optimistic invoice shape
(InvoiceRow.tsx → undefined.icon)

Important:
These are UI wiring bugs, NOT architecture problems.

5. Current App Wiring (Verified)
Providers Order (Correct)
ThemeProvider
└─ ConnectionProvider
   └─ KeyboardProvider
      └─ UndoProvider
         └─ QueryClientProvider
            └─ App

React Query

QueryClientProvider exists

Single global client

No issues here

6. Current Fix Strategy (APPROVED)
For Issue #1.4 Bug Fixes:

Fix duplicate creation logic

Fix optimistic invoice object shape

❌ Do NOT touch:

dataService

apiClient

indexedDB

hooks

InvoiceRow component

A strict fix-only prompt is used for Claude.

7. How AI Should Work on This Project
Standard Instruction (MANDATORY)

You are a senior engineer.
First understand requirements, summarize them, ask clarifying questions.
Do NOT write code until explicitly approved.

Bug Fix Rule

Identify root cause first

Propose fix

Wait for approval

Then implement

8. What to Ask Before Writing Any Code

If you are about to work on a new issue, ask:

Which Issue number?

Allowed files to change?

Is architecture frozen?

Is this design, fix, or implementation?

9. Current Status Summary
Area	Status
Architecture	✅ Final
Core Services	✅ Done
Hooks	✅ Done
UI Wiring	⚠️ In progress
Blocking Bugs	❌ Present
Ready for Next Feature	❌ Not yet
10. Instruction to AI (IMPORTANT)

Treat this document as the source of truth.
Do NOT re-design architecture.
Do NOT assume missing backend.
If anything is unclear — ask questions.