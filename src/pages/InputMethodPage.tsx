import { Layout } from '../components/Layout'
import { CardButton } from '../components/CardButton'
import { Stepper } from '../components/Stepper'
import { PrimaryButton } from '../components/PrimaryButton'
import { IconKeys, IconMic } from '../components/Icons'
import type { InputMethod } from '../lib/types'

type Props = {
  fabricName: string
  modeLabel: string
  onChoose: (m: InputMethod) => void
  onBack: () => void
}

export function InputMethodPage({ fabricName, modeLabel, onChoose, onBack }: Props) {
  return (
    <Layout title="How will you enter values?" subtitle={`${fabricName || 'Untitled'} · ${modeLabel}`}>
      <Stepper step={1} />
      <div className="space-y-3">
        <CardButton
          title="Speak"
          description="Use the microphone. When a number is heard, the current field fills and advances."
          icon={<IconMic />}
          onClick={() => onChoose('speak')}
        />
        <CardButton
          title="Type"
          description="Tap fields and enter numbers on the keypad. Best for precise edits."
          icon={<IconKeys />}
          onClick={() => onChoose('type')}
        />
      </div>
      <div className="mt-8">
        <PrimaryButton variant="secondary" onClick={onBack}>
          Back
        </PrimaryButton>
      </div>
    </Layout>
  )
}
