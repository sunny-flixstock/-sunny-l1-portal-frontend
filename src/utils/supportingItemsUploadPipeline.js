import {
  createAssetsWithProperties,
  getAssetUploadUrl,
  presignInternalAssetUploadUrls,
} from '../api/assetApi.js'
import { uploadFileToPresignedUrl } from './s3Upload.js'

export const INTERNAL_CLIENT_NAME = 'FLIXSTOCK'

export const ASSET_TYPES = {
  CLIENT: 'client',
  INTERNAL: 'internal',
}

export const UPLOAD_PHASE = {
  UPLOADING: 'uploading',
  CREATING: 'creating',
  DONE: 'done',
}

function getFileExtension(fileName) {
  const match = fileName.match(/\.([a-z0-9]+)$/i)
  return match ? `.${match[1].toLowerCase()}` : '.jpg'
}

function guessMimeType(file) {
  if (file.type) {
    return file.type
  }
  const ext = getFileExtension(file.name)
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  }
  return map[ext] ?? 'application/octet-stream'
}

function buildSkuProperties(normalisedCsvRow) {
  if (!normalisedCsvRow || typeof normalisedCsvRow !== 'object') {
    return {}
  }
  const props = { ...normalisedCsvRow }
  delete props.barcode
  return props
}

function countTotalSteps(validatedSkus) {
  const totalFiles = validatedSkus.reduce((sum, sku) => sum + sku.files.length, 0)
  return totalFiles + validatedSkus.length
}

function emitProgress(onProgress, state) {
  onProgress?.(state)
}

async function presignClientAssetFile(file, clientName) {
  const response = await getAssetUploadUrl({
    fileName: file.name,
    clientName,
  })
  return {
    url: response.url,
    key: response.key,
    host: response.host,
    contentType: response.contentType || guessMimeType(file),
    name: file.name,
  }
}

async function presignInternalAssetFiles({ barcode, associatedTo, files }) {
  const response = await presignInternalAssetUploadUrls({
    clientName: INTERNAL_CLIENT_NAME,
    associatedTo,
    barcode,
    files: files.map((file) => ({
      ext: getFileExtension(file.name),
      mimeType: guessMimeType(file),
    })),
  })

  return response.files.map((entry, index) => ({
    url: entry.url,
    key: entry.key,
    host: entry.host,
    contentType: entry.contentType || guessMimeType(files[index]),
    name: entry.fileName || files[index].name,
  }))
}

async function uploadSkuFiles({
  sku,
  assetType,
  clientName,
  onProgress,
  completedSteps,
  totalSteps,
}) {
  const presigned =
    assetType === 'internal'
      ? await presignInternalAssetFiles({
        barcode: sku.barcode,
        associatedTo: clientName,
        files: sku.files,
      })
      : await Promise.all(
        sku.files.map((file) => presignClientAssetFile(file, clientName))
      )

  const images = []

  for (let index = 0; index < sku.files.length; index += 1) {
    const file = sku.files[index]
    const target = presigned[index]

    emitProgress(onProgress, {
      phase: UPLOAD_PHASE.UPLOADING,
      currentBarcode: sku.barcode,
      currentFileName: file.name,
      filePercent: 0,
      overallPercent: Math.round((completedSteps / totalSteps) * 100),
      completedSteps,
      totalSteps,
    })

    await uploadFileToPresignedUrl({
      url: target.url,
      file,
      contentType: target.contentType,
      onProgress: (filePercent) => {
        emitProgress(onProgress, {
          phase: UPLOAD_PHASE.UPLOADING,
          currentBarcode: sku.barcode,
          currentFileName: file.name,
          filePercent,
          overallPercent: Math.round((completedSteps / totalSteps) * 100),
          completedSteps,
          totalSteps,
        })
      },
    })

    images.push({
      name: target.name || file.name,
      imagePath: {
        key: target.key,
        host: target.host,
      },
    })

    completedSteps += 1
    emitProgress(onProgress, {
      phase: UPLOAD_PHASE.UPLOADING,
      currentBarcode: sku.barcode,
      currentFileName: file.name,
      filePercent: 100,
      overallPercent: Math.round((completedSteps / totalSteps) * 100),
      completedSteps,
      totalSteps,
    })
  }

  return { images, completedSteps }
}

/**
 * Upload supporting-item images to S3, then register SKUs/assets via createWithProperties.
 * Processes one SKU at a time: all files uploaded, then one create API call per SKU.
 */
export async function runSupportingItemsUploadPipeline({
  assetType,
  clientName,
  validatedSkus,
  onProgress,
}) {
  const createClientName =
    assetType === 'internal' ? INTERNAL_CLIENT_NAME : clientName
  const totalSteps = countTotalSteps(validatedSkus)
  let completedSteps = 0
  const results = []
  const failures = []

  emitProgress(onProgress, {
    phase: UPLOAD_PHASE.UPLOADING,
    overallPercent: 0,
    filePercent: 0,
    completedSteps: 0,
    totalSteps,
  })

  for (const sku of validatedSkus) {
    try {
      const { images, completedSteps: nextCompletedSteps } = await uploadSkuFiles({
        sku,
        assetType,
        clientName,
        onProgress,
        completedSteps,
        totalSteps,
      })
      completedSteps = nextCompletedSteps

      emitProgress(onProgress, {
        phase: UPLOAD_PHASE.CREATING,
        currentBarcode: sku.barcode,
        currentFileName: null,
        filePercent: 100,
        overallPercent: Math.round((completedSteps / totalSteps) * 100),
        completedSteps,
        totalSteps,
      })

      const skuProperties = buildSkuProperties(sku.normalisedCsvRow)
      const createResponse = await createAssetsWithProperties({
        clientName: createClientName,
        createWithoutCSVData: true,
        files: [
          {
            barcode: sku.barcode,
            ...(Object.keys(skuProperties).length ? { skuProperties } : {}),
            images,
          },
        ],
      })

      const outcome = createResponse.data?.[0]
      if (!outcome?.success) {
        failures.push({
          barcode: sku.barcode,
          error: outcome?.error || 'Asset creation failed',
        })
      } else {
        results.push(outcome)
      }

      completedSteps += 1
      emitProgress(onProgress, {
        phase: UPLOAD_PHASE.UPLOADING,
        currentBarcode: sku.barcode,
        currentFileName: null,
        filePercent: 100,
        overallPercent: Math.round((completedSteps / totalSteps) * 100),
        completedSteps,
        totalSteps,
      })
    } catch (error) {
      failures.push({
        barcode: sku.barcode,
        error: error.message || 'Upload failed',
      })
      completedSteps += sku.files.length + 1
    }
  }

  emitProgress(onProgress, {
    phase: UPLOAD_PHASE.DONE,
    overallPercent: 100,
    filePercent: 100,
    completedSteps: totalSteps,
    totalSteps,
  })

  return {
    succeeded: results.length,
    failed: failures.length,
    results,
    failures,
  }
}

/**
 * Presign, upload to S3, and register a single asset on an existing SKU.
 * Omits skuProperties so createWithProperties skips merge and leaves patternDict intact.
 */
export async function addAssetToSku({
  assetType,
  clientName,
  skuClientName,
  associatedTo,
  barcode,
  file,
  onProgress,
}) {
  const createClientName = skuClientName
    || (assetType === ASSET_TYPES.INTERNAL ? INTERNAL_CLIENT_NAME : clientName)

  const presigned =
    assetType === ASSET_TYPES.INTERNAL
      ? (await presignInternalAssetFiles({
        barcode,
        associatedTo: associatedTo || clientName,
        files: [file],
      }))[0]
      : await presignClientAssetFile(file, createClientName)

  await uploadFileToPresignedUrl({
    url: presigned.url,
    file,
    contentType: presigned.contentType,
    onProgress,
  })

  const createResponse = await createAssetsWithProperties({
    clientName: createClientName,
    createWithoutCSVData: false,
    files: [
      {
        barcode,
        images: [
          {
            name: presigned.name || file.name,
            imagePath: {
              key: presigned.key,
              host: presigned.host,
            },
          },
        ],
      },
    ],
  })

  const outcome = createResponse.data?.[0]
  if (!outcome?.success) {
    throw new Error(outcome?.error || 'Asset creation failed')
  }

  return outcome
}
