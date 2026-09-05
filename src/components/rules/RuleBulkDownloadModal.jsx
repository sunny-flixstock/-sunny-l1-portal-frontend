import { DownloadOutlined } from '@ant-design/icons'
import { Button, Form, Modal, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import {
  downloadRuleImportTemplate,
  generateRuleImportTemplate,
} from '../../utils/ruleBulkXlsx.js'

export function RuleBulkDownloadModal({ onClose }) {
  const [form] = Form.useForm()
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: clients = [], isLoading: clientsLoading } = useAllClients()

  async function handleDownload() {
    try {
      const { client } = await form.validateFields()
      setIsDownloading(true)
      const buffer = await generateRuleImportTemplate(client)
      downloadRuleImportTemplate(client, buffer)
      message.success('Template downloaded')
      onClose()
    } catch (error) {
      if (error?.errorFields) {
        return
      }
      message.error(error.message || 'Failed to generate template')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Modal
      title="Download rules template"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isDownloading}>
          Cancel
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          loading={isDownloading}
          onClick={handleDownload}
        >
          Download XLSX
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="client"
          label="Client"
          extra="The template includes 100 rows with this client prefilled."
          rules={[{ required: true, message: 'Select a client' }]}
        >
          <Select
            showSearch
            placeholder="Select client…"
            loading={clientsLoading}
            optionFilterProp="label"
            options={clients.map((client) => ({
              value: client.code,
              label: client.code,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
