import { listProfiles } from '@/lib/actions/admin'
import { UsersTable } from './users-table'

export default async function AdminUsersPage() {
  const result = await listProfiles({ limit: 20, offset: 0 })
  const initialData = result.ok ? result.data : []
  const nextOffset = result.ok ? result.nextOffset : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage member roles. Approve pending users or change roles.
        </p>
      </div>
      <UsersTable initialProfiles={initialData} initialNextOffset={nextOffset} />
    </div>
  )
}
