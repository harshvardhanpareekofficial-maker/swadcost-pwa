import { Layout } from '../components/Layout'
import { CardButton } from '../components/CardButton'
import { MakerNote } from '../components/Footer'
import { FabricStage } from '../components/FabricStage'
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
      title="What are we weaving today?"
      subtitle="A new quality starts with a clear cost. Choose your construction and build your next mill sheet."
      onLogout={onLogout}
    >
      <div className="construction-banner"><div><h2>A new weave.<br/><em>A clear beginning.</em></h2><p>Start with your yarn construction. Every detail has its place.</p></div><FabricStage compact/></div>
      <div className="job-setup">
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
      <div className="home-choices space-y-2.5 sm:space-y-3">
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
      </div><MakerNote className="mt-8" />
    </Layout>
  )
}
