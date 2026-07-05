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
}

const STORAGE_KEY = 'voicedrop:wizard'

const DEFAULT_BITRATES = [
  { label: '64 kbps', value: 64000 },
  { label: '96 kbps', value: 96000 },
  { label: '128 kbps', value: 128000 },
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

  const updateField = useCallback((field: string, value: string | number) => {
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
  }
}
