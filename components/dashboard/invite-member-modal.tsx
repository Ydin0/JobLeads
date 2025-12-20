'use client'

import { useState } from 'react'
import { X, Mail, Shield, User, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Invitation {
  id: string
  emailAddress: string
  role: string
  status: string
  createdAt: number
}

interface InviteMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingInvitations: Invitation[]
  onInvite: (email: string, role: 'admin' | 'member') => Promise<void>
  onRevokeInvitation: (invitationId: string) => Promise<void>
}

export function InviteMemberModal({
  open,
  onOpenChange,
  pendingInvitations,
  onInvite,
  onRevokeInvitation,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsInviting(true)
    try {
      await onInvite(email.trim(), role)
      setEmail('')
      setRole('member')
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    setRevokingId(invitationId)
    try {
      await onRevokeInvitation(invitationId)
    } catch (err) {
      console.error('Failed to revoke invitation:', err)
    } finally {
      setRevokingId(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#0a0a0f]">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-lg font-semibold text-black dark:text-white">
          Invite Team Member
        </h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          Send an invitation to join your organization
        </p>

        <form onSubmit={handleInvite} className="mt-6 space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="h-10 w-full rounded-lg border border-black/10 bg-white pl-11 pr-4 text-sm text-black placeholder:text-black/40 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              Role
            </label>
            <div className="mt-1.5 flex gap-3">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  role === 'member'
                    ? 'border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-400 dark:bg-violet-500/10 dark:text-violet-400'
                    : 'border-black/10 text-black/60 hover:border-black/20 dark:border-white/10 dark:text-white/60 dark:hover:border-white/20'
                }`}
              >
                <User className="size-4" />
                Member
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  role === 'admin'
                    ? 'border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-400 dark:bg-violet-500/10 dark:text-violet-400'
                    : 'border-black/10 text-black/60 hover:border-black/20 dark:border-white/10 dark:text-white/60 dark:hover:border-white/20'
                }`}
              >
                <Shield className="size-4" />
                Admin
              </button>
            </div>
            <p className="mt-2 text-xs text-black/40 dark:text-white/40">
              {role === 'admin'
                ? 'Admins can manage team members and organization settings'
                : 'Members can use credits within their limits'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isInviting}
            className="w-full bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {isInviting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </form>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mt-6 border-t border-black/5 pt-6 dark:border-white/5">
            <h3 className="text-sm font-medium text-black dark:text-white">
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="mt-3 space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border border-black/5 bg-black/[0.02] px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-black dark:text-white">
                      {invitation.emailAddress}
                    </p>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      {invitation.role === 'org:admin' ? 'Admin' : 'Member'} · Sent {formatDate(invitation.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(invitation.id)}
                    disabled={revokingId === invitation.id}
                    className="ml-2 rounded-lg p-1.5 text-black/40 hover:bg-black/5 hover:text-red-500 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-red-400"
                  >
                    {revokingId === invitation.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
