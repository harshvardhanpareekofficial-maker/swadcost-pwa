import { useCallback, useMemo, useState } from 'react'
import { isAuthenticated, logout } from './lib/auth'
import { calculateMulti, calculateSingle, type CostBreakdown } from './lib/costing'
import { emptyMulti, emptySingle, type CostMode, type InputMethod } from './lib/types'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { InputMethodPage } from './pages/InputMethodPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { ResultsPage } from './pages/ResultsPage'

type Screen = 'login' | 'home' | 'method' | 'calc' | 'results'

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [screen, setScreen] = useState<Screen>(() => (isAuthenticated() ? 'home' : 'login'))
  const [fabricName, setFabricName] = useState('')
  const [mode, setMode] = useState<CostMode | null>(null)
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null)
  const [single, setSingle] = useState(emptySingle)
  const [multi, setMulti] = useState(emptyMulti)
  const [result, setResult] = useState<CostBreakdown | null>(null)
  const [calcError, setCalcError] = useState<string | null>(null)

  const modeLabel = useMemo(
    () => (mode === 'single' ? 'Single Warp' : mode === 'multi' ? 'Multiple Warp / Weft' : ''),
    [mode],
  )

  const handleLogout = useCallback(() => {
    logout()
    setAuthed(false)
    setScreen('login')
    setMode(null)
    setInputMethod(null)
    setResult(null)
  }, [])

  const handleLogin = useCallback(() => {
    setAuthed(true)
    setScreen('home')
  }, [])

  const resetJob = useCallback(() => {
    setFabricName('')
    setMode(null)
    setInputMethod(null)
    setSingle(emptySingle())
    setMulti(emptyMulti())
    setResult(null)
    setCalcError(null)
    setScreen('home')
  }, [])

  if (!authed || screen === 'login') {
    return <LoginPage onSuccess={handleLogin} />
  }

  if (screen === 'home') {
    return (
      <HomePage
        fabricName={fabricName}
        onFabricName={setFabricName}
        onLogout={handleLogout}
        onChooseMode={(m) => {
          setMode(m)
          setScreen('method')
        }}
      />
    )
  }

  if (screen === 'method' && mode) {
    return (
      <InputMethodPage
        fabricName={fabricName}
        modeLabel={modeLabel}
        onBack={() => setScreen('home')}
        onChoose={(im) => {
          setInputMethod(im)
          setScreen('calc')
        }}
      />
    )
  }

  if (screen === 'calc' && mode && inputMethod) {
    return (
      <>
        <CalculatorPage
          fabricName={fabricName}
          mode={mode}
          inputMethod={inputMethod}
          single={single}
          multi={multi}
          onChangeSingle={setSingle}
          onChangeMulti={setMulti}
          onBack={() => setScreen('method')}
          onCalculate={() => {
            try {
              setCalcError(null)
              const r = mode === 'single' ? calculateSingle(single) : calculateMulti(multi)
              setResult(r)
              setScreen('results')
            } catch (e) {
              setCalcError(e instanceof Error ? e.message : 'Calculation failed')
            }
          }}
        />
        {calcError ? (
          <p className="fixed bottom-20 left-1/2 z-50 w-[min(92%,24rem)] -translate-x-1/2 rounded-xl bg-red-900/90 px-4 py-3 text-center text-sm text-red-100">
            {calcError}
          </p>
        ) : null}
      </>
    )
  }

  if (screen === 'results' && mode && result) {
    return (
      <ResultsPage
        fabricName={fabricName}
        mode={mode}
        single={single}
        multi={multi}
        result={result}
        onChangeSingle={setSingle}
        onChangeMulti={setMulti}
        onResult={setResult}
        onHome={resetJob}
        onBackEdit={() => setScreen('calc')}
      />
    )
  }

  return (
    <HomePage
      fabricName={fabricName}
      onFabricName={setFabricName}
      onLogout={handleLogout}
      onChooseMode={(m) => {
        setMode(m)
        setScreen('method')
      }}
    />
  )
}
