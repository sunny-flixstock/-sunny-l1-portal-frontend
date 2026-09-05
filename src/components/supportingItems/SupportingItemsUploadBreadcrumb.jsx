import { Breadcrumb } from 'antd'
import { Link } from 'react-router-dom'

export function SupportingItemsUploadBreadcrumb({ step, onGoToMap, disabled }) {
  const items = [
    {
      title: <Link to="/supporting-items">Supporting Items</Link>,
    },
    {
      title: <Link to="/supporting-items/upload">Upload supporting items</Link>,
    },
    {
      title:
        step === 'configure' && !disabled ? (
          <a
            href="/supporting-items/upload"
            onClick={(event) => {
              event.preventDefault()
              onGoToMap?.()
            }}
          >
            Map &amp; validate
          </a>
        ) : (
          'Map & validate'
        ),
    },
  ]

  if (step === 'configure') {
    items.push({ title: 'Configure upload' })
  }

  return <Breadcrumb items={items} />
}
