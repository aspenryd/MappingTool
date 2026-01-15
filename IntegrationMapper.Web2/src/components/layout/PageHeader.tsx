import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  description?: string
  backTo?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, backTo, actions }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <div className="flex items-center gap-4">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            title="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

