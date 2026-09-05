import { Button, Form, Input, Modal, Spin } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import { useCreateRule, useRule, useRuleTags, useUpdateRule } from '../../hooks/useRules.js'
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

const { TextArea } = Input
function ruleToFormValues(rule) {
  if (!rule) {
    return {
      client: undefined,
      ruleType: undefined,
      polarity: undefined,
      ruleText: '',
      priority: undefined,
      source: undefined,
      createdBy: '',
      tags: [],
    }
  }

  return {
    client: rule.client,
    ruleType: rule.ruleType,
    polarity: rule.polarity,
    ruleText: rule.ruleText,
    priority: rule.priority,
    source: rule.source,
    createdBy: rule.createdBy ?? '',
    tags: rule.tags ?? [],
  }
}

export function RuleModal({ ruleId, onClose }) {
  const isEdit = Boolean(ruleId)
  const [form] = Form.useForm()

  const { data: clients = [], isLoading: clientsLoading } = useAllClients()
  const { data: rule, isLoading: ruleLoading } = useRule(ruleId, isEdit)
  const createMutation = useCreateRule()
  const updateMutation = useUpdateRule()
  const isSaving = createMutation.isPending || updateMutation.isPending
  const isLoading = (isEdit && ruleLoading) || clientsLoading
  const selectedClient = Form.useWatch('client', form)
  const { data: tagOptions = [] } = useRuleTags(selectedClient || undefined)

  useEffect(() => {
    if (isEdit && rule) {
      form.setFieldsValue(ruleToFormValues(rule))
      return
    }
    if (!isEdit) {
      form.setFieldsValue(ruleToFormValues(null))
    }
  }, [isEdit, rule, form])

  function handleSubmit() {
    form.validateFields().then((values) => {
      const payload = {
        client: values.client,
        ruleType: values.ruleType,
        polarity: values.polarity,
        ruleText: values.ruleText.trim(),
        priority: values.priority,
        source: values.source,
        createdBy: values.createdBy?.trim() || null,
        tags: values.tags ?? [],
      }

      if (isEdit) {
        updateMutation.mutate(
          { id: ruleId, body: payload },
          { onSuccess: () => onClose() },
        )
        return
      }

      createMutation.mutate(payload, { onSuccess: () => onClose() })
    })
  }

  return (
    <Modal
      title={isEdit ? 'Edit rule' : 'New rule'}
      open
      onCancel={onClose}
      width={640}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSaving}
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isEdit ? 'Save changes' : 'Create rule'}
        </Button>,
      ]}
    >
      {isLoading ? (
        <Spin style={{ display: 'block', margin: '24px auto' }} />
      ) : (
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="client"
            label="Client"
            rules={[{ required: true, message: 'Select a client' }]}
          >
            <Select
              showSearch
              placeholder="Select client…"
              optionFilterProp="label"
              options={clients.map((client) => ({
                value: client.code,
                label: client.code,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="ruleType"
            label="Domain"
            rules={[{ required: true, message: 'Select a domain' }]}
          >
            <Select
              placeholder="Select domain…"
              options={toSelectOptions(DOMAINS, DOMAIN_LABELS)}
            />
          </Form.Item>

          <Form.Item
            name="polarity"
            label="Polarity"
            rules={[{ required: true, message: 'Select a polarity' }]}
          >
            <Select
              placeholder="Select polarity…"
              options={toSelectOptions(RULE_POLARITIES, RULE_POLARITY_LABELS)}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Select a priority' }]}
          >
            <Select
              placeholder="Select priority…"
              options={toSelectOptions(RULE_PRIORITIES, RULE_PRIORITY_LABELS)}
            />
          </Form.Item>

          <Form.Item
            name="source"
            label="Source"
            rules={[{ required: true, message: 'Select a source' }]}
          >
            <Select
              placeholder="Select source…"
              options={toSelectOptions(RULE_SOURCES, RULE_SOURCE_LABELS)}
            />
          </Form.Item>

          <Form.Item
            name="ruleText"
            label="Rule text"
            rules={[{ required: true, message: 'Enter rule text' }]}
          >
            <TextArea rows={4} placeholder="Describe the rule…" />
          </Form.Item>

          <Form.Item name="tags" label="Tags (optional)">
            <Select
              mode="tags"
              placeholder="Add tags…"
              tokenSeparators={[',']}
              options={tagOptions.map((tag) => ({ value: tag, label: tag }))}
            />
          </Form.Item>

          <Form.Item name="createdBy" label="Created by (optional)">
            <Input placeholder="Author or team" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
