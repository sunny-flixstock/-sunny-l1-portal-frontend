/**
 * PUT upload to S3 presigned URL with per-request progress (XHR).
 */
export function uploadFileToPresignedUrl({ url, file, contentType, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') {
        return
      }
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
      onProgress(percent)
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag')
        resolve({ etag })
        return
      }
      reject(new Error(`S3 upload failed (HTTP ${xhr.status})`))
    })

    xhr.addEventListener('error', () => {
      reject(new Error('S3 upload failed (network error)'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('S3 upload aborted'))
    })

    xhr.open('PUT', url, true)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.send(file)
  })
}
