import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useSystems, useDataObjects } from '../../api/hooks'
import { useAuth } from '../../auth/AuthProvider'
import { PageHeader } from '../../components/layout'
import { Button, toast } from '../../components/ui'
import { CreateProfileModal } from './CreateProfileModal'
import { useQueryClient } from '@tanstack/react-query'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: project, isLoading } = useProject(id!)
  const { data: systems } = useSystems()
  const { isAdmin, token } = useAuth()

  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false)
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null)

  const sourceSystem = systems?.find((s) => s.id === project?.sourceSystemId)
  const targetSystem = systems?.find((s) => s.id === project?.targetSystemId)

  const { data: sourceDataObjects } = useDataObjects(
    project?.sourceSystemId || ''
  )
  const { data: targetDataObjects } = useDataObjects(
    project?.targetSystemId || ''
  )

  const handleDeleteProfile = async (e: React.MouseEvent, profileId: string, profileName: string) => {
    e.stopPropagation() // Prevent navigating to mapper

    if (!confirm(`Are you sure you want to delete profile "${profileName}"? This will delete all mappings.`)) {
      return
    }

    setDeletingProfileId(profileId)
    try {
      const response = await fetch(`/api/projects/${id}/profiles/${profileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['project', id] })
        toast('Profile deleted', 'success')
      } else {
        toast('Failed to delete profile', 'error')
      }
    } catch {
      toast('Failed to delete profile', 'error')
    } finally {
      setDeletingProfileId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Project not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={project.name || 'Project Details'}
        backTo="/projects"
        actions={
          <Button onClick={() => setIsCreateProfileOpen(true)}>
            + Add Mapping Profile
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">
                  Source System
                </h3>
                <p className="text-lg font-semibold text-slate-900">
                  {sourceSystem?.name || 'Unknown'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">
                  Target System
                </h3>
                <p className="text-lg font-semibold text-slate-900">
                  {targetSystem?.name || 'Unknown'}
                </p>
              </div>
              {project.description && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">
                    Description
                  </h3>
                  <p className="text-slate-700">{project.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Mapping Profiles ({project.profiles?.length ?? 0})
        </h2>

        {!project.profiles || project.profiles.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            No mapping profiles yet. Create a profile to start mapping fields
            between source and target data objects.
          </div>
        ) : (
          <div className="grid gap-4">
            {project.profiles.map((profile) => (
              <div
                key={profile.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/mapping/${profile.id}`)}
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span>
                          Source:{' '}
                          <strong>{profile.sourceObjectName || 'Unknown'}</strong>
                        </span>
                        <span className="text-slate-400">→</span>
                        <span>
                          Target:{' '}
                          <strong>{profile.targetObjectName || 'Unknown'}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Open Mapper
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => handleDeleteProfile(e, profile.id, profile.name || 'profile')}
                          disabled={deletingProfileId === profile.id}
                        >
                          {deletingProfileId === profile.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
        projectId={id!}
        sourceDataObjects={sourceDataObjects || []}
        targetDataObjects={targetDataObjects || []}
        onCreated={(profileId) => {
          setIsCreateProfileOpen(false)
          navigate(`/mapping/${profileId}`)
        }}
      />
    </div>
  )
}
