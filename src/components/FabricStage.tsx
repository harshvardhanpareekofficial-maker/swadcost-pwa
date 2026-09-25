import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { LoomVisual } from './LoomVisual'
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}
const ClothCanvas = lazy(() => import('./ClothCanvas'))
const materials = [{ name: 'Natural', color: '#e4d8b6' }, { name: 'Sage', color: '#b1c795' }, { name: 'Slate', color: '#91a9ab' }]
function RotateIcon({ right = false }: { right?: boolean }) { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" style={{ transform: right ? 'scaleX(-1)' : undefined }}><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> }
export function FabricStage({ compact = false }: { compact?: boolean }) {
  const [variant, setVariant] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => { const query = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [rotation, setRotation] = useState(0)
  const [ready, setReady] = useState(false)
  const onReady = useCallback((value: boolean) => setReady(value), [])
  return <div className={`fabric-stage ${compact ? 'fabric-stage-compact' : ''}`}>
    <div className={`cloth-fallback ${ready ? 'cloth-loaded' : ''}`}><LoomVisual tone={materials[variant].color}/></div>
    <SceneBoundary><Suspense fallback={null}><ClothCanvas color={materials[variant].color} paused={paused} rotation={rotation} onReady={onReady}/></Suspense></SceneBoundary>
    <div className="fabric-caption"><span>Fabric study</span><strong>{materials[variant].name} weave</strong><span>{ready ? 'Drag to explore' : 'Illustrative construction'}</span></div>
    <div className="fabric-controls" aria-label="Fabric scene controls">
      <div className="material-options" aria-label="Illustrative fabric color">{materials.map((item, i) => <button key={item.name} type="button" aria-label={`${item.name} fabric`} aria-pressed={variant === i} onClick={() => setVariant(i)}><span style={{ backgroundColor: item.color }}/></button>)}</div>
      {ready ? <div className="scene-actions"><button type="button" onClick={() => setRotation(r => Math.max(-.8, r - .2))} aria-label="Rotate fabric left"><RotateIcon/></button><button type="button" onClick={() => setRotation(r => Math.min(.8, r + .2))} aria-label="Rotate fabric right"><RotateIcon right/></button><button type="button" disabled={reducedMotion} title={reducedMotion ? "Motion reduced by your device preference" : undefined} onClick={() => setPaused(p => !p)} aria-label={reducedMotion ? "Motion reduced by device preference" : paused ? 'Play fabric motion' : 'Pause fabric motion'}>{paused ? <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 8 5-8 5Z" fill="currentColor"/></svg> : <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor"/></svg>}</button></div> : null}
    </div>
  </div>
}
