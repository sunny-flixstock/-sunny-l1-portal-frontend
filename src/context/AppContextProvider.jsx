import { useMemo, useReducer } from 'react'
import { AppContext, appReducer, initialState } from './appContext.js'

export function AppContextProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const value = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
