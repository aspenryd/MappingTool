import { useState } from 'react'
import { useCreateProfile } from '../../api/hooks'
import type { DataObjectDto } from '../../api/types'
import { Modal, Button, Input, toast } from '../../components/ui'

interface CreateProfileModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  sourceDataObjects: DataObjectDto[]
  targetDataObjects: DataObjectDto[]
  onCreated: (profileId: string) => void
}

export function CreateProfileModal({
  isOpen,
  onClose,
  projectId,
  sourceDataObjects,
  targetDataObjects,
  onCreated,
}: CreateProfileModalProps) {
  const createProfile = useCreateProfile()

  const [formData, setFormData] = useState({
    name: '',
    sourceObjectPublicId: '',
    targetObjectPublicId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast('Profile name is required', 'error')
      return
    }

    if (!formData.sourceObjectPublicId || !formData.targetObjectPublicId) {
      toast('Please select both source and target data objects', 'error')
      return
    }

    try {
      const result = await createProfile.mutateAsync({
        projectId,
        data: formData,
      })
      toast('Mapping profile created successfully', 'success')
      setFormData({
        name: '',
        sourceObjectPublicId: '',
        targetObjectPublicId: '',
      })
      onCreated(result.id)
    } catch {
      toast('Failed to create profile', 'error')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const autoGenerateName = () => {
    const source = sourceDataObjects.find(
      (d) => d.id === formData.sourceObjectPublicId
    )
    const target = targetDataObjects.find(
      (d) => d.id === formData.targetObjectPublicId
    )
    if (source && target) {
      setFormData((prev) => ({
        ...prev,
        name: `${source.name} to ${target.name}`,
      }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Mapping Profile" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Source Data Object
            </label>
            <select
              name="sourceObjectPublicId"
              value={formData.sourceObjectPublicId}
              onChange={(e) => {
                handleChange(e)
                setTimeout(autoGenerateName, 0)
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              required
            >
              <option value="">Select source object...</option>
              {sourceDataObjects.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.schemaType})
                </option>
              ))}
            </select>
            {sourceDataObjects.length === 0 && (
              <p className="text-xs text-amber-600">
                No data objects in source system. Upload schemas first.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Target Data Object
            </label>
            <select
              name="targetObjectPublicId"
              value={formData.targetObjectPublicId}
              onChange={(e) => {
                handleChange(e)
                setTimeout(autoGenerateName, 0)
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              required
            >
              <option value="">Select target object...</option>
              {targetDataObjects.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.schemaType})
                </option>
              ))}
            </select>
            {targetDataObjects.length === 0 && (
              <p className="text-xs text-amber-600">
                No data objects in target system. Upload schemas first.
              </p>
            )}
          </div>
        </div>

        <Input
          label="Profile Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Customer to Account Mapping"
          required
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createProfile.isPending ||
              sourceDataObjects.length === 0 ||
              targetDataObjects.length === 0
            }
          >
            {createProfile.isPending ? 'Creating...' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
