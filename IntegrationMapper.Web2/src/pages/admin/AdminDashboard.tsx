import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout'

export function AdminDashboard() {
    const adminCards = [
        {
            title: 'Batch Systems Upload',
            description: 'Upload a JSON file containing multiple systems to create or update them in bulk.',
            link: '/admin/systems',
            icon: '🏢',
            color: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Batch Data Objects Upload',
            description: 'Upload data objects with schemas and examples for multiple systems.',
            link: '/admin/dataobjects',
            icon: '📦',
            color: 'from-green-500 to-green-600'
        },
        {
            title: 'Batch Projects Upload',
            description: 'Upload mapping projects, profiles, and field mappings in bulk.',
            link: '/admin/projects',
            icon: '📋',
            color: 'from-orange-500 to-orange-600'
        },
        {
            title: 'User Management',
            description: 'Manage users and assign roles (Admin/User).',
            link: '/admin/users',
            icon: '👥',
            color: 'from-purple-500 to-purple-600'
        }
    ]

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-6xl mx-auto p-6">
                <PageHeader
                    title="Admin Dashboard"
                    description="Manage batch operations and users"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {adminCards.map((card) => (
                        <Link
                            key={card.link}
                            to={card.link}
                            className="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-slate-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                                    {card.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {card.description}
                                    </p>
                                </div>
                                <div className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                                    →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
