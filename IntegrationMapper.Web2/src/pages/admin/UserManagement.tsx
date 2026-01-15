import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout'
import { Button, Modal } from '../../components/ui'
import { useAuth } from '../../auth/AuthProvider'

interface User {
    id: string
    email: string
    displayName: string
    role: string
    createdAt: string
    lastLoginAt: string | null
}

export function UserManagement() {
    const { token } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newUser, setNewUser] = useState({ email: '', displayName: '', role: 'User' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            }
        } catch (e) {
            setError('Failed to load users')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [token])

    const handleCreateUser = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            })
            if (response.ok) {
                setShowCreateModal(false)
                setNewUser({ email: '', displayName: '', role: 'User' })
                fetchUsers()
            } else {
                const errData = await response.text()
                setError(errData)
            }
        } catch {
            setError('Failed to create user')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            })
            if (response.ok) {
                fetchUsers()
            }
        } catch {
            setError('Failed to update role')
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                fetchUsers()
            }
        } catch {
            setError('Failed to delete user')
        }
    }

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Link to="/admin" className="hover:text-blue-600">Admin</Link>
                    <span>/</span>
                    <span>User Management</span>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <PageHeader
                        title="User Management"
                        description="Manage users and their roles"
                    />
                    <Button onClick={() => setShowCreateModal(true)}>
                        + Add User
                    </Button>
                </div>

                {error && (
                    <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-slate-500">No users found. Click "Add User" to create one.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Role</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Created</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{user.displayName}</td>
                                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                className={`px-2 py-1 rounded-lg text-sm font-medium border ${user.role === 'Admin'
                                                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                                    }`}
                                            >
                                                <option value="User">User</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create User Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Add New User"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={newUser.displayName}
                                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateUser} disabled={isSubmitting || !newUser.email || !newUser.displayName}>
                                {isSubmitting ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
