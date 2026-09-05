import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Flex, Form, Input, message, Modal, Spin, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useClient, useUpdateClientCsvConfig } from '../../hooks/useClients.js'
import {
  createEmptyColumnRow,
  csvConfigToFormRows,
  formRowsToCsvConfig,
  normalizeCsvConfig,
} from '../../utils/csvConfig.js'

function ColumnEditor({ row, index, onChange, onRemove }) {
  function updateField(field, value) {
    onChange(index, { ...row, [field]: value })
  }

  return (
    <Card
      size="small"
      title={
        <Input
          value={row.name}
          placeholder="Column name"
          onChange={(event) => updateField('name', event.target.value)}
          variant="borderless"
          style={{ fontWeight: 600, padding: 0 }}
        />
      }
      extra={
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove(index)}>
          Remove
        </Button>
      }
    >
      <Form layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item style={{ marginBottom: 12 }}>
          <Checkbox
            checked={row.required}
            onChange={(event) => updateField('required', event.target.checked)}
          >
            Required
          </Checkbox>
        </Form.Item>
        <Form.Item label="Allowed values" style={{ marginBottom: 12 }}>
          <Select
            mode="tags"
            value={row.allowedValues}
            placeholder="Add allowed value"
            onChange={(values) => updateField('allowedValues', values)}
            tokenSeparators={[',']}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Sources" style={{ marginBottom: 0 }}>
          <Select
            mode="tags"
            value={row.sources}
            placeholder="Add source column"
            onChange={(values) => updateField('sources', values)}
            tokenSeparators={[',']}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Card>
  )
}

function CsvConfigEditor({ client, onClose }) {
  const updateCsvConfig = useUpdateClientCsvConfig()
  const [rows, setRows] = useState(() =>
    csvConfigToFormRows(normalizeCsvConfig(client.csvConfig)),
  )

  function updateRow(index, nextRow) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? nextRow : row)))
  }

  function removeRow(index) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
  }

  function handleSave() {
    updateCsvConfig.mutate(
      {
        code: client.code,
        csvConfig: formRowsToCsvConfig(rows),
      },
      {
        onSuccess: () => onClose(),
      },
    )
  }

  return (
    <>
      {rows.length === 0 && (
        <Typography.Text type="secondary">No columns configured yet.</Typography.Text>
      )}

      <Flex vertical gap="middle" style={{ marginTop: rows.length === 0 ? 0 : 16 }}>
        {rows.map((row, index) => (
          <ColumnEditor
            key={`${row.name}-${index}`}
            row={row}
            index={index}
            onChange={updateRow}
            onRemove={removeRow}
          />
        ))}
      </Flex>

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => setRows((current) => [...current, createEmptyColumnRow()])}
        style={{ marginTop: 16 }}
        block
      >
        Add column
      </Button>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button type="primary" onClick={handleSave} loading={updateCsvConfig.isPending}>
          Save
        </Button>
      </div>
    </>
  )
}

export function CsvConfigModal({ clientCode, onClose }) {
  const { data: client, isLoading, isError, error } = useClient(clientCode, Boolean(clientCode))

  useEffect(() => {
    if (isError) {
      message.error(error?.message || 'Failed to load client settings')
    }
  }, [isError, error])

  if (!clientCode) {
    return null
  }

  return (
    <Modal
      title="CSV Config"
      open
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Typography.Text type="secondary">{clientCode}</Typography.Text>

      {isLoading && (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin tip="Loading config…" />
        </Flex>
      )}

      {isError && (
        <Alert type="error" message={error.message} showIcon style={{ marginTop: 16 }} />
      )}

      {client && <CsvConfigEditor key={client.code} client={client} onClose={onClose} />}
    </Modal>
  )
}
