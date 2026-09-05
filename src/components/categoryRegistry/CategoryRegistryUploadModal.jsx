import { InboxOutlined } from '@ant-design/icons'
import { Form, Input, Modal, Tabs, Upload, message } from 'antd'
import { useState } from 'react'
import { useCreateCategoryRegistry } from '../../hooks/useCategoryRegistry.js'
import { parseRegistryJson } from '../../utils/categoryRegistryJson.js'

const { Dragger } = Upload
const { TextArea } = Input

export function CategoryRegistryUploadModal({ onClose }) {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('paste')
  const [jsonText, setJsonText] = useState('')
  const [fileName, setFileName] = useState('')
  const createMutation = useCreateCategoryRegistry()

  async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  async function handleSubmit() {
    const { name } = await form.validateFields()

    let registry
    try {
      if (activeTab === 'file') {
        if (!jsonText.trim()) {
          message.error('Select a JSON file to upload')
          return
        }
        registry = parseRegistryJson(jsonText)
      } else {
        registry = parseRegistryJson(jsonText)
      }
    } catch (error) {
      message.error(error.message)
      return
    }

    createMutation.mutate(
      { name: name.trim(), registry },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <Modal
      title="Upload category registry"
      open
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Upload"
      confirmLoading={createMutation.isPending}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, whitespace: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g. Default product categories" maxLength={200} />
        </Form.Item>
      </Form>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'paste',
            label: 'Paste JSON',
            children: (
              <TextArea
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                placeholder='{ "categories": ["tops"] }'
                rows={12}
                style={{ fontFamily: 'monospace' }}
                aria-label="Category registry JSON"
              />
            ),
          },
          {
            key: 'file',
            label: 'Upload file',
            children: (
              <Dragger
                accept=".json,application/json"
                maxCount={1}
                beforeUpload={async (file) => {
                  try {
                    const text = await readFileAsText(file)
                    parseRegistryJson(text)
                    setJsonText(text)
                    setFileName(file.name)
                    message.success(`Loaded ${file.name}`)
                  } catch (error) {
                    message.error(error.message)
                  }
                  return false
                }}
                onRemove={() => {
                  setJsonText('')
                  setFileName('')
                }}
                fileList={
                  fileName ? [{ uid: '-1', name: fileName, status: 'done' }] : []
                }
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag a .json file here</p>
              </Dragger>
            ),
          },
        ]}
      />
    </Modal>
  )
}
