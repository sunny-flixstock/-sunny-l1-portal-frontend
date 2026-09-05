import { Button } from 'antd'
import { useState } from 'react'
import { AngleDefinitionEditor } from '../angles/AngleDefinitionEditor.jsx'
import { FullPageMarkdownModal } from '../common/FullPageMarkdownModal.jsx'
import { useUpdateFrameworkVersionDomainDescription } from '../../hooks/useFrameworkVersions.js'
import { DOMAIN_LABELS } from '../../utils/domainConstants.js'

export function EditFrameworkDomainDescriptionModal({
  frameworkVersionId,
  domain,
  initialMarkdown = '',
  onClose,
  onSaved,
}) {
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const mutation = useUpdateFrameworkVersionDomainDescription()

  function handleSubmit() {
    const trimmed = markdown.trim()
    if (!trimmed) {
      return
    }

    mutation.mutate(
      {
        id: frameworkVersionId,
        domain,
        contentMarkdown: trimmed,
      },
      {
        onSuccess: (response) => {
          onSaved?.(response.data)
          onClose()
        },
      },
    )
  }

  const domainLabel = DOMAIN_LABELS[domain] ?? domain

  return (
    <FullPageMarkdownModal
      title={`Edit ${domainLabel} description`}
      onClose={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={mutation.isPending}
          disabled={!markdown.trim()}
          onClick={handleSubmit}
        >
          Save changes
        </Button>,
      ]}
    >
      <AngleDefinitionEditor value={markdown} onChange={setMarkdown} fillHeight />
    </FullPageMarkdownModal>
  )
}
