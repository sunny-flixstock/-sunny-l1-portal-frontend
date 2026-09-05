import { Card } from 'antd'
import { InputSetWizard } from '../components/inputSets/InputSetWizard.jsx'

export function CreateInputSetPage() {
  return (
    <Card style={{ height: '100%' }}>
      <InputSetWizard mode="create" />
    </Card>
  )
}
