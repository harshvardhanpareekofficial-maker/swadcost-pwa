import { Layout } from '../components/Layout'
import { CardButton } from '../components/CardButton'
import { Stepper } from '../components/Stepper'
import { PrimaryButton } from '../components/PrimaryButton'
import type { CostMode } from '../lib/types'

type Props = {
  fabricName: string
  onFabricName: (v: string) => void
  onChooseMode: (mode: CostMode) => void
  onLogout: () => void
}

export function HomePage({ fabricName, onFabricName, onChooseMode, onLogout }: Props) {
  return (
    <Layout
      title="New costing"
      subtitle="Name the fabric, then choose a mode"
      showLogout
      onLogout={onLogout}
    >
      <Stepper step={0} />
      <label className="mb-5 block rounded-2xl border border-white/10 bg-card/80 px-3 py-3">
        <span className="mb-1 block text-sm font-medium text-cream">Fabric / job name</span>
        <input
          value={fabricName}
          onChange={(e) => onFabricName(e.target.value)}
          placeholder="e.g. Grey 40s 72×68"
          className="w-full rounded-xl border border-white/10 bg-ink/50 px-3 py-3 text-cream"
        />
      </label>
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">Costing mode</h2>
        <CardButton
          title="Single Warp"
          description="One warp yarn + one weft yarn — classic Costing.aspx flow."
          icon="糸"
          onClick={() => onChooseMode('single')}
        />
        <CardButton
          title="Multiple Warp / Weft"
          description="Up to 3 warp and 3 weft yarns with % split — MultiCosting.aspx."
          icon="織"
          onClick={() => onChooseMode('multi')}
        />
      </div>
      <div className="mt-6">
        <PrimaryButton variant="ghost" onClick={onLogout}>
          Switch account
        </PrimaryButton>
      </div>
    </Layout>
  )
}
