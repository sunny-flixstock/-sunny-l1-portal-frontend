import { Descriptions, Flex, Image, List, Tag, Typography } from 'antd'
import { EXAMPLE_IMAGE_TYPE_LABELS } from '../../utils/exampleImageConstants.js'
import {
  INPUT_SET_STATUS_COLORS,
  INPUT_SET_STATUS_LABELS,
} from '../../utils/inputSetConstants.js'
import {
  RULE_POLARITY_LABELS,
  RULE_PRIORITY_LABELS,
  RULE_SOURCE_LABELS,
  DOMAIN_LABELS,
} from '../../utils/ruleConstants.js'

const { Text, Title } = Typography

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function getPreviewUrl(image) {
  return image?.image?.thumbPath?.url || image?.image?.imagePath?.url
}

function RuleSummaryItem({ rule }) {
  return (
    <List.Item>
      <Flex vertical gap={4} style={{ width: '100%' }}>
        <Text>{rule.ruleText}</Text>
        <Flex wrap gap={4}>
          <Tag>{DOMAIN_LABELS[rule.ruleType] ?? rule.ruleType}</Tag>
          <Tag>{RULE_POLARITY_LABELS[rule.polarity] ?? rule.polarity}</Tag>
          <Tag>{RULE_PRIORITY_LABELS[rule.priority] ?? rule.priority}</Tag>
          <Tag>{RULE_SOURCE_LABELS[rule.source] ?? rule.source}</Tag>
          {(rule.tags ?? []).map((tag) => (
            <Tag key={tag} color="cyan">
              {tag}
            </Tag>
          ))}
        </Flex>
      </Flex>
    </List.Item>
  )
}

function ExampleSummaryItem({ image }) {
  const previewUrl = getPreviewUrl(image)
  const label = image.originalFileName || image.storageFileName || image._id

  return (
    <List.Item>
      <Flex align="center" gap={12} style={{ width: '100%' }}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={label}
            width={56}
            height={56}
            style={{ objectFit: 'cover', borderRadius: 6 }}
            preview
          />
        ) : (
          <div className="input-set-summary__thumb-placeholder" />
        )}
        <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
          <Text ellipsis>{label}</Text>
          <Tag color={image.type === 'good' ? 'success' : 'error'}>
            {EXAMPLE_IMAGE_TYPE_LABELS[image.type] ?? image.type}
          </Tag>
        </Flex>
      </Flex>
    </List.Item>
  )
}

export function InputSetSummary({ draft, detail, showActions, actions }) {
  const data = detail ?? {
    name: draft.name,
    client: draft.client,
    createdBy: draft.createdBy,
    status: draft.status ?? 'draft',
    createdAt: null,
    rules: draft.rules ?? [],
    examples: draft.examples ?? [],
  }

  const rules = data.rules ?? []
  const examples = data.examples ?? [...(data.goodExamples ?? []), ...(data.badExamples ?? [])]

  return (
    <div className="input-set-summary">
      <Flex justify="space-between" align="flex-start" wrap gap={12}>
        <Title level={4} style={{ margin: 0 }}>
          {data.name}
        </Title>
        {showActions ? actions : null}
      </Flex>

      <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="Status">
          <Tag color={INPUT_SET_STATUS_COLORS[data.status] ?? 'default'}>
            {INPUT_SET_STATUS_LABELS[data.status] ?? data.status ?? '—'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Client">{data.client}</Descriptions.Item>
        <Descriptions.Item label="Created by">{data.createdBy || '—'}</Descriptions.Item>
        {data.createdAt ? (
          <Descriptions.Item label="Created on">{formatDate(data.createdAt)}</Descriptions.Item>
        ) : null}
        <Descriptions.Item label="Rules">{rules.length}</Descriptions.Item>
        <Descriptions.Item label="Examples">{examples.length}</Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>
        Rules ({rules.length})
      </Title>
      {rules.length === 0 ? (
        <Text type="secondary">No rules selected</Text>
      ) : (
        <List
          size="small"
          bordered
          dataSource={rules}
          renderItem={(rule) => <RuleSummaryItem rule={rule} />}
        />
      )}

      <Title level={5} style={{ marginTop: 24 }}>
        Examples ({examples.length})
      </Title>
      {examples.length === 0 ? (
        <Text type="secondary">No examples selected</Text>
      ) : (
        <List
          size="small"
          bordered
          dataSource={examples}
          renderItem={(image) => <ExampleSummaryItem image={image} />}
        />
      )}
    </div>
  )
}
