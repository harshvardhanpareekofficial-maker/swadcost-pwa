export function LoomVisual({ compact = false, tone }: { compact?: boolean; tone?: string }) {
  return <div className={`loom-visual ${compact ? 'loom-compact' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 560 420" fill="none">
      <defs><linearGradient id="thread-blue" x1="100" y1="70" x2="430" y2="350" gradientUnits="userSpaceOnUse"><stop stopColor={tone || "#dce6bd"}/><stop offset="1" stopColor="#91ad91"/></linearGradient><linearGradient id="thread-white" x1="0" y1="0" x2="365" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#f1ead6"/><stop offset="1" stopColor="#c9d8b7"/></linearGradient></defs>
      <g transform="translate(95 40) rotate(-12 185 175)">
        {Array.from({length:12},(_,i)=><path key={`v${i}`} d={`M${25+i*28} 0v340`} stroke="url(#thread-blue)" strokeWidth="19"/>)}
        {Array.from({length:11},(_,r)=><g key={r}><path d={`M0 ${25+r*28}h365`} stroke="url(#thread-white)" strokeWidth="19"/>{Array.from({length:12},(_,c)=>(r+c)%2===0?<path key={c} d={`M${25+c*28} ${11+r*28}v28`} stroke="url(#thread-blue)" strokeWidth="19"/>:null)}</g>)}
        <path d="M249 0v340" stroke="#c4ec77" strokeWidth="19"/>
        {Array.from({length:6},(_,i)=><path key={i} d={`M237 ${25+i*56}h24`} stroke="#f1ead6" strokeWidth="19"/>)}
      </g>
      <path d="M38 337v35h135M393 48h110v38" stroke="#9fbab0" strokeOpacity=".6"/>
      <text x="40" y="396" fill="#b5cac0" fontSize="10" letterSpacing="3">WARP × WEFT</text><text x="413" y="33" fill="#b5cac0" fontSize="10" letterSpacing="2">THE FABRIC</text>
    </svg>
  </div>
}
