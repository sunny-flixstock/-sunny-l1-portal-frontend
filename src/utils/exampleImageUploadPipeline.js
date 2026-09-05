import {
  createExampleImage,
  fetchExampleImagesByIds,
  fetchThumbnailStatus,
  presignExampleImageUploads,
} from '../api/exampleImageApi.js'
import { isAllowedUploadImageFile } from './allowedImageFormats.js'
import { uploadFileToPresignedUrl } from './s3Upload.js'
import { UPLOAD_STATUS } from './exampleImageConstants.js'

const THUMBNAIL_POLL_INTERVAL_MS = 2000
const THUMBNAIL_MAX_WAIT_MS = 120000

export const PRESIGN_BATCH_SIZE = 50
export const DEFAULT_UPLOAD_CONCURRENCY = 2
export const BULK_UPLOAD_CONCURRENCY = 5

export function isExampleImageFile(file) {
  return isAllowedUploadImageFile(file)
}

export function chunkFiles(files, size = PRESIGN_BATCH_SIZE) {
  const chunks = []
  for (let index = 0; index < files.length; index += size) {
    chunks.push(files.slice(index, index + size))
  }
  return chunks
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function runPool(items, concurrency, worker) {
  let index = 0

  async function runNext() {
    const current = index
    index += 1
    if (current >= items.length) {
      return
    }
    await worker(items[current], current)
    await runNext()
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runNext()),
  )
}

async function waitForThumbnails(ids) {
  const started = Date.now()

  while (Date.now() - started < THUMBNAIL_MAX_WAIT_MS) {
    const { data } = await fetchThumbnailStatus(ids)
    const readyCount = data.filter((item) => item.thumbnailReady).length

    if (readyCount === data.length) {
      return data
    }

    await delay(THUMBNAIL_POLL_INTERVAL_MS)
  }

  throw new Error('Timed out waiting for thumbnails to generate')
}

/**
 * Stable multi-file upload: batch presign → concurrent S3 PUT → DB create → optional thumbnail poll.
 */
export async function runExampleImageUploadPipeline({
  client,
  type,
  tags,
  uploadedBy,
  files,
  onItemUpdate,
  skipThumbnails = false,
  skipFetchUploaded = false,
  concurrency = DEFAULT_UPLOAD_CONCURRENCY,
  maxFiles = PRESIGN_BATCH_SIZE,
}) {
  if (files.length > maxFiles) {
    throw new Error(`Maximum ${maxFiles} files per upload batch`)
  }

  const items = files.map((file, index) => ({
    index,
    file,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    status: UPLOAD_STATUS.QUEUED,
    progress: 0,
    error: null,
    exampleImageId: null,
    presign: null,
  }))

  const emit = () => onItemUpdate?.(items.map((item) => ({ ...item })))

  emit()

  let presigns = []
  try {
    items.forEach((item) => {
      item.status = UPLOAD_STATUS.PRESIGNING
    })
    emit()

    const presignResponse = await presignExampleImageUploads({
      client,
      files: items.map((item) => ({
        fileName: item.fileName,
        contentType: item.contentType,
      })),
    })

    presigns = presignResponse.data
    if (!presigns?.length || presigns.length !== items.length) {
      throw new Error('Presign response count does not match selected files')
    }

    items.forEach((item, index) => {
      item.presign = presigns[index]
      item.status = UPLOAD_STATUS.QUEUED
      item.progress = 0
    })
    emit()
  } catch (error) {
    items.forEach((item) => {
      item.status = UPLOAD_STATUS.ERROR
      item.error = error.message || 'Failed to get upload URLs'
    })
    emit()
    return { items, uploaded: [] }
  }

  await runPool(items, concurrency, async (item) => {
    if (item.status === UPLOAD_STATUS.ERROR) {
      return
    }

    try {
      item.status = UPLOAD_STATUS.UPLOADING
      item.progress = 0
      item.error = null
      emit()

      const { etag } = await uploadFileToPresignedUrl({
        url: item.presign.url,
        file: item.file,
        contentType: item.contentType,
        onProgress: (progress) => {
          item.progress = progress
          emit()
        },
      })

      item.status = UPLOAD_STATUS.CREATING
      item.progress = 100
      emit()

      const createResponse = await createExampleImage({
        client,
        type,
        tags,
        originalFileName: item.presign.originalFileName,
        storageFileName: item.presign.storageFileName,
        imageKey: item.presign.key,
        ...(etag ? { etag } : {}),
        uploadedBy: uploadedBy || null,
      })

      item.exampleImageId = createResponse.data._id
      item.status = skipThumbnails ? UPLOAD_STATUS.DONE : UPLOAD_STATUS.THUMBNAIL
      item.progress = 100
      emit()
    } catch (error) {
      item.status = UPLOAD_STATUS.ERROR
      item.error = error.message || 'Upload failed'
      emit()
    }
  })

  const successfulIds = items
    .filter((item) => item.exampleImageId)
    .map((item) => item.exampleImageId)

  if (successfulIds.length === 0) {
    return { items, uploaded: [] }
  }

  if (!skipThumbnails) {
    try {
      await waitForThumbnails(successfulIds)
      items
        .filter((item) => item.exampleImageId)
        .forEach((item) => {
          item.status = UPLOAD_STATUS.DONE
          item.progress = 100
        })
    } catch (error) {
      items
        .filter((item) => item.exampleImageId)
        .forEach((item) => {
          item.status = UPLOAD_STATUS.DONE
          item.error = item.error || error.message
        })
    }

    emit()
  }

  if (skipFetchUploaded) {
    return { items, uploaded: [] }
  }

  const uploaded = await fetchExampleImagesByIds(successfulIds)
  return { items, uploaded }
}

/**
 * Large library import: auto-chunk presign batches, skip thumbnails and post-upload preview fetch.
 */
export async function runBulkExampleImageUploadPipeline({
  client,
  type,
  tags,
  uploadedBy,
  files,
  onProgress,
  concurrency = BULK_UPLOAD_CONCURRENCY,
  shouldCancel,
}) {
  const imageFiles = files.filter(isExampleImageFile)
  const skipped = files.length - imageFiles.length
  const total = imageFiles.length
  let succeeded = 0
  let failed = 0
  const failures = []
  const batches = chunkFiles(imageFiles)

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    if (shouldCancel?.()) {
      return {
        succeeded,
        failed,
        total,
        skipped,
        cancelled: true,
        failures,
      }
    }

    const batch = batches[batchIndex]

    onProgress?.({
      phase: 'batch',
      batchIndex: batchIndex + 1,
      batchCount: batches.length,
      succeeded,
      failed,
      total,
      currentFileName: batch[0]?.name,
    })

    const { items } = await runExampleImageUploadPipeline({
      client,
      type,
      tags,
      uploadedBy,
      files: batch,
      skipThumbnails: true,
      skipFetchUploaded: true,
      concurrency,
      maxFiles: PRESIGN_BATCH_SIZE,
      onItemUpdate: (nextItems) => {
        const batchSucceeded =
          succeeded +
          nextItems.filter((item) => item.exampleImageId || item.status === UPLOAD_STATUS.DONE).length
        const batchFailed = failed + nextItems.filter((item) => item.status === UPLOAD_STATUS.ERROR).length
        const inFlight = nextItems.find(
          (item) =>
            item.status === UPLOAD_STATUS.UPLOADING ||
            item.status === UPLOAD_STATUS.CREATING ||
            item.status === UPLOAD_STATUS.PRESIGNING,
        )

        onProgress?.({
          phase: 'uploading',
          batchIndex: batchIndex + 1,
          batchCount: batches.length,
          succeeded: batchSucceeded,
          failed: batchFailed,
          total,
          currentFileName: inFlight?.fileName ?? null,
        })
      },
    })

    for (const item of items) {
      if (item.exampleImageId) {
        succeeded += 1
      } else if (item.status === UPLOAD_STATUS.ERROR) {
        failed += 1
        failures.push({ name: item.fileName, error: item.error || 'Upload failed' })
      }
    }

    onProgress?.({
      phase: 'batch-done',
      batchIndex: batchIndex + 1,
      batchCount: batches.length,
      succeeded,
      failed,
      total,
    })
  }

  return {
    succeeded,
    failed,
    total,
    skipped,
    cancelled: false,
    failures,
  }
}
