import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout'
import { Button } from '../../components/ui'
import { useAuth } from '../../auth/AuthProvider'

interface BatchResult {
    successCount: number
    errorCount: number
    errors: string[]
}

export function BatchProjectsUpload() {
    const { token } = useAuth()
    const [jsonInput, setJsonInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<BatchResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const exampleJson = `{
  "projects": [
    {
      "name": "ERP to CRM Sync",
      "description": "Synchronize customer data from ERP to CRM",
      "sourceSystemExternalId": "SYS-ERP",
      "targetSystemExternalId": "SYS-CRM",
      "profiles": [
        {
          "name": "Customer Mapping",
          "sourceObjectName": "Customer",
          "targetObjectName": "Account",
          "mappings": [
            {
              "sourceFieldPath": "customer.id",
              "targetFieldPath": "account.externalId",
              "transformationLogic": null
            }
          ]
        }
      ]
    }
  ]
}`

    const handleSubmit = async () => {
        setIsLoading(true)
        setError(null)
        setResult(null)

        try {
            const parsed = JSON.parse(jsonInput)
            const response = await fetch('/api/admin/projects/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(parsed)
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            setResult(data)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const loadExample = () => {
        setJsonInput(exampleJson)
    }

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Link to="/admin" className="hover:text-blue-600">Admin</Link>
                    <span>/</span>
                    <span>Batch Projects Upload</span>
                </div>

                <PageHeader
                    title="Batch Projects Upload"
                    description="Upload mapping projects, profiles, and field mappings"
                />

                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">JSON Input</label>
                        <Button variant="secondary" size="sm" onClick={loadExample}>
                            Load Example
                        </Button>
                    </div>

                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full h-80 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Paste your JSON here..."
                    />

                    <div className="flex gap-3">
                        <Button onClick={handleSubmit} disabled={isLoading || !jsonInput.trim()}>
                            {isLoading ? 'Uploading...' : 'Upload Projects'}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {result && (
                        <div className={`p-4 rounded-lg border ${result.errorCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="font-medium mb-2">
                                Upload Complete: {result.successCount} succeeded, {result.errorCount} failed
                            </div>
                            {result.errors.length > 0 && (
                                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                    {result.errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
