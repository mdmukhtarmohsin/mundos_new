import { createContext } from 'react'

export const ApiKeyContext = createContext<{
  apiKey: string | null
  setApiKey: (key: string | null) => void
}>({ apiKey: null, setApiKey: () => {} })

