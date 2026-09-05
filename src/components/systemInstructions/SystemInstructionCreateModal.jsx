import { InboxOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Radio, Upload } from 'antd'
import { useState } from 'react'
import { useCreateSystemInstruction } from '../../hooks/useSystemInstructions.js'
import { INSTRUCTION_TYPE_DESCRIPTIONS } from '../../utils/systemInstructionConstants.js'

const { TextArea } = Input
const { Dragger } = Upload

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function SystemInstructionCreateModal({
  instructionType,
  instructionTypeLabel,
  seriesKey,
  initialName,
  initialPurpose,
  onClose,
  onCreated,
}) {
  const [form] = Form.useForm()
  const [contentMode, setContentMode] = useState('paste')
  const createMutation = useCreateSystemInstruction()

  const isNewVersion = Boolean(seriesKey)

  function handleSubmit() {
    form.validateFields().then(async (values) => {
      let outputSchema = {}
      const rawSchema = values.outputSchema?.trim()
      if (rawSchema) {
        try {
          outputSchema = JSON.parse(rawSchema)
        } catch {
          form.setFields([
            { name: 'outputSchema', errors: ['Must be valid JSON'] },
          ])
          return
        }
      }

      const payload = {
        name: values.name.trim(),
        instructionType,
        purpose: values.purpose.trim(),
        systemPrompt: values.systemPrompt.trim(),
        outputSchema,
      }

      if (seriesKey) {
        payload.seriesKey = seriesKey
      }

      createMutation.mutate(payload, {
        onSuccess: (response) => {
          onCreated?.(response.data)
          onClose()
        },
      })
    })
  }

  return (
    <Modal
      title={
        isNewVersion
          ? `New version — ${instructionTypeLabel}`
          : `New instruction — ${instructionTypeLabel}`
      }
      open
      onCancel={onClose}
      width={720}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={createMutation.isPending}
          onClick={handleSubmit}
        >
          Create
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: initialName ?? '',
          purpose:
            initialPurpose ??
            INSTRUCTION_TYPE_DESCRIPTIONS[instructionType] ??
            '',
          systemPrompt: '',
          outputSchema: '{}',
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="Example Image Analyzer Instruction" />
        </Form.Item>

        <Form.Item
          name="purpose"
          label="Purpose"
          rules={[{ required: true, message: 'Purpose is required' }]}
        >
          <TextArea rows={2} placeholder="What this instruction is used for" />
        </Form.Item>

        <Form.Item label="System prompt">
          <Radio.Group
            value={contentMode}
            onChange={(event) => setContentMode(event.target.value)}
            style={{ marginBottom: 12 }}
          >
            <Radio.Button value="paste">Paste text</Radio.Button>
            <Radio.Button value="upload">Upload .md</Radio.Button>
          </Radio.Group>

          {contentMode === 'paste' ? (
            <Form.Item
              name="systemPrompt"
              noStyle
              rules={[{ required: true, message: 'System prompt is required' }]}
            >
              <TextArea
                rows={12}
                placeholder="Markdown system prompt…"
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
              />
            </Form.Item>
          ) : (
            <>
              <Dragger
                accept=".md,.markdown,.txt"
                maxCount={1}
                beforeUpload={async (file) => {
                  try {
                    const text = await readFileAsText(file)
                    form.setFieldValue('systemPrompt', text)
                  } catch {
                    form.setFields([
                      {
                        name: 'systemPrompt',
                        errors: ['Could not read file'],
                      },
                    ])
                  }
                  return false
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Drop a markdown file or click to browse
                </p>
              </Dragger>
              <Form.Item
                name="systemPrompt"
                hidden
                rules={[{ required: true, message: 'Upload a prompt file' }]}
              >
                <Input />
              </Form.Item>
            </>
          )}
        </Form.Item>

        <Form.Item
          name="outputSchema"
          label="Output schema (JSON)"
          extra="Optional JSON schema describing the model output shape"
        >
          <TextArea
            rows={4}
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
