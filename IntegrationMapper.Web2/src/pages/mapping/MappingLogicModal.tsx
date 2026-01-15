import { useState } from 'react'
import { Modal, Button } from '../../components/ui'

interface MappingLogicModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (logic: string) => void
  currentLogic: string
  targetFieldName: string
  sourceFieldNames: string[]
}

export function MappingLogicModal({
  isOpen,
  onClose,
  onSave,
  currentLogic,
  targetFieldName,
  sourceFieldNames,
}: MappingLogicModalProps) {
  const [logic, setLogic] = useState(currentLogic)

  const handleSave = () => {
    onSave(logic)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transformation Logic" size="lg">
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600 mb-2">
            <strong>Mapping:</strong>{' '}
            <span className="text-blue-600">{sourceFieldNames.join(', ')}</span>
            {' → '}
            <span className="text-green-600">{targetFieldName}</span>
          </div>
          {sourceFieldNames.length > 1 && (
            <p className="text-xs text-amber-600">
              Multiple source fields are mapped to this target.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Transformation Logic / Comment
          </label>
          <textarea
            value={logic}
            onChange={(e) => setLogic(e.target.value)}
            placeholder="Describe the transformation logic, e.g., 'Concatenate FirstName and LastName with a space', 'Format as YYYY-MM-DD', 'Map 1=Active, 2=Inactive'"
            rows={4}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
          />
          <p className="text-xs text-slate-500">
            Add comments or describe the transformation logic for documentation
            and code generation.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Logic</Button>
        </div>
      </div>
    </Modal>
  )
}
