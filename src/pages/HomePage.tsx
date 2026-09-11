import { Layout } from '../components/Layout'
import { CardButton } from '../components/CardButton'
import { Stepper } from '../components/Stepper'
import { IconWarp, IconWeave } from '../components/Icons'
import { SectionLabel } from '../components/SectionLabel'
import { studioFieldClass, studioLabelClass } from '../components/studio'
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
      eyebrow="Costing studio"
      title="New grey fabric costing"
      subtitle="Name the fabric, then choose single or multiple warp and weft yarns for powerloom textile costing."
      onLogout={onLogout}
    >
      <Stepper step={0} />
      <label className="mb-4 block sm:mb-6">
        <span className={`mb-1.5 block ${studioLabelClass}`}>Fabric / job name</span>
        <input
          value={fabricName}
          onChange={(e) => onFabricName(e.target.value)}
          placeholder="e.g. Grey 40s 72×68"
          className={studioFieldClass}
        />
        {!fabricName.trim() ? (
          <p className="mt-2 text-xs leading-relaxed text-plum/55">
            Optional — leave blank to cost as Untitled, or name the quality before you begin.
          </p>
        ) : null}
      </label>
      <div className="space-y-2.5 sm:space-y-3">
        <SectionLabel>Costing mode</SectionLabel>
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
    </Layout>
  )
}
