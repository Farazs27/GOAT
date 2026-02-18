---
phase: 10-hygienist-portal-periodontogram
plan: 02
subsystem: perio-data-entry
tags: [perio, voice-input, clinical-charting]
dependency_graph:
  requires: []
  provides: [extended-probing-panel, voice-perio-input]
  affects: [perio-mode, shared-types]
tech_stack:
  added: [Web Speech API]
  patterns: [collapsible-sections, auto-calculated-fields, voice-parse]
key_files:
  created:
    - apps/web/src/components/odontogram/perio/voice-input.tsx
  modified:
    - apps/web/src/components/odontogram/perio/probing-panel.tsx
    - apps/web/src/components/odontogram/modes/perio-mode.tsx
    - packages/shared-types/src/odontogram.ts
decisions:
  - Extended PerioToothData with optional fields for backward compatibility
  - Collapsible Advanced section to avoid overwhelming the panel
  - Voice input parses nl-NL with "tooth/tand NN: X X X X X X" pattern
metrics:
  duration: 4min
  completed: 2026-02-18
---

# Phase 10 Plan 02: Extended Perio Data Entry & Voice Input Summary

Full periodontal charting panel with suppuration, MGJ, KTW, implant/missing flags, auto-calculated CAL, and Web Speech API voice input for hands-free probing depth entry.

## What Was Done

### Task 1: Extended probing panel with all measurement fields (6f16b91)
- Added suppuration (per-site toggle), mucogingival junction (3 values per side), keratinized tissue width (3 values per side) to PerioToothData type as optional fields
- Added implant and missing tooth-level toggles; missing disables all other inputs
- Added CAL auto-calculation display (probing depth + |gingival margin|) as read-only computed row with cyan styling
- Organized into Basic (always visible) and Advanced (collapsible) sections
- All new fields have fallback defaults for backward compatibility with existing data

### Task 2: Voice input for perio data entry (2d62268)
- Created voice-input.tsx using Web Speech API (webkitSpeechRecognition)
- parsePerioVoiceInput parses "tooth 16: 3 2 4 3 2 3" format extracting FDI number and 6 probing depths
- Shows live interim transcript, success confirmation with parsed values, or error feedback
- Integrated VoiceInputButton into perio mode header toolbar
- On valid result: auto-selects tooth and populates buccal (first 3) and palatal (last 3) probing depths
- Unsupported browsers show disabled mic with tooltip

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript type check passes (tsc --noEmit)
- Build error is pre-existing (missing /billing page) and unrelated to changes
- All new optional fields fall back to defaults when reading old data
