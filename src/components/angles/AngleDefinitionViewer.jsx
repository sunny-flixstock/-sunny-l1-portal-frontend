import Markdown from 'react-markdown'

export function AngleDefinitionViewer({ markdown, className = '' }) {
  const content = markdown?.trim() ?? ''

  if (!content) {
    return <p className="angle-definition-empty">No definition content.</p>
  }

  return (
    <div className={`angle-definition-viewer ${className}`.trim()}>
      <Markdown>{content}</Markdown>
    </div>
  )
}
