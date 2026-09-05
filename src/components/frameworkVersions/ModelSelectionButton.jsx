import { SettingOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Popover, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useMemo, useState } from 'react'

const { Text } = Typography

function formatModelLabel(providers, provider, model) {
  if (!provider || !model) return 'Select model'
  const providerLabel = providers.find((row) => row.value === provider)?.label ?? provider
  return `${providerLabel} · ${model}`
}

export function ModelSelectionButton({
  providers = [],
  catalog = {},
  provider,
  model,
  onChange,
  onApplyToAll,
  disabled,
  ariaLabel = 'Select model',
}) {
  const [open, setOpen] = useState(false)
  const [draftProvider, setDraftProvider] = useState(provider)
  const [draftModel, setDraftModel] = useState(model)

  useEffect(() => {
    if (open) {
      setDraftProvider(provider)
      setDraftModel(model)
    }
  }, [open, provider, model])

  const modelOptions = useMemo(() => {
    if (!draftProvider || draftProvider === 'custom') return []
    return (catalog[draftProvider] ?? []).map((entry) => ({
      value: entry.value,
      label: entry.value,
      title: entry.note,
    }))
  }, [catalog, draftProvider])

  const isCustom = draftProvider === 'custom'

  function handleApply() {
    if (!draftProvider || !draftModel?.trim()) return
    onChange?.(draftProvider, draftModel.trim())
    setOpen(false)
  }

  function handleApplyToAll() {
    if (!draftProvider || !draftModel?.trim()) return
    onApplyToAll?.(draftProvider, draftModel.trim())
    setOpen(false)
  }

  const canApply = Boolean(draftProvider && draftModel?.trim())

  const content = (
    <Flex vertical gap={12} style={{ width: 320 }}>
      <div>
        <Text type="secondary">Provider</Text>
        <Select
          style={{ width: '100%', marginTop: 4 }}
          placeholder="Select provider…"
          value={draftProvider}
          onChange={(value) => {
            setDraftProvider(value)
            setDraftModel(undefined)
          }}
          options={providers.map((row) => ({
            value: row.value,
            label: row.label,
          }))}
        />
      </div>
      <div>
        <Text type="secondary">Model</Text>
        {isCustom ? (
          <Input
            style={{ marginTop: 4 }}
            placeholder="Enter custom model id…"
            value={draftModel}
            onChange={(event) => setDraftModel(event.target.value)}
          />
        ) : (
          <Select
            style={{ width: '100%', marginTop: 4 }}
            placeholder={draftProvider ? 'Select model…' : 'Select a provider first'}
            disabled={!draftProvider}
            value={draftModel}
            onChange={setDraftModel}
            showSearch
            optionFilterProp="label"
            options={modelOptions}
            optionRender={(option) => (
              <Flex vertical gap={2}>
                <span>{option.label}</span>
                {option.data.title ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {option.data.title}
                  </Text>
                ) : null}
              </Flex>
            )}
          />
        )}
      </div>
      <Flex justify="space-between" gap={8}>
        {onApplyToAll ? (
          <Button size="small" disabled={!canApply} onClick={handleApplyToAll}>
            Apply to all
          </Button>
        ) : (
          <span />
        )}
        <Flex gap={8}>
          <Button size="small" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="small" type="primary" disabled={!canApply} onClick={handleApply}>
            Apply
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomRight"
      content={content}
    >
      <Button
        size="small"
        icon={<SettingOutlined />}
        disabled={disabled}
        aria-label={ariaLabel}
        type={provider && model ? 'default' : 'dashed'}
      >
        {formatModelLabel(providers, provider, model)}
      </Button>
    </Popover>
  )
}
