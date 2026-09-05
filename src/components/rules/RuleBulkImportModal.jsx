import { InboxOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Modal, Typography, Upload, message } from 'antd'
import { useMemo, useState } from 'react'
import { useBulkCreateRules } from '../../hooks/useRules.js'
import {
  parseRuleImportWorkbook,
  ruleImportRowToPayload,
} from '../../utils/ruleBulkXlsx.js'
import { RuleBulkPreviewTable } from './RuleBulkPreviewTable.jsx'

const { Dragger } = Upload
const { Text, Paragraph } = Typography

export function RuleBulkImportModal({ onClose }) {
  const [rows, setRows] = useState([])
  const [parseError, setParseError] = useState(null)
  const [fileName, setFileName] = useState('')

  const bulkCreate = useBulkCreateRules()

  const validCount = useMemo(() => rows.filter((row) => row.isValid).length, [rows])
  const invalidCount = rows.length - validCount
  const hasPreview = rows.length > 0

  async function handleFile(file) {
    setParseError(null)

    try {
      const buffer = await file.arrayBuffer()
      const parsed = await parseRuleImportWorkbook(buffer)

      if (parsed.length === 0) {
        setRows([])
        setFileName(file.name)
        setParseError('No rule rows found. Fill in at least rule text on one row.')
        return false
      }

      setRows(parsed)
      setFileName(file.name)
      message.success(`Loaded ${parsed.length} row(s) from ${file.name}`)
    } catch (error) {
      setRows([])
      setFileName(file.name)
      setParseError(error.message || 'Failed to parse spreadsheet')
    }

    return false
  }

  function handleClear() {
    setRows([])
    setParseError(null)
    setFileName('')
  }

  function handleSubmit() {
    const validRows = rows.filter((row) => row.isValid)
    if (validRows.length === 0) {
      message.error('Fix validation errors before submitting')
      return
    }

    if (invalidCount > 0) {
      message.error('Remove or fix invalid rows before submitting')
      return
    }

    const rules = validRows.map((row) => ruleImportRowToPayload(row.values))
    bulkCreate.mutate(rules, {
      onSuccess: (response) => {
        message.success(`Created ${response.count} rule(s)`)
        onClose()
      },
    })
  }

  return (
    <Modal
      title="Import rules from Excel"
      open
      onCancel={onClose}
      width={hasPreview ? 1200 : 640}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose} disabled={bulkCreate.isPending}>
          Cancel
        </Button>,
        hasPreview ? (
          <Button key="clear" onClick={handleClear} disabled={bulkCreate.isPending}>
            Choose another file
          </Button>
        ) : null,
        <Button
          key="submit"
          type="primary"
          disabled={!hasPreview || invalidCount > 0 || bulkCreate.isPending}
          loading={bulkCreate.isPending}
          onClick={handleSubmit}
        >
          Create {validCount > 0 ? validCount : ''} rule{validCount === 1 ? '' : 's'}
        </Button>,
      ].filter(Boolean)}
    >
      <Flex vertical gap="middle" style={{ marginTop: 8 }}>
        {!hasPreview && (
          <>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Upload a filled template (.xlsx). Rows are validated and shown for review before
              anything is saved.
            </Paragraph>
            <Dragger
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              multiple={false}
              showUploadList={false}
              beforeUpload={handleFile}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag an Excel file here</p>
              <p className="ant-upload-hint">Use the downloaded template for correct columns</p>
            </Dragger>
          </>
        )}

        {parseError && <Alert type="error" message={parseError} showIcon />}

        {hasPreview && (
          <>
            <Flex justify="space-between" align="center" wrap="wrap" gap="small">
              <Text>
                Previewing <strong>{rows.length}</strong> row(s)
                {fileName ? ` from ${fileName}` : ''}
                {invalidCount > 0 ? (
                  <Text type="danger"> · {invalidCount} invalid</Text>
                ) : (
                  <Text type="success"> · all valid</Text>
                )}
              </Text>
              <Button icon={<UploadOutlined />} onClick={handleClear}>
                Upload different file
              </Button>
            </Flex>

            {invalidCount > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Fix or remove invalid rows before creating rules."
              />
            )}

            <RuleBulkPreviewTable rows={rows} onChange={setRows} />
          </>
        )}
      </Flex>
    </Modal>
  )
}
