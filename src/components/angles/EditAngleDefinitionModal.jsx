import { Alert, Button, Form, Input } from 'antd'
import { useState } from 'react'
import { FullPageMarkdownModal } from '../common/FullPageMarkdownModal.jsx'
import { useCreateBaseAngle } from '../../hooks/useBaseAngles.js'
import { useReviseClientAngleDefinition } from '../../hooks/useClientAngles.js'
import { AngleDefinitionEditor } from './AngleDefinitionEditor.jsx'

export function EditAngleDefinitionModal({
  kind = 'base',
  seriesKey,
  initialName,
  initialMarkdown = '',
  onClose,
  onSaved,
}) {
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [form] = Form.useForm()
  const baseMutation = useCreateBaseAngle()
  const clientMutation = useReviseClientAngleDefinition()
  const mutation = kind === 'client' ? clientMutation : baseMutation
  const isPending = mutation.isPending

  function handleSubmit() {
    const trimmed = markdown.trim()
    if (!trimmed) {
      return
    }

    const values = form.getFieldsValue()
    const payload = {
      seriesKey,
      definitionMarkdown: trimmed,
    }

    if (values.name?.trim()) {
      payload.name = values.name.trim()
    }

    mutation.mutate(payload, {
      onSuccess: (response) => {
        onSaved?.(response.data)
        onClose()
      },
    })
  }

  const title =
    kind === 'client' ? 'Edit client angle definition' : 'Edit base angle definition'

  return (
    <FullPageMarkdownModal
      title={title}
      onClose={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isPending}
          disabled={!markdown.trim()}
          onClick={handleSubmit}
        >
          Save as new version
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        message="Saving creates a new version and archives the current active version."
        className="full-page-markdown-modal__alert"
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: initialName ?? '' }}
        className="full-page-markdown-modal__form"
      >
        <Form.Item name="name" label="Name (optional override)">
          <Input placeholder={initialName ?? 'Keep existing name'} />
        </Form.Item>
      </Form>

      <AngleDefinitionEditor value={markdown} onChange={setMarkdown} fillHeight />
    </FullPageMarkdownModal>
  )
}
