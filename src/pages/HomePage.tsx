import { Layout } from '../components/Layout'
import { CardButton } from '../components/CardButton'
import { MakerNote } from '../components/Footer'
import { Stepper } from '../components/Stepper'
import { IconWarp, IconWeave } from '../components/Icons'
import { SectionLabel } from '../components/SectionLabel'
import { studioFieldClass, studioLabelClass } from '../components/studio'
import { DALAL_NAME_LABEL } from '../lib/labels'
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
      subtitle="Name the dalal / broker, then choose single or multiple warp and weft yarns for powerloom grey fabric costing — mill-sheet math from Ichalkaranji."
      onLogout={onLogout}
    >
      <Stepper step={0} />
      <label className="mb-4 block sm:mb-6">
        <span className={`mb-1.5 block ${studioLabelClass}`}>{DALAL_NAME_LABEL}</span>
        <input
          value={fabricName}
          onChange={(e) => onFabricName(e.target.value)}
          placeholder="e.g. Ramesh / ABC Agency"
          className={studioFieldClass}
        />
        {!fabricName.trim() ? (
          <p className="mt-2 text-xs leading-relaxed text-plum/55">
            Optional — leave blank to cost as Untitled, or name the dalal / broker before you begin.
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
      <MakerNote className="mt-8" />
    </Layout>
  )
}
