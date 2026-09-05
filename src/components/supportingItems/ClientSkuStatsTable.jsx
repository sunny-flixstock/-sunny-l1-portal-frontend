import { Alert, Flex, Table, Typography, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllClients } from '../../hooks/useClients.js'
import { useSkuStatsByClient } from '../../hooks/useSkus.js'

const { Text } = Typography

export function ClientSkuStatsTable() {
  const navigate = useNavigate()
  const { data: clients = [] } = useAllClients()
  const { data: stats = [], isLoading, isFetching, isError, error } = useSkuStatsByClient()

  useEffect(() => {
    if (isError) {
      message.error(error?.message || 'Failed to load client SKU stats')
    }
  }, [isError, error])

  function goToClient(clientName) {
    if (clientName) {
      navigate(`/supporting-items/${encodeURIComponent(clientName)}`)
    }
  }

  const columns = [
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      sorter: (a, b) => a.clientName.localeCompare(b.clientName),
    },
    {
      title: 'SKU count',
      dataIndex: 'skuCount',
      key: 'skuCount',
      width: 120,
      sorter: (a, b) => a.skuCount - b.skuCount,
    },
    {
      title: 'Internal SKUs',
      dataIndex: 'internalSkuCount',
      key: 'internalSkuCount',
      width: 140,
      sorter: (a, b) => a.internalSkuCount - b.internalSkuCount,
    },
  ]

  return (
    <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Client
        </Text>
        <Select
          allowClear
          showSearch
          placeholder="Select a client"
          onChange={(value) => {
            if (value) {
              goToClient(value)
            }
          }}
          style={{ width: 280 }}
          optionFilterProp="label"
          options={clients.map((client) => ({
            value: client.code,
            label: client.displayName ? `${client.code} — ${client.displayName}` : client.code,
          }))}
          aria-label="Client selector"
        />
      </div>

      {isError && (
        <Alert
          type="error"
          showIcon
          message={error?.message || 'Failed to load client SKU stats'}
          style={{ flexShrink: 0 }}
        />
      )}

      <Table
        rowKey="clientName"
        columns={columns}
        dataSource={stats}
        loading={isLoading || isFetching}
        pagination={false}
        size="small"
        scroll={{ y: 'calc(100vh - 300px)' }}
        onRow={(record) => ({
          onClick: () => goToClient(record.clientName),
          style: { cursor: 'pointer' },
        })}
      />
    </Flex>
  )
}
