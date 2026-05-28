/**
 * AdminPage — platform management panel.
 *
 * Sections:
 *  1. System stats cards
 *  2. User management table — search, role badge, promote/deactivate
 *
 * Guard: redirects non-admin users to dashboard.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import adminService from '@/services/admin.service'
import type { AdminUser } from '@/services/admin.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, string> = {
  admin:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  moderator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  user:      'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_STYLE[role] ?? ROLE_STYLE.user}`}>
      {role}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-neutral-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  )
}

// ── User row actions ──────────────────────────────────────────────────────────

function UserRow({ user, onRoleChange, onToggleActive, isMutating }: {
  user: AdminUser
  onRoleChange: (id: string, role: string) => void
  onToggleActive: (id: string, active: boolean) => void
  isMutating: boolean
}) {
  return (
    <tr className="bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-neutral-800 dark:text-neutral-100">{user.username}</p>
          <p className="text-xs text-neutral-400">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-neutral-500">Lv.{user.level} / {user.total_xp} XP</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
        }`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-neutral-400">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {user.role === 'user' && (
            <Button
              size="sm"
              variant="outline"
              disabled={isMutating}
              onClick={() => onRoleChange(user.id, 'admin')}
              className="text-xs py-1"
            >
              Make Admin
            </Button>
          )}
          {user.role === 'admin' && (
            <Button
              size="sm"
              variant="outline"
              disabled={isMutating}
              onClick={() => onRoleChange(user.id, 'user')}
              className="text-xs py-1"
            >
              Demote
            </Button>
          )}
          <Button
            size="sm"
            variant={user.is_active ? 'outline' : 'primary'}
            disabled={isMutating}
            onClick={() => onToggleActive(user.id, !user.is_active)}
            className="text-xs py-1"
          >
            {user.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser, isLoading: userLoading } = useCurrentUser()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const isAdmin = currentUser?.role === 'admin'

  // All hooks must be called before any early return
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
    enabled: isAdmin,
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () => adminService.getUsers({ search: search || undefined, page, page_size: 20 }),
    enabled: isAdmin,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminService.updateActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const isMutating = roleMutation.isPending || activeMutation.isPending

  // Guard: redirect non-admins (after all hooks)
  if (!userLoading && currentUser && !isAdmin) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Admin Panel</h1>
        <p className="text-neutral-500">Platform management and user oversight</p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats ? (
          <>
            <StatCard label="Users" value={stats.total_users} icon="👥" />
            <StatCard label="Active" value={stats.active_users} icon="✅" />
            <StatCard label="Sessions" value={stats.total_sessions} icon="⌨️" />
            <StatCard label="Languages" value={stats.total_languages} icon="🌐" />
            <StatCard label="Lessons" value={stats.total_lessons} icon="📚" />
            <StatCard label="Awards" value={stats.total_achievements_awarded} icon="🏅" />
          </>
        ) : (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        )}
      </section>

      {/* User management */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Users</h2>
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search username or email…"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {usersLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Progress</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {users?.items.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onRoleChange={(id, role) => roleMutation.mutate({ id, role })}
                      onToggleActive={(id, active) => activeMutation.mutate({ id, active })}
                      isMutating={isMutating}
                    />
                  ))}
                  {users?.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users && users.pages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-neutral-500">
                <span>Showing {users.items.length} of {users.total} users</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    ← Prev
                  </Button>
                  <span className="px-3 py-1.5 text-neutral-400">{page} / {users.pages}</span>
                  <Button variant="outline" size="sm" disabled={page >= users.pages} onClick={() => setPage(p => p + 1)}>
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
