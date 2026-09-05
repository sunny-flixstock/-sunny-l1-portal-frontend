import { isAllowedUploadImageFile } from './allowedImageFormats.js'
import { uploadFileToPresignedUrl } from './s3Upload.js'

export const ANGLE_UPLOAD_STATUS = {
  QUEUED: 'queued',
  PRESIGNING: 'presigning',
  UPLOADING: 'uploading',
  DONE: 'done',
  ERROR: 'error',
}

export function isAngleImageFile(file) {
  return isAllowedUploadImageFile(file)
}

export async function uploadAngleImagesToS3({ files, presignFn, onItemUpdate }) {
  if (!files.length) {
    return []
  }

  const items = files.map((file, index) => ({
    index,
    file,
    fileName: file.name,
    uid: file.uid ?? `${file.name}-${index}`,
    contentType: file.type || 'application/octet-stream',
    status: ANGLE_UPLOAD_STATUS.QUEUED,
    progress: 0,
    error: null,
    presign: null,
  }))

  const emit = () => onItemUpdate?.(items.map((item) => ({ ...item })))

  emit()

  let presigns = []
  try {
    items.forEach((item) => {
      item.status = ANGLE_UPLOAD_STATUS.PRESIGNING
    })
    emit()

    const presignResponse = await presignFn({
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
      item.status = ANGLE_UPLOAD_STATUS.QUEUED
      item.progress = 0
    })
    emit()
  } catch (error) {
    items.forEach((item) => {
      item.status = ANGLE_UPLOAD_STATUS.ERROR
      item.error = error.message || 'Failed to get upload URLs'
    })
    emit()
    throw error
  }

  const uploaded = []

  for (const item of items) {
    try {
      item.status = ANGLE_UPLOAD_STATUS.UPLOADING
      item.progress = 0
      item.error = null
      emit()

      const { presign, file } = item

      await uploadFileToPresignedUrl({
        url: presign.url,
        file,
        contentType: file.type || presign.contentType,
        onProgress: (progress) => {
          item.progress = progress
          emit()
        },
      })

      item.status = ANGLE_UPLOAD_STATUS.DONE
      item.progress = 100
      emit()

      uploaded.push({
        imagePath: {
          key: presign.key,
          host: presign.bucket,
        },
        name: presign.originalFileName || file.name,
      })
    } catch (error) {
      item.status = ANGLE_UPLOAD_STATUS.ERROR
      item.error = error.message || 'Upload failed'
      emit()
      throw error
    }
  }

  return uploaded
}
