import { parseWorldDocument, type ParseResult } from './worldJson.ts'

export const AUTOSAVE_KEY = 'constructs.autosave.v1'

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

export function writeAutosave(
  json: string,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return
  storage.setItem(AUTOSAVE_KEY, json)
}

export function readAutosave(
  storage: StorageLike | null = defaultStorage(),
): ParseResult | null {
  if (!storage) return null
  const raw = storage.getItem(AUTOSAVE_KEY)
  if (!raw) return null
  const parsed = parseWorldDocument(raw)
  return parsed.ok ? parsed : null
}
