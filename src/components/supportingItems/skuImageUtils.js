function getPreviewUrl(image) {
  return image?.thumbPath?.url || image?.imagePath?.url
}

export { getPreviewUrl }
