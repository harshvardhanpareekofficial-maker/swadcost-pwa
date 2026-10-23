export function PageControls({ page, count, onChange, label = 'Page' }: { page: number; count: number; onChange: (n: number) => void; label?: string }) {
  return <nav className="page-controls" aria-label={`${label} navigation`}><button type="button" disabled={page===0} onClick={()=>onChange(page-1)}>← Previous</button><span aria-live="polite">{label} {page+1} / {count}</span><button type="button" disabled={page===count-1} onClick={()=>onChange(page+1)}>Next →</button></nav>
}
