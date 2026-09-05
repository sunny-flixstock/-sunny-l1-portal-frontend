import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Empty, Flex, Input, Tag, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useMemo, useState } from 'react'
import { useRuleTags } from '../../hooks/useRules.js'
import {
  RULE_POLARITIES,
  RULE_POLARITY_LABELS,
  RULE_PRIORITIES,
  RULE_PRIORITY_LABELS,
  RULE_SOURCES,
  RULE_SOURCE_LABELS,
  DOMAINS,
  DOMAIN_LABELS,
  toSelectOptions,
} from '../../utils/ruleConstants.js'
import { EMPTY_RULE_FILTERS, filterRules } from '../../utils/ruleFilters.js'

const { Text } = Typography

const priorityColors = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

function RuleMetaTags({ rule }) {
  return (
    <Flex wrap gap={4} className="rule-selection-panel__tags">
      <Tag color="processing">{DOMAIN_LABELS[rule.ruleType] ?? rule.ruleType}</Tag>
      <Tag>{RULE_POLARITY_LABELS[rule.polarity] ?? rule.polarity}</Tag>
      <Tag color={priorityColors[rule.priority]}>
        {RULE_PRIORITY_LABELS[rule.priority] ?? rule.priority}
      </Tag>
      <Tag color="default">{RULE_SOURCE_LABELS[rule.source] ?? rule.source}</Tag>
      {(rule.tags ?? []).map((tag) => (
        <Tag key={tag} color="cyan">
          {tag}
        </Tag>
      ))}
    </Flex>
  )
}

function RuleListItem({ rule, actionIcon, actionLabel, onAction, disabled }) {
  return (
    <div className="rule-selection-panel__item">
      <div className="rule-selection-panel__item-body">
        <Text className="rule-selection-panel__rule-text">{rule.ruleText}</Text>
        <RuleMetaTags rule={rule} />
        {rule.createdBy ? (
          <Text type="secondary" className="rule-selection-panel__created-by">
            Created by {rule.createdBy}
          </Text>
        ) : null}
      </div>
      <Button
        type="text"
        size="small"
        icon={actionIcon}
        aria-label={actionLabel}
        disabled={disabled}
        onClick={() => onAction(rule._id)}
      />
    </div>
  )
}

function RuleListPane({ title, countLabel, rules, emptyDescription, actionIcon, actionLabel, onAction }) {
  return (
    <div className="rule-selection-panel__pane">
      <Flex justify="space-between" align="center" className="rule-selection-panel__pane-header">
        <Text strong>{title}</Text>
        <Text type="secondary">{countLabel}</Text>
      </Flex>
      <div className="rule-selection-panel__list">
        {rules.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
        ) : (
          rules.map((rule) => (
            <RuleListItem
              key={rule._id}
              rule={rule}
              actionIcon={actionIcon}
              actionLabel={actionLabel}
              onAction={onAction}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function RuleSelectionPanel({ rules, selectedIds, onChange, client }) {
  const [filters, setFilters] = useState(EMPTY_RULE_FILTERS)
  const { data: tagOptions = [] } = useRuleTags(client || undefined)

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const filteredRules = useMemo(() => filterRules(rules, filters), [rules, filters])

  const availableRules = useMemo(
    () => filteredRules.filter((rule) => !selectedIdSet.has(rule._id)),
    [filteredRules, selectedIdSet]
  )

  const selectedRules = useMemo(() => {
    const byId = new Map(rules.map((rule) => [rule._id, rule]))
    return selectedIds.map((id) => byId.get(id)).filter(Boolean)
  }, [rules, selectedIds])

  const filteredSelectedRules = useMemo(
    () => filterRules(selectedRules, filters),
    [selectedRules, filters]
  )

  const hasActiveFilters =
    Boolean(filters.search?.trim()) ||
    filters.domains.length > 0 ||
    filters.polarities.length > 0 ||
    filters.priorities.length > 0 ||
    filters.sources.length > 0 ||
    filters.tags.length > 0

  function updateFilters(patch) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function addRule(id) {
    if (selectedIdSet.has(id)) return
    onChange([...selectedIds, id])
  }

  function removeRule(id) {
    onChange(selectedIds.filter((existing) => existing !== id))
  }

  function addAllFiltered() {
    const next = new Set(selectedIds)
    for (const rule of availableRules) {
      next.add(rule._id)
    }
    onChange([...next])
  }

  function clearSelection() {
    onChange([])
  }

  function clearFilters() {
    setFilters(EMPTY_RULE_FILTERS)
  }

  return (
    <Flex vertical gap="middle" className="rule-selection-panel">
      <Text type="secondary">
        Filter by domain, polarity, priority, source, or tags, then add rules to the input set. Client:{' '}
        <strong>{client}</strong>
      </Text>

      <Flex wrap="wrap" gap="middle" align="flex-end" className="rule-selection-panel__filters">
        <Input.Search
          allowClear
          placeholder="Search rule text…"
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          style={{ width: 220 }}
          aria-label="Search rules"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Domains"
          value={filters.domains}
          onChange={(value) => updateFilters({ domains: value })}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(DOMAINS, DOMAIN_LABELS)}
          aria-label="Domain filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Polarities"
          value={filters.polarities}
          onChange={(value) => updateFilters({ polarities: value })}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
          options={toSelectOptions(RULE_POLARITIES, RULE_POLARITY_LABELS)}
          aria-label="Polarity filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Priorities"
          value={filters.priorities}
          onChange={(value) => updateFilters({ priorities: value })}
          style={{ minWidth: 140 }}
          maxTagCount="responsive"
          options={toSelectOptions(RULE_PRIORITIES, RULE_PRIORITY_LABELS)}
          aria-label="Priority filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Sources"
          value={filters.sources}
          onChange={(value) => updateFilters({ sources: value })}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
          options={toSelectOptions(RULE_SOURCES, RULE_SOURCE_LABELS)}
          aria-label="Source filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Tags"
          value={filters.tags}
          onChange={(value) => updateFilters({ tags: value })}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
          options={tagOptions.map((tag) => ({ value: tag, label: tag }))}
          aria-label="Tags filter"
        />
        {hasActiveFilters ? (
          <Button type="link" onClick={clearFilters} style={{ paddingInline: 0 }}>
            Clear filters
          </Button>
        ) : null}
      </Flex>

      <Flex gap="middle" wrap="wrap" className="rule-selection-panel__bulk">
        <Button
          size="small"
          disabled={availableRules.length === 0}
          onClick={addAllFiltered}
        >
          Add all matching ({availableRules.length})
        </Button>
        <Button
          size="small"
          danger
          disabled={selectedIds.length === 0}
          onClick={clearSelection}
        >
          Clear selection ({selectedIds.length})
        </Button>
      </Flex>

      <div className="rule-selection-panel__panes">
        <RuleListPane
          title="Available"
          countLabel={`${availableRules.length} of ${rules.length - selectedIds.length} not selected`}
          rules={availableRules}
          emptyDescription={
            hasActiveFilters ? 'No rules match the current filters' : 'All rules are selected'
          }
          actionIcon={<PlusOutlined />}
          actionLabel="Add rule"
          onAction={addRule}
        />
        <RuleListPane
          title="Selected"
          countLabel={`${filteredSelectedRules.length} shown · ${selectedIds.length} total`}
          rules={filteredSelectedRules}
          emptyDescription={
            selectedIds.length === 0
              ? 'No rules selected yet'
              : 'No selected rules match the current filters'
          }
          actionIcon={<MinusOutlined />}
          actionLabel="Remove rule"
          onAction={removeRule}
        />
      </div>
    </Flex>
  )
}
