import { Card, Tabs, Typography } from 'antd'
import { AnglePresetsTable } from '../components/anglePresets/AnglePresetsTable.jsx'
import { BaseAnglesTable } from '../components/angles/BaseAnglesTable.jsx'
import { ClientAnglesTable } from '../components/angles/ClientAnglesTable.jsx'

const { Title } = Typography

export function AnglesPage() {
  return (
    <Card>
      <Title level={3} style={{ marginTop: 0 }}>
        Angles
      </Title>

      <Tabs
        items={[
          {
            key: 'base',
            label: 'Base angles',
            children: <BaseAnglesTable />,
          },
          {
            key: 'client',
            label: 'Client angles',
            children: <ClientAnglesTable />,
          },
          {
            key: 'presets',
            label: 'Angle presets',
            children: <AnglePresetsTable />,
          },
        ]}
      />
    </Card>
  )
}
