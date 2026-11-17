import Link from 'next/link'
import AdminTabs from '@/components/admin/AdminTabs'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import SubmitButton from '@/components/ui/SubmitButton'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { formatDate } from '@/lib/format'
import { setSuspension } from './actions'
import { adminTitle } from '@/lib/server/page-meta'

export const generateMetadata = adminTitle('Accounts · Admin')
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; saved?: string }> }) {
  const supabase = await createClient()
  const { isAdmin } = await getViewer()
  if (!supabase || !isAdmin) notFound()
  const { q = '', error, saved } = await searchParams
  const query = q.trim().slice(0, 40)
  // No query: the currently suspended accounts. With a query: usernames starting with it.
  const { data } = await supabase.rpc('admin_list_users', query ? { p_query: query } : {})
  const users = data ?? []

  return (
    <>
      <PageHeader title="Accounts" subtitle="Suspend or restore an account. Suspended members can browse but can’t post or interact." />
      <AdminTabs active="users" />
      {error && <p role="alert" className="card p-4 mb-4 text-sm text-danger" data-testid="admin-users-error">{error.slice(0, 200)}</p>}
      {saved && <p role="status" className="card p-4 mb-4 text-sm text-accent">Account {saved === 'suspended' ? 'suspended' : 'restored'}</p>}
      <form className="card p-5 mb-6 flex flex-wrap items-end gap-3" role="search">
        <label className="text-sm flex-1 min-w-48">Username starts with
          <input name="q" defaultValue={query} maxLength={40} className="input mt-1" placeholder="e.g. alex" />
        </label>
        <button className="btn-secondary text-sm py-2 px-4" type="submit">Find</button>
      </form>
      <h2 className="font-bold mb-3">{query ? `Matches for “${query}”` : 'Suspended accounts'} <span className="text-ink-3 font-normal text-sm">({users.length})</span></h2>
      {users.length === 0 && <p className="card p-6 text-center text-ink-2">{query ? 'No matching accounts.' : 'Nobody is suspended.'}</p>}
      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="card p-5" data-testid="admin-user">
            <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
              <Link href={`/profile/${u.username}`} className="text-accent">@{u.username}</Link>
              {u.is_admin && <span className="chip">Admin</span>}
              {u.suspended_at && <span className="chip">Suspended {formatDate(u.suspended_at)}</span>}
            </div>
            {u.suspended_at && u.suspension_reason && <p className="text-sm text-ink-2 mb-3">Reason: {u.suspension_reason}</p>}
            {u.is_admin ? (
              <p className="text-sm text-ink-3">Admin accounts can’t be suspended.</p>
            ) : (
              <form action={setSuspension} className="space-y-2 max-w-md">
                <input type="hidden" name="userId" value={u.id} />
                <input type="hidden" name="q" value={query} />
                {u.suspended_at ? (
                  <SubmitButton className="btn-secondary text-sm py-2 px-4" pendingLabel="Restoring…">Restore account</SubmitButton>
                ) : (
                  <>
                    <input type="hidden" name="suspend" value="1" />
                    <label className="text-sm block">Reason (shown to the member, optional)
                      <input name="reason" maxLength={500} className="input mt-1" />
                    </label>
                    <SubmitButton className="btn-danger text-sm py-2 px-4" confirm={`Suspend @${u.username}?`} pendingLabel="Suspending…">Suspend account</SubmitButton>
                  </>
                )}
              </form>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
