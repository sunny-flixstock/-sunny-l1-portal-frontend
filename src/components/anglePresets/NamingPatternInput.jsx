import { InfoCircleOutlined } from '@ant-design/icons'
import { Alert, Flex, Input, Popover, Typography } from 'antd'
import {
  NAMING_PATTERN_EXAMPLES,
  NAMING_PATTERN_HELP,
} from '../../utils/angleTechnicalSpecConstants.js'

const { Text } = Typography

export function NamingPatternInput({ value, onChange, specLabel }) {
  const helpContent = (
    <Flex vertical gap={8} style={{ maxWidth: 360 }}>
      <Text strong>Template placeholders</Text>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {NAMING_PATTERN_HELP.map((line) => (
          <li key={line}>
            <Text style={{ fontSize: 13 }}>{line}</Text>
          </li>
        ))}
      </ul>
      <Text strong>Examples</Text>
      {NAMING_PATTERN_EXAMPLES.map((example) => (
        <Text key={example} code style={{ display: 'block', fontSize: 12 }}>
          {example}
        </Text>
      ))}
      {specLabel && (
        <Alert
          type="info"
          showIcon={false}
          message={
            <Text style={{ fontSize: 12 }}>
              <Text code>${'{'}</Text>
              <Text code>ext</Text>
              <Text code>{'}'}</Text> resolves to the format from &quot;{specLabel}&quot;
            </Text>
          }
        />
      )}
    </Flex>
  )

  return (
    <Flex vertical gap={4} style={{ width: '100%' }}>
      <Flex align="center" gap={6}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Output file name
        </Text>
        <Popover content={helpContent} title="Naming pattern" trigger="click">
          <InfoCircleOutlined style={{ color: '#64748b', cursor: 'pointer' }} />
        </Popover>
      </Flex>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="${barcode}_front.${ext}"
        style={{ fontFamily: 'monospace' }}
        aria-label="Naming pattern"
      />
    </Flex>
  )
}
