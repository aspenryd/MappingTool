import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSystems } from '../../api/hooks'
import { PageHeader } from '../../components/layout'
import { Button, Input } from '../../components/ui'
import { AddSystemModal } from './AddSystemModal'

export function SystemList() {
  const navigate = useNavigate()
  const { data: systems, isLoading, error } = useSystems()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const filteredSystems =
    systems?.filter((s) => {
      const term = searchTerm.toLowerCase()
      return (
        s.name?.toLowerCase().includes(term) ||
        s.category?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      )
    }) ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading systems...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load systems</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Integration Systems"
        actions={
          <div className="flex items-center gap-3">
            <Input
              placeholder="Filter systems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => setIsAddModalOpen(true)}>+ Add System</Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {filteredSystems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchTerm
              ? 'No systems found matching your criteria.'
              : 'No systems yet. Add your first system to get started.'}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSystems.map((system) => (
              <div
                key={system.id}
                className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {system.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>
                      Category: <strong>{system.category || 'N/A'}</strong>
                    </span>
                    {system.externalId && (
                      <span>
                        External ID: <strong>{system.externalId}</strong>
                      </span>
                    )}
                  </div>
                  {system.description && (
                    <p className="text-sm text-slate-600 mt-2">
                      {system.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/systems/${system.id}`)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSystemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}
