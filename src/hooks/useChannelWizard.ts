import { useState, useCallback, useEffect } from 'react'

interface WizardState {
  step: 1 | 2 | 3
  gameName: string
  channelName: string
  description: string
  memberLimit: number
  bitrate: number
  region: string
  guildId: string
  guildName: string
  createCategory: boolean
  createTextChannel: boolean
  maxAge: number
  maxUses: number
}

const STORAGE_KEY = 'voicedrop:wizard'

const DEFAULT_BITRATES = [
  { label: '64 kbps', value: 64000 },
  { label: '96 kbps', value: 96000 },
  { label: '128 kbps', value: 128000 },
]

const DEFAULT_MAX_AGES = [
  { label: 'Never', value: 0 },
  { label: '30 minutes', value: 1800 },
  { label: '1 hour', value: 3600 },
  { label: '6 hours', value: 21600 },
  { label: '12 hours', value: 43200 },
  { label: '1 day', value: 86400 },
  { label: '7 days', value: 604800 },
]

const DEFAULT_MAX_USES = [
  { label: 'No limit', value: 0 },
  { label: '1 use', value: 1 },
  { label: '5 uses', value: 5 },
  { label: '10 uses', value: 10 },
  { label: '25 uses', value: 25 },
  { label: '50 uses', value: 50 },
  { label: '100 uses', value: 100 },
]

const DEFAULT_REGIONS = [
  { label: 'Auto', value: '' },
  { label: 'US East', value: 'us-east' },
  { label: 'US West', value: 'us-west' },
  { label: 'US Central', value: 'us-central' },
  { label: 'Europe West', value: 'europe-west' },
  { label: 'Europe Central', value: 'europe-central' },
  { label: 'Singapore', value: 'singapore' },
  { label: 'Sydney', value: 'sydney' },
  { label: 'Japan', value: 'japan' },
]

const initialState: WizardState = {
  step: 1,
  gameName: '',
  channelName: '',
  description: '',
  memberLimit: 0,
  bitrate: 64000,
  region: '',
  guildId: '',
  guildName: '',
  createCategory: false,
  createTextChannel: false,
  maxAge: 86400,
  maxUses: 0,
}

function loadStoredState(): WizardState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<WizardState>
    return { ...initialState, ...parsed }
  } catch {
    return initialState
  }
}

function saveState(state: WizardState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function useChannelWizard() {
  const [state, setState] = useState<WizardState>(loadStoredState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const updateField = useCallback((field: string, value: string | number | boolean) => {
    setState((prev) => ({ ...prev, [field]: value }))
  }, [])

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.step < 3) {
        return { ...prev, step: (prev.step + 1) as WizardState['step'] }
      }
      return prev
    })
  }, [])

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (prev.step > 1) {
        return { ...prev, step: (prev.step - 1) as WizardState['step'] }
      }
      return prev
    })
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    state,
    updateField,
    nextStep,
    prevStep,
    reset,
    DEFAULT_BITRATES,
    DEFAULT_REGIONS,
    DEFAULT_MAX_AGES,
    DEFAULT_MAX_USES,
  }
}
