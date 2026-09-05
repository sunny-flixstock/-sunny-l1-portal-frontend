export const ALLOWED_IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'

export const ALLOWED_IMAGE_FORMAT_LABEL = 'JPEG, JPG, or PNG'

const ALLOWED_EXT = /\.(jpe?g|png)$/i

export function isAllowedUploadImageFile(file) {
  if (!file) {
    return false
  }
  const mime = file.type?.toLowerCase()
  if (mime === 'image/jpeg' || mime === 'image/png') {
    return true
  }
  return ALLOWED_EXT.test(file.name || '')
}

export function allowedImageRejectMessage(fileName) {
  return `${fileName} is not a supported image (only ${ALLOWED_IMAGE_FORMAT_LABEL} allowed)`
}
