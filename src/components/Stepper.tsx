const STEPS = ['Construction', 'Entry method', 'Mill sheet', 'Cost breakdown'] as const
export function Stepper({ step }: { step: 0 | 1 | 2 | 3 }) {
  return <ol className="workflow-progress" aria-label="Costing progress">{STEPS.map((label,i)=><li key={label} className={i===step?'current':i<step?'complete':''} aria-current={i===step?'step':undefined}><span>{i<step?'✓':String(i+1).padStart(2,'0')}</span><span>{label}</span></li>)}</ol>
}
