import { Layout } from '../components/Layout'
import { CardButton } from '../components/CardButton'
import { Stepper } from '../components/Stepper'
import { IconKeys, IconMic } from '../components/Icons'
import { SectionLabel } from '../components/SectionLabel'
import type { InputMethod } from '../lib/types'

type Props = {
  fabricName: string
  modeLabel: string
  onChoose: (m: InputMethod) => void
  onBack: () => void
  onLogout: () => void
}

export function InputMethodPage({ fabricName, modeLabel, onChoose, onBack, onLogout }: Props) {
  return (
    <Layout
      eyebrow="Input"
      title="How will you enter values?"
      subtitle={`${fabricName || 'Untitled'} · ${modeLabel}`}
      onBack={onBack}
      onLogout={onLogout}
    >
      <Stepper step={1} />
      <div className="space-y-2.5 sm:space-y-3">
        <SectionLabel>Speak or type</SectionLabel>
        <CardButton
          title="Speak"
          description="Chrome Web Speech API. Say one mill number per field. You can still type to correct."
          icon={<IconMic />}
          onClick={() => onChoose('speak')}
        />
        <CardButton
          title="Type"
          description="Tap fields and enter numbers on the keypad. Microphone stays off."
          icon={<IconKeys />}
          onClick={() => onChoose('type')}
        />
      </div>
    </Layout>
  )
}
