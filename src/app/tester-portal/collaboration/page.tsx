'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ShareIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid 
} from '@heroicons/react/24/solid'

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  status: 'online' | 'away' | 'offline'
  current_task?: string
}

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'planning' | 'on_hold' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  team_members: string[]
  progress: number
  due_date: string
  created_at: string
}

interface Discussion {
  id: string
  title: string
  author: string
  project_id?: string
  replies_count: number
  last_activity: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
}

interface Document {
  id: string
  name: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'pdf'
  author: string
  project_id?: string
  shared_with: string[]
  last_modified: string
  size: string
}

interface Notification {
  id: string
  type: 'mention' | 'task_assigned' | 'project_update' | 'message'
  title: string
  message: string
  time: string
  read: boolean
}

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Sarah Johnson', role: 'Lead Tester', avatar: 'SJ', status: 'online', current_task: 'Reviewing district reports' },
  { id: '2', name: 'Mike Chen', role: 'Field Technician', avatar: 'MC', status: 'online', current_task: 'On-site testing at Metro Plaza' },
  { id: '3', name: 'Emily Rodriguez', role: 'Operations Manager', avatar: 'ER', status: 'away', current_task: 'Client meeting' },
  { id: '4', name: 'David Kim', role: 'QA Specialist', avatar: 'DK', status: 'online', current_task: 'Equipment calibration' },
  { id: '5', name: 'Lisa Park', role: 'Customer Relations', avatar: 'LP', status: 'offline' },
  { id: '6', name: 'Robert Wilson', role: 'Field Technician', avatar: 'RW', status: 'online', current_task: 'Route optimization' }
]

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Downtown District Compliance Audit',
    description: 'Complete compliance audit for all downtown commercial properties',
    status: 'active',
    priority: 'high',
    team_members: ['1', '2', '4'],
    progress: 67,
    due_date: '2024-02-15',
    created_at: '2024-01-08'
  },
  {
    id: '2',
    name: 'New Equipment Deployment',
    description: 'Deploy and train team on new testing equipment across all territories',
    status: 'active',
    priority: 'critical',
    team_members: ['1', '3', '4', '6'],
    progress: 34,
    due_date: '2024-01-30',
    created_at: '2024-01-02'
  },
  {
    id: '3',
    name: 'Customer Portal Enhancement',
    description: 'Implement customer feedback system and self-service features',
    status: 'planning',
    priority: 'medium',
    team_members: ['3', '5'],
    progress: 12,
    due_date: '2024-03-01',
    created_at: '2024-01-10'
  }
]

const mockDiscussions: Discussion[] = [
  {
    id: '1',
    title: 'New testing protocols for high-rise buildings',
    author: 'Sarah Johnson',
    project_id: '1',
    replies_count: 8,
    last_activity: '2 hours ago',
    priority: 'high',
    tags: ['protocols', 'high-rise', 'safety']
  },
  {
    id: '2',
    title: 'Equipment maintenance schedule optimization',
    author: 'David Kim',
    project_id: '2',
    replies_count: 15,
    last_activity: '4 hours ago',
    priority: 'medium',
    tags: ['maintenance', 'schedule', 'efficiency']
  },
  {
    id: '3',
    title: 'Customer feedback integration requirements',
    author: 'Lisa Park',
    project_id: '3',
    replies_count: 6,
    last_activity: '1 day ago',
    priority: 'medium',
    tags: ['customer', 'feedback', 'requirements']
  }
]

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Testing Protocol Standards v2.1',
    type: 'document',
    author: 'Sarah Johnson',
    project_id: '1',
    shared_with: ['2', '4', '6'],
    last_modified: '3 hours ago',
    size: '2.4 MB'
  },
  {
    id: '2',
    name: 'Equipment Deployment Checklist',
    type: 'spreadsheet',
    author: 'David Kim',
    project_id: '2',
    shared_with: ['1', '3', '6'],
    last_modified: '1 day ago',
    size: '156 KB'
  },
  {
    id: '3',
    name: 'Customer Journey Analysis',
    type: 'presentation',
    author: 'Emily Rodriguez',
    project_id: '3',
    shared_with: ['3', '5'],
    last_modified: '2 days ago',
    size: '8.7 MB'
  }
]

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'Mentioned in Downtown District discussion',
    message: 'Sarah Johnson mentioned you in "New testing protocols for high-rise buildings"',
    time: '1 hour ago',
    read: false
  },
  {
    id: '2',
    type: 'task_assigned',
    title: 'New task assigned',
    message: 'Equipment calibration task assigned to you by David Kim',
    time: '3 hours ago',
    read: false
  },
  {
    id: '3',
    type: 'project_update',
    title: 'Project milestone completed',
    message: 'Downtown District Compliance Audit reached 67% completion',
    time: '5 hours ago',
    read: true
  }
]

export default function TeamCollaboration() {
  const [activeTab, setActiveTab] = useState('projects')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-500'
      case 'active': return 'bg-green-500'
      case 'planning': return 'bg-blue-500'
      case 'on_hold': return 'bg-yellow-500'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return DocumentTextIcon
      case 'spreadsheet': return DocumentTextIcon
      case 'presentation': return DocumentTextIcon
      case 'pdf': return DocumentTextIcon
      default: return DocumentTextIcon
    }
  }

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/tester-portal/dashboard/crm"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <UserGroupIcon className="h-8 w-8 mr-3 text-blue-400" />
                Team Collaboration
              </h1>
              <p className="text-blue-200 mt-1">Enterprise team coordination and project management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="Search projects, discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
              />
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Project
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1 mb-8 w-fit">
          {[
            { id: 'projects', label: 'Projects', icon: DocumentTextIcon },
            { id: 'team', label: 'Team', icon: UserGroupIcon },
            { id: 'discussions', label: 'Discussions', icon: ChatBubbleLeftRightIcon },
            { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
            { id: 'notifications', label: 'Notifications', icon: InformationCircleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Active Projects</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {mockProjects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Team Members</h3>
                <p className="text-3xl font-bold text-green-400">{mockTeamMembers.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Avg Progress</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {Math.round(mockProjects.reduce((sum, p) => sum + p.progress, 0) / mockProjects.length)}%
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Online Now</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {mockTeamMembers.filter(m => m.status === 'online').length}
                </p>
              </div>
            </div>

            {/* Projects List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                      <p className="text-blue-200 text-sm mb-4">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(project.priority)}`}>
                        {project.priority.toUpperCase()}
                      </span>
                      <button className="p-1 text-blue-300 hover:text-white">
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-200">Progress</span>
                      <span className="text-white font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 text-blue-300 mr-1" />
                        <span className="text-blue-200">Due: {new Date(project.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded-full ${getStatusColor(project.status)} bg-opacity-20`}>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)} mr-2`} />
                        <span className="text-white text-xs capitalize">{project.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center -space-x-2">
                      {project.team_members.slice(0, 3).map((memberId) => {
                        const member = mockTeamMembers.find(m => m.id === memberId)
                        return member ? (
                          <div
                            key={memberId}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium border-2 border-slate-800"
                            title={member.name}
                          >
                            {member.avatar}
                          </div>
                        ) : null
                      })}
                      {project.team_members.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium border-2 border-slate-800">
                          +{project.team_members.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTeamMembers.map((member) => (
              <div key={member.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
                      {member.avatar}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-slate-800 ${getStatusColor(member.status)}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                    <p className="text-blue-200">{member.role}</p>
                    <p className={`text-xs font-medium mt-1 capitalize ${
                      member.status === 'online' ? 'text-green-400' : 
                      member.status === 'away' ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {member.status}
                    </p>
                  </div>
                </div>
                
                {member.current_task && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
                    <p className="text-blue-200 text-sm mb-1">Current Task</p>
                    <p className="text-white text-sm">{member.current_task}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Message
                  </button>
                  <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="space-y-6">
            {mockDiscussions.map((discussion) => (
              <div key={discussion.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{discussion.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-blue-200">
                      <span>Started by {discussion.author}</span>
                      <span>{discussion.last_activity}</span>
                      <span>{discussion.replies_count} replies</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(discussion.priority)}`}>
                    {discussion.priority.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {discussion.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/10 text-blue-300 text-xs rounded-full border border-white/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Join Discussion
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDocuments.map((document) => {
              const IconComponent = getTypeIcon(document.type)
              return (
                <div key={document.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <IconComponent className="h-8 w-8 text-blue-400 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{document.name}</h3>
                        <p className="text-blue-200 text-sm">By {document.author}</p>
                      </div>
                    </div>
                    <button className="p-1 text-blue-300 hover:text-white">
                      <ShareIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Last modified</span>
                      <span className="text-white">{document.last_modified}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Size</span>
                      <span className="text-white">{document.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Shared with</span>
                      <span className="text-white">{document.shared_with.length} people</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Open
                    </button>
                    <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20">
                      Share
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {mockNotifications.map((notification) => {
              let IconComponent = InformationCircleIcon
              let iconColor = 'text-blue-400'

              switch (notification.type) {
                case 'mention':
                  IconComponent = ChatBubbleLeftRightIcon
                  iconColor = 'text-yellow-400'
                  break
                case 'task_assigned':
                  IconComponent = CheckCircleIcon
                  iconColor = 'text-green-400'
                  break
                case 'project_update':
                  IconComponent = DocumentTextIcon
                  iconColor = 'text-purple-400'
                  break
                case 'message':
                  IconComponent = ChatBubbleLeftRightIcon
                  iconColor = 'text-blue-400'
                  break
              }

              return (
                <div 
                  key={notification.id} 
                  className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 ${
                    !notification.read ? 'border-blue-500/50 bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <IconComponent className={`h-6 w-6 ${iconColor} mt-1 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium">{notification.title}</h3>
                          <p className="text-blue-200 text-sm mt-1">{notification.message}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-300 text-xs">{notification.time}</span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}