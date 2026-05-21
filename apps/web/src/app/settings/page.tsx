'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { useToast } from '@/components/ToastProvider'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ThemeToggle } from '@/components/ui/ThemeSwitcher'
import { OrganizationSettings } from '@/components/orgs/OrganizationSettings'

/* ─── Sections ──────────────────────────────────────────────────────────── */

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-500 mb-4">{description}</p>}
      {children}
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-gray-400 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all"
      />
    </label>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, loadMe, logout } = useAuthStore()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showOrgs, setShowOrgs] = useState(false)

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user?.name) setName(user.name)
    if (user?.email) setEmail(user.email)
  }, [user])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('omega_access_token')
      await api.put('/users/me', { name }, token ?? undefined)
      toast('Profile updated successfully', 'success')
    } catch {
      toast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error')
      return
    }
    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error')
      return
    }

    setChangingPassword(true)
    try {
      const token = localStorage.getItem('omega_access_token')
      await api.put('/users/password', { currentPassword, newPassword }, token ?? undefined)
      toast('Password changed successfully', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast('Failed to change password', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816]">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 sm:px-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Settings' },
          ]} />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={async () => { await logout(); router.push('/auth') }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile */}
        <Section title="Profile" description="Update your personal information">
          <InputField label="Name" value={name} onChange={setName} placeholder="Your name" />
          <InputField label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </Section>

        {/* Password */}
        <Section title="Password" description="Change your account password">
          <InputField label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" />
          <InputField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Min. 8 characters" />
          <InputField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </Section>

        {/* Organizations */}
        <Section title="Organizations" description="Manage your teams and permissions">
          <p className="text-xs text-gray-500 mb-3">Organizations allow you to collaborate with team members on projects.</p>
          <button
            onClick={() => setShowOrgs(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-all"
          >
            Manage Organizations
          </button>
        </Section>

        {/* Preferences */}
        <Section title="Preferences" description="Customize your experience">
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" defaultChecked className="accent-violet-500" />
            <span className="text-sm text-gray-300">Enable email notifications</span>
          </label>
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" defaultChecked className="accent-violet-500" />
            <span className="text-sm text-gray-300">Auto-save edits</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="accent-violet-500" />
            <span className="text-sm text-gray-300">Show collaboration cursors</span>
          </label>
        </Section>

      {/* Organization Settings modal */}
      {showOrgs && (
        <OrganizationSettings onClose={() => setShowOrgs(false)} />
      )}

        {/* Danger Zone */}
        <Section title="Danger Zone" description="Irreversible actions">
          <p className="text-xs text-gray-500 mb-3">Once you delete your account, there is no going back.</p>
          <button
            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
          >
            Delete Account
          </button>
        </Section>
      </div>
    </div>
  )
}
