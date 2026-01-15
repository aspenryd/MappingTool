import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useSystems } from '../../api/hooks'
import { PageHeader } from '../../components/layout'
import { Button, Input } from '../../components/ui'
import { CreateProjectModal } from './CreateProjectModal'

export function ProjectList() {
  const navigate = useNavigate()
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: systems } = useSystems()
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const systemsMap = useMemo(() => {
    const map: Record<string, string> = {}
    systems?.forEach((s) => {
      map[s.id] = s.name || 'Unknown'
    })
    return map
  }, [systems])

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    const term = searchTerm.toLowerCase()
    return projects.filter((p) => {
      const sourceName = systemsMap[p.sourceSystemId] || ''
      const targetName = systemsMap[p.targetSystemId] || ''
      return (
        p.name?.toLowerCase().includes(term) ||
        sourceName.toLowerCase().includes(term) ||
        targetName.toLowerCase().includes(term) ||
        p.profiles?.some((profile) =>
          profile.name?.toLowerCase().includes(term)
        )
      )
    })
  }, [projects, searchTerm, systemsMap])

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Mapping Projects"
        actions={
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search projects or systems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72"
            />
            <Button onClick={() => setIsCreateModalOpen(true)}>
              + Create New Project
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg text-slate-500">
            {searchTerm
              ? 'No projects found matching your search.'
              : 'No projects yet. Create your first mapping project to get started.'}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <span>
                      Source:{' '}
                      <strong className="text-slate-800">
                        {systemsMap[project.sourceSystemId] || 'Unknown'}
                      </strong>
                    </span>
                    <span className="text-slate-400">→</span>
                    <span>
                      Target:{' '}
                      <strong className="text-slate-800">
                        {systemsMap[project.targetSystemId] || 'Unknown'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>
                      {project.profiles?.length || 0} mapping profile(s)
                    </span>
                    {project.createdDate && (
                      <span>
                        Created:{' '}
                        {new Date(project.createdDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  Open Editor
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(id) => {
          setIsCreateModalOpen(false)
          navigate(`/projects/${id}`)
        }}
      />
    </div>
  )
}
