import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

interface FieldNodeData {
  label: string
  type: 'source' | 'target'
  path: string
  description?: string
  dataType: string
  length?: number
  example?: string
  isArray: boolean
  isMandatory: boolean
  schemaAttributes?: string
  sampleValues?: string[]
}

interface FieldNodeProps {
  data: FieldNodeData
}

export const FieldNode = memo(function FieldNode({ data }: FieldNodeProps) {
  let tooltip = `Path: ${data.path}\nType: ${data.dataType}${data.length ? ` (${data.length})` : ''}\nIsArray: ${data.isArray}\nRequired: ${data.isMandatory}\nDesc: ${data.description || 'N/A'}\nExample: ${data.example || 'N/A'}`

  if (data.sampleValues && data.sampleValues.length > 0) {
    tooltip += `\n\nSample Values:\n- ${data.sampleValues.join('\n- ')}`
  }

  if (data.schemaAttributes) {
    try {
      const attrs = JSON.parse(data.schemaAttributes)
      tooltip += `\n\nSchema Attributes:\n${JSON.stringify(attrs, null, 2)}`
    } catch {
      tooltip += `\n\nSchema Attributes: ${data.schemaAttributes}`
    }
  }

  return (
    <div
      title={tooltip}
      className="px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm min-w-[180px] cursor-pointer hover:border-blue-400 transition-colors"
    >
      {data.type === 'source' && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-slate-500 !border-2 !border-white !-right-1.5"
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-medium text-sm ${
            data.isMandatory ? 'text-red-700' : 'text-slate-900'
          }`}
        >
          {data.label}
          {data.isMandatory && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </span>
        {data.isArray && (
          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            []
          </span>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        {data.dataType}
        {data.length ? ` (${data.length})` : ''}
      </div>

      {data.type === 'target' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-slate-500 !border-2 !border-white !-left-1.5"
        />
      )}
    </div>
  )
})
