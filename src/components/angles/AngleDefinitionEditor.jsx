import { InboxOutlined } from '@ant-design/icons'
import { Radio, Upload, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import '@mdxeditor/editor/style.css'
import { readFileAsText } from '../../utils/angleHelpers.js'
import { MDXEditor, markdownEditorPlugins } from './markdownEditorPlugins.jsx'

const { Dragger } = Upload

export function AngleDefinitionEditor({ value, onChange, fillHeight = false }) {
  const [contentMode, setContentMode] = useState('edit')
  const editorRef = useRef(null)

  useEffect(() => {
    if (contentMode === 'edit') {
      editorRef.current?.setMarkdown(value ?? '')
    }
  }, [contentMode])

  function handleFileUpload(file) {
    readFileAsText(file)
      .then((text) => {
        onChange(text)
        editorRef.current?.setMarkdown(text)
        setContentMode('edit')
      })
      .catch(() => message.error('Failed to read file'))
    return false
  }

  return (
    <div
      className={`angle-definition-editor${fillHeight ? ' angle-definition-editor--fill' : ''}`}
    >
      <div className="angle-definition-editor__toolbar">
        <Radio.Group
          value={contentMode}
          onChange={(event) => setContentMode(event.target.value)}
          size="small"
        >
          <Radio.Button value="edit">Edit</Radio.Button>
          <Radio.Button value="upload">Upload .md</Radio.Button>
        </Radio.Group>
      </div>

      {contentMode === 'upload' ? (
        <Dragger accept=".md,.markdown,.txt" maxCount={1} beforeUpload={handleFileUpload}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a markdown file</p>
        </Dragger>
      ) : (
        <div className="angle-definition-editor__wysiwyg">
          <MDXEditor
            ref={editorRef}
            markdown={value ?? ''}
            onChange={onChange}
            plugins={markdownEditorPlugins}
            className="angle-definition-editor__mdx"
            contentEditableClassName="angle-definition-editor__content"
            placeholder="Start writing…"
          />
        </div>
      )}
    </div>
  )
}
