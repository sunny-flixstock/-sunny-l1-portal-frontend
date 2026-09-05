function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export { readFileAsText }

export function imageUrlFromAngleImage(image) {
  return image?.thumbPath?.url || image?.imagePath?.url || null
}
