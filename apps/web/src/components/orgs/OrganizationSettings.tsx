'use client'

import { useState, useEffect } from 'react'

interface OrgMember {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: { id: string; name: string; email: string; avatarUrl: string | null }
}

interface Organization {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  ownerId: string
  createdAt: string
  owner: { id: string; name: string; email: string; avatarUrl: string | null }
  members: OrgMember[]
  _count: { members: number; projects: number }
}

interface OrganizationSettingsProps {
  onClose: () => void
}

export function OrganizationSettings({ onClose }: OrganizationSettingsProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EDITOR')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrgs()
  }, [])

  const loadOrgs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/organizations')
      const data = await res.json()
      if (data.success) {
        setOrganizations(data.data?.organizations ?? data.organizations ?? [])
      }
    } catch {
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const createOrg = async () => {
    if (!newName || !newSlug) return
    setError(null)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, slug: newSlug }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        setNewName('')
        setNewSlug('')
        loadOrgs()
      } else {
        setError(data.error || 'Failed to create organization')
      }
    } catch {
      setError('Failed to create organization')
    }
  }

  const inviteMember = async (orgId: string) => {
    if (!inviteEmail) return
    setError(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (data.success) {
        setInviteEmail('')
        loadOrgs()
      } else {
        setError(data.error || 'Failed to invite member')
      }
    } catch {
      setError('Failed to invite member')
    }
  }

  const removeMember = async (orgId: string, memberId: string) => {
    try {
      await fetch(`/api/organizations/${orgId}/members/${memberId}`, { method: 'DELETE' })
      loadOrgs()
    } catch {
      // silent
    }
  }

  const deleteOrg = async (orgId: string) => {
    if (!window.confirm('Delete this organization? This cannot be undone.')) return
    try {
      await fetch(`/api/organizations/${orgId}`, { method: 'DELETE' })
      setSelectedOrg(null)
      loadOrgs()
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse h-24 rounded-xl bg-white/5" />
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl p-6"
        style={{
          backgroundColor: '#0d0d1a',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Organizations</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage teams and permissions</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-all"
          >
            New Org
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 p-4 rounded-xl border border-white/10">
            <h3 className="text-sm font-medium text-white mb-3">Create Organization</h3>
            <div className="space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Organization name"
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-violet-500/50"
              />
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="org-slug"
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-violet-500/50"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all">
                  Cancel
                </button>
                <button onClick={createOrg} disabled={!newName || !newSlug}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orgs list */}
        {organizations.length === 0 && !showCreate && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No organizations yet</p>
            <p className="text-xs text-gray-600 mt-1">Create an organization to collaborate with your team</p>
          </div>
        )}

        <div className="space-y-3">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="rounded-xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setSelectedOrg(selectedOrg?.id === org.id ? null : org)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{org.name.charAt(0)}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{org.name}</p>
                    <p className="text-[10px] text-gray-500">{org.slug} · {org._count.members} members · {org._count.projects} projects</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-500 transition-transform ${selectedOrg?.id === org.id ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {selectedOrg?.id === org.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                  {/* Invite */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Invite Member</h4>
                    <div className="flex gap-2">
                      <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 outline-none focus:border-violet-500/50"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 outline-none"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="ADMIN">Admin</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button onClick={() => inviteMember(org.id)} disabled={!inviteEmail}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50"
                      >
                        Invite
                      </button>
                    </div>
                  </div>

                  {/* Members */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Members ({org.members.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {org.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-violet-400">
                                {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-300">{member.user.name || member.user.email}</p>
                              <p className="text-[10px] text-gray-600">{member.role.toLowerCase()}</p>
                            </div>
                          </div>
                          {org.ownerId === member.userId ? (
                            <span className="text-[10px] text-violet-400 font-medium">Owner</span>
                          ) : (
                            <button onClick={() => removeMember(org.id, member.id)}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="pt-3 border-t border-white/5">
                    <button onClick={() => deleteOrg(org.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete organization
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
