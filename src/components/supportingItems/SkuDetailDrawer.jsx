import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Collapse,
  Descriptions,
  Drawer,
  Flex,
  Image,
  Progress,
  Spin,
  Switch,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { updateSkuShouldNotProduce } from '../../api/skuApi.js'
import { skuKeys, useAddSkuAsset, useSku } from '../../hooks/useSkus.js'
import {
  ALLOWED_IMAGE_ACCEPT,
  allowedImageRejectMessage,
  isAllowedUploadImageFile,
} from '../../utils/allowedImageFormats.js'
import { getPreviewUrl } from './skuImageUtils.js'

const { Text, Paragraph } = Typography

const BOOLEAN_FIELDS = [
  { key: 'isActive', label: 'Active' },
  { key: 'filtersSynced', label: 'Filters synced' },
  { key: 'createdWithoutCSVDataPreCheck', label: 'Created without CSV pre-check' },
  { key: 'readyForEmbedding', label: 'Ready for embedding' },
  { key: 'embeddingDone', label: 'Embedding done' },
  { key: 'enableFXGTOM', label: 'Enable FX GTOM' },
]

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function BooleanTag({ value }) {
  return <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
}

export function SkuDetailDrawer({ skuId, clientName, assetType, onClose }) {
  const queryClient = useQueryClient()
  const { data: sku, isLoading, isError, error } = useSku(skuId)
  const addAssetMutation = useAddSkuAsset()
  const [uploadProgress, setUploadProgress] = useState(null)
  const uploadLockRef = useRef(false)
  const shouldNotProduceMutation = useMutation({
    mutationFn: updateSkuShouldNotProduce,
    onSuccess: (_, variables) => {
      queryClient.setQueryData(skuKeys.detail(skuId), (currentSku) => (
        currentSku
          ? { ...currentSku, shouldNotProduce: variables.shouldNotProduce }
          : currentSku
      ))
      queryClient.invalidateQueries({ queryKey: skuKeys.detail(skuId) })
      queryClient.invalidateQueries({ queryKey: skuKeys.lists() })
      message.success(
        variables.shouldNotProduce
          ? 'SKU marked as should not produce'
          : 'SKU marked as eligible for production'
      )
    },
    onError: (mutationError) => {
      message.error(mutationError?.message || 'Failed to update SKU')
    },
  })

  const previewItems = (sku?.assets ?? [])
    .map((asset) => getPreviewUrl(asset.image))
    .filter(Boolean)

  const isUploading = addAssetMutation.isPending
  const canAddAsset = Boolean(sku) && !sku.shouldNotProduce && !isUploading

  async function handleAddAsset(file) {
    if (!sku || sku.shouldNotProduce || uploadLockRef.current) return

    uploadLockRef.current = true
    setUploadProgress(0)
    try {
      await addAssetMutation.mutateAsync({
        skuId,
        assetType,
        clientName,
        skuClientName: sku.clientName,
        associatedTo: sku.associatedTo,
        barcode: sku.barcode,
        file,
        onProgress: setUploadProgress,
      })
    } finally {
      uploadLockRef.current = false
      setUploadProgress(null)
    }
  }

  return (
    <Drawer
      title={sku?.barcode ?? 'SKU details'}
      open
      onClose={onClose}
      width={720}
      destroyOnClose
    >
      {isLoading && <Spin />}
      {isError && <Text type="danger">{error?.message}</Text>}
      {sku && (
        <Flex vertical gap={24}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Barcode">{sku.barcode}</Descriptions.Item>
            <Descriptions.Item label="Client">{sku.clientName}</Descriptions.Item>
            <Descriptions.Item label="Created">{formatDate(sku.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Updated">{formatDate(sku.updatedAt)}</Descriptions.Item>
            {sku.associatedTo && (
              <Descriptions.Item label="Associated to">{sku.associatedTo}</Descriptions.Item>
            )}
          </Descriptions>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Flags
            </Text>
            <Flex wrap gap={8}>
              {BOOLEAN_FIELDS.map(({ key, label }) => (
                <Flex key={key} align="center" gap={6}>
                  <Text type="secondary">{label}:</Text>
                  <BooleanTag value={Boolean(sku[key])} />
                </Flex>
              ))}
            </Flex>
          </div>

          <Flex align="center" justify="space-between">
            <div>
              <Text strong style={{ display: 'block' }}>
                Should not produce
              </Text>
              <Text type="secondary">
                Exclude this SKU from production.
              </Text>
            </div>
            <Switch
              checked={Boolean(sku.shouldNotProduce)}
              checkedChildren="Yes"
              unCheckedChildren="No"
              loading={shouldNotProduceMutation.isPending}
              disabled={shouldNotProduceMutation.isPending}
              style={{
                minWidth: 54,
                backgroundColor: sku.shouldNotProduce ? '#52c41a' : undefined,
              }}
              onChange={(shouldNotProduce) => {
                shouldNotProduceMutation.mutate({
                  barcode: sku.barcode,
                  clientName: sku.clientName,
                  shouldNotProduce,
                })
              }}
              aria-label="Should not produce"
            />
          </Flex>

          <div>
            <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
              <Text strong>Assets ({sku.assets?.length ?? 0})</Text>
              <Upload
                accept={ALLOWED_IMAGE_ACCEPT}
                showUploadList={false}
                disabled={!canAddAsset}
                beforeUpload={(file) => {
                  if (!isAllowedUploadImageFile(file)) {
                    message.error(allowedImageRejectMessage(file.name))
                    return Upload.LIST_IGNORE
                  }
                  handleAddAsset(file)
                  return Upload.LIST_IGNORE
                }}
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  loading={isUploading}
                  disabled={!canAddAsset}
                  title={
                    sku.shouldNotProduce
                      ? 'Cannot add assets while Should not produce is Yes'
                      : undefined
                  }
                >
                  Add asset
                </Button>
              </Upload>
            </Flex>
            {uploadProgress !== null && (
              <Progress percent={uploadProgress} size="small" style={{ marginBottom: 8 }} />
            )}
            {previewItems.length ? (
              <Image.PreviewGroup>
                <Flex wrap gap={12}>
                  {(sku.assets ?? []).map((asset) => {
                    const url = getPreviewUrl(asset.image)
                    if (!url) return null
                    return (
                      <div key={asset._id} style={{ textAlign: 'center' }}>
                        <Image
                          src={url}
                          alt={asset.barcode}
                          width={120}
                          height={120}
                          style={{ objectFit: 'cover', borderRadius: 4 }}
                        />
                        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                          {formatDate(asset.createdAt)}
                        </Text>
                      </div>
                    )
                  })}
                </Flex>
              </Image.PreviewGroup>
            ) : (
              <Text type="secondary">No assets</Text>
            )}
          </div>

          <Collapse
            items={[
              {
                key: 'patternDict',
                label: 'patternDict',
                children: (
                  <Paragraph
                    copyable
                    code
                    style={{ whiteSpace: 'pre-wrap', marginBottom: 0, fontSize: 12 }}
                  >
                    {JSON.stringify(sku.patternDict ?? {}, null, 2)}
                  </Paragraph>
                ),
              },
            ]}
          />

          {sku.garmentCategorization?.category && (
            <Descriptions column={1} bordered size="small" title="Garment categorization">
              <Descriptions.Item label="Category">
                {sku.garmentCategorization.category}
              </Descriptions.Item>
              <Descriptions.Item label="Confidence">
                {sku.garmentCategorization.confidence ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Reasoning">
                {sku.garmentCategorization.reasoning ?? '—'}
              </Descriptions.Item>
            </Descriptions>
          )}

          {sku.skuImageDescription && (
            <Descriptions column={1} bordered size="small" title="Image description">
              <Descriptions.Item label="Description">
                {sku.skuImageDescription}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Flex>
      )}
    </Drawer>
  )
}
