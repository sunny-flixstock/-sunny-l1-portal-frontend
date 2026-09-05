import { Card, Typography } from 'antd'
import { FrameworkVocabTable } from '../components/frameworkVocab/FrameworkVocabTable.jsx'
import { LABELS } from '../constants/brandAiStylistLabels.js'

const { Title } = Typography

export function FrameworkVocabPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        {LABELS.stylistVocab}
      </Title>
      <FrameworkVocabTable />
    </Card>
  )
}
