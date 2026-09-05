import { useMemo } from 'react'
import { AngleDefinitionViewer } from '../angles/AngleDefinitionViewer.jsx'
import { parseApiDocHtml } from '../../utils/parseApiDocHtml.js'

function HtmlDocViewer({ content }) {
  const { styles, bodyHtml } = useMemo(() => parseApiDocHtml(content), [content])

  return (
    <div className="api-doc-html">
      {styles ? <style>{styles}</style> : null}
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </div>
  )
}

export function ApiDocViewer({ doc }) {
  if (!doc?.content) {
    return null
  }

  if (doc.format === 'html') {
    return <HtmlDocViewer key={doc.name} content={doc.content} />
  }

  return <AngleDefinitionViewer markdown={doc.content} className="api-doc-markdown" />
}
