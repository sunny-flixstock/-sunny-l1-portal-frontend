import { Alert, Button, Form, Input, InputNumber, Modal, Spin } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import {
  useCreateFrameworkGroup,
  useFrameworkGroup,
  useUpdateFrameworkGroup,
} from '../../hooks/useFrameworkGroups.js'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { formValuesToPayload, groupToFormValues } from '../../utils/frameworkGroupForm.js'

export function FrameworkGroupModal({ groupId, onClose }) {
  const isEdit = Boolean(groupId)
  const [form] = Form.useForm()

  const { data: clients = [], isLoading: clientsLoading } = useAllClients()
  const { data: group, isLoading: groupLoading } = useFrameworkGroup(groupId, isEdit)
  const createMutation = useCreateFrameworkGroup()
  const updateMutation = useUpdateFrameworkGroup()
  const isSaving = createMutation.isPending || updateMutation.isPending
  const isLoading = (isEdit && groupLoading) || clientsLoading
  const formReady = !isLoading && (!isEdit || Boolean(group))

  useEffect(() => {
    if (isEdit && group) {
      form.setFieldsValue(groupToFormValues(group))
      return
    }
    if (!isEdit) {
      form.setFieldsValue(groupToFormValues(null))
    }
  }, [isEdit, group, form])

  function handleSubmit() {
    form.validateFields().then((values) => {
      const payload = formValuesToPayload(values)

      if (isEdit) {
        updateMutation.mutate(
          { id: groupId, body: payload },
          { onSuccess: () => onClose() },
        )
        return
      }

      createMutation.mutate(payload, { onSuccess: () => onClose() })
    })
  }

  return (
    <Modal
      title={isEdit ? `Edit ${LABELS.stylistGroup.toLowerCase()}` : `New ${LABELS.stylistGroup.toLowerCase()}`}
      open
      onCancel={onClose}
      width={560}
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
          {isEdit ? 'Save changes' : 'Create'}
        </Button>,
      ]}
    >
      <Alert
        type="info"
        message="Leave gender, season, or category empty to match any value (wildcard)."
        showIcon
        style={{ marginBottom: 16 }}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        formReady && (
          <Form form={form} layout="vertical" disabled={isSaving}>
            <Form.Item
              name="client"
              label="Client"
              rules={[{ required: true, message: 'Select a client' }]}
            >
              <Select
                placeholder="Select client…"
                disabled={isEdit}
                options={clients.map((client) => ({
                  value: client.code,
                  label: client.code,
                }))}
              />
            </Form.Item>

            <Form.Item label="Constraints" style={{ marginBottom: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="gender" label="Gender" style={{ marginBottom: 16 }}>
                  <Input placeholder="Any" />
                </Form.Item>
                <Form.Item name="season" label="Season" style={{ marginBottom: 16 }}>
                  <Input placeholder="Any" />
                </Form.Item>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="category" label="Category" style={{ marginBottom: 16 }}>
                  <Input placeholder="Any" />
                </Form.Item>
                <Form.Item name="priority" label="Priority" style={{ marginBottom: 16 }}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item name="name" label="Name (optional)">
              <Input placeholder="Display label" />
            </Form.Item>
          </Form>
        )
      )}
    </Modal>
  )
}
