'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

// Types for MUTX backend
interface Task {
  id: number
  title: string
  description?: string
  status: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'quality_review' | 'done' | 'awaiting_owner'
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
  assigned_to?: string
  created_by: string
  created_at: number
  updated_at: number
  due_date?: number
  tags?: string[]
  project_id?: number
  project_name?: string
  ticket_ref?: string
}

interface Agent {
  id: number
  name: string
  role: string
  status: 'offline' | 'idle' | 'busy' | 'error'
}

interface Project {
  id: number
  name: string
  slug: string
  ticket_prefix: string
  status: 'active' | 'archived'
}

const STATUS_COLUMNS = [
  { key: 'inbox', title: 'Inbox', color: 'bg-slate-500/20 text-slate-400' },
  { key: 'assigned', title: 'Assigned', color: 'bg-blue-500/20 text-blue-400' },
  { key: 'awaiting_owner', title: 'Awaiting Owner', color: 'bg-orange-500/20 text-orange-400' },
  { key: 'in_progress', title: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400' },
  { key: 'review', title: 'Review', color: 'bg-purple-500/20 text-purple-400' },
  { key: 'quality_review', title: 'Quality Review', color: 'bg-indigo-500/20 text-indigo-400' },
  { key: 'done', title: 'Done', color: 'bg-green-500/20 text-green-400' },
]

const AWAITING_OWNER_KEYWORDS = [
  'waiting for', 'waiting on', 'needs human', 'manual action',
  'owner action', 'human required', 'blocked on owner',
]

function detectAwaitingOwner(task: Task): boolean {
  if (task.status === 'awaiting_owner') return true
  if (task.status !== 'assigned' && task.status !== 'in_progress') return false
  const text = `${task.title} ${task.description || ''}`.toLowerCase()
  return AWAITING_OWNER_KEYWORDS.some(kw => text.includes(kw))
}

const priorityColors: Record<string, string> = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
  urgent: 'border-l-red-600',
}

export function TaskBoardPanel() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [tasksRes, agentsRes, projectsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/agents'),
        fetch('/api/projects'),
      ])

      if (!tasksRes.ok || !agentsRes.ok || !projectsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [tasksData, agentsData, projectsData] = await Promise.all([
        tasksRes.json(),
        agentsRes.json(),
        projectsRes.json(),
      ])

      setTasks(tasksData.tasks || [])
      setAgents(agentsData.agents || [])
      setProjects(projectsData.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Group tasks by status
  const tasksByStatus = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.key] = tasks.filter(task => {
      const effectiveStatus = detectAwaitingOwner(task) ? 'awaiting_owner' : task.status
      return effectiveStatus === column.key
    })
    return acc
  }, {} as Record<string, Task[]>)

  const formatTimestamp = (timestamp: number) => {
    const now = new Date().getTime()
    const diff = now - timestamp * 1000
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }

  const getTagColor = (tag: string) => {
    const lowerTag = tag.toLowerCase()
    if (lowerTag.includes('urgent') || lowerTag.includes('critical')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    if (lowerTag.includes('bug') || lowerTag.includes('fix')) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
    if (lowerTag.includes('feature') || lowerTag.includes('enhancement')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
    return 'bg-muted/10 text-muted-foreground border-muted/20'
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-96 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Task Board</h2>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 px-3 bg-background border border-border rounded-md text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={String(project.id)}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>Refresh</Button>
          <Button onClick={() => setShowCreateModal(true)}>New Task</Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 m-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {STATUS_COLUMNS.map(column => (
          <div
            key={column.key}
            className="flex-1 min-w-72 bg-card border border-border rounded-xl flex flex-col"
          >
            {/* Column Header */}
            <div className={`${column.color} px-4 py-3 rounded-t-xl flex justify-between items-center border-b border-border/30`}>
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-md">
                {tasksByStatus[column.key]?.length || 0}
              </span>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-2.5 space-y-2 min-h-32 overflow-y-auto">
              {tasksByStatus[column.key]?.map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`bg-card rounded-lg p-3 cursor-pointer border border-border/40 shadow-sm hover:shadow-md transition-all border-l-4 ${priorityColors[task.priority]}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                    {task.ticket_ref && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono shrink-0">
                        {task.ticket_ref}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <span className="text-xs text-muted-foreground">
                      {task.assigned_to || 'Unassigned'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatTimestamp(task.created_at)}</span>
                    </div>
                  </div>

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getTagColor(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {tasksByStatus[column.key]?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30">
                  <span className="text-xs">Drop tasks here</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          agents={agents}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchData}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          agents={agents}
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  )
}

// Task Detail Modal
function TaskDetailModal({
  task,
  agents,
  projects,
  onClose,
  onUpdate,
}: {
  task: Task
  agents: Agent[]
  projects: Project[]
  onClose: () => void
  onUpdate: () => void
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details')
  const [commentText, setCommentText] = useState('')

  const resolvedProjectName = task.project_name || projects.find(p => p.id === task.project_id)?.name

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      })
      if (res.ok) {
        setCommentText('')
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">{task.title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xl">×</Button>
          </div>
          
          {task.description && <p className="text-muted-foreground mb-4">{task.description}</p>}

          <div className="flex gap-2 mb-4">
            {(['details', 'comments'] as const).map(tab => (
              <Button
                key={tab}
                size="sm"
                variant={activeTab === tab ? 'default' : 'secondary'}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'details' ? 'Details' : 'Comments'}
              </Button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {task.ticket_ref && (
                <div><span className="text-muted-foreground">Ticket:</span> <span className="font-mono">{task.ticket_ref}</span></div>
              )}
              {resolvedProjectName && (
                <div><span className="text-muted-foreground">Project:</span> <span>{resolvedProjectName}</span></div>
              )}
              <div><span className="text-muted-foreground">Status:</span> <span>{task.status}</span></div>
              <div><span className="text-muted-foreground">Priority:</span> <span>{task.priority}</span></div>
              <div><span className="text-muted-foreground">Assigned:</span> <span>{task.assigned_to || 'Unassigned'}</span></div>
              <div><span className="text-muted-foreground">Created:</span> <span>{new Date(task.created_at * 1000).toLocaleDateString()}</span></div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full h-20 p-2 border border-border rounded-md bg-background text-foreground text-sm"
              />
              <Button onClick={handleAddComment}>Add Comment</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Create Task Modal
function CreateTaskModal({
  agents,
  projects,
  onClose,
  onCreated,
}: {
  agents: Agent[]
  projects: Project[]
  onClose: () => void
  onCreated: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    project_id: projects[0]?.id ? String(projects[0].id) : '',
    assigned_to: '',
    tags: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          project_id: formData.project_id ? Number(formData.project_id) : undefined,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          assigned_to: formData.assigned_to || undefined,
        }),
      })

      if (res.ok) {
        onCreated()
        onClose()
      }
    } catch (err) {
      console.error('Error creating task:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card border border-border rounded-lg max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-xl font-bold mb-4">Create New Task</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                >
                  {projects.map(project => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Unassigned</option>
                {agents.map(agent => (
                  <option key={agent.name} value={agent.name}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                placeholder="frontend, urgent, bug"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="submit" className="flex-1">Create Task</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskBoardPanel
