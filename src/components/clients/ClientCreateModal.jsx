import { Button, Form, Input, Modal } from 'antd'
import { useCreateClient } from '../../hooks/useClients.js'

export function ClientCreateModal({ onClose }) {
  const [form] = Form.useForm()
  const createMutation = useCreateClient()

  function handleSubmit() {
    form.validateFields().then((values) => {
      const payload = {
        code: values.code.trim(),
      }
      const displayName = values.displayName?.trim()
      if (displayName) {
        payload.displayName = displayName
      }
      createMutation.mutate(payload, { onSuccess: () => onClose() })
    })
  }

  return (
    <Modal
      title="New client"
      open
      onCancel={onClose}
      width={480}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={createMutation.isPending}
          onClick={handleSubmit}
        >
          Create
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="code"
          label="Code"
          rules={[{ required: true, message: 'Code is required' }]}
          extra="Unique identifier used across the system (e.g. BZT)."
        >
          <Input placeholder="e.g. BZT" autoFocus />
        </Form.Item>
        <Form.Item name="displayName" label="Display name">
          <Input placeholder="Optional friendly name" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
