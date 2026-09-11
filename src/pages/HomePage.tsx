import { Layout } from '../components/Layout'
import { CardButton } from '../components/CardButton'
import { Stepper } from '../components/Stepper'
import { PrimaryButton } from '../components/PrimaryButton'
import { IconWarp, IconWeave } from '../components/Icons'
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
      subtitle="Name the fabric, then choose how the yarns are arranged."
      showLogout
      onLogout={onLogout}
    >
      <Stepper step={0} />
      <label className="mb-7 block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">
          Fabric / job name
        </span>
        <input
          value={fabricName}
          onChange={(e) => onFabricName(e.target.value)}
          placeholder="e.g. Grey 40s 72×68"
          className="w-full rounded-[14px] border border-plum/12 bg-paper px-3.5 py-3.5 text-ink placeholder:text-plum/35"
        />
      </label>
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Costing mode</h2>
        <CardButton
          title="Single Warp"
          description="One warp yarn and one weft yarn — the classic mill sheet."
          icon={<IconWarp />}
          onClick={() => onChooseMode('single')}
        />
        <CardButton
          title="Multiple Warp / Weft"
          description="Up to three warp and three weft yarns, split by percentage."
          icon={<IconWeave />}
          onClick={() => onChooseMode('multi')}
        />
      </div>
      <div className="mt-8">
        <PrimaryButton variant="ghost" onClick={onLogout}>
          Switch account
        </PrimaryButton>
      </div>
    </Layout>
  )
}
