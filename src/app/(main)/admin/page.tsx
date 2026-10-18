import { notFound, redirect } from 'next/navigation'
import { getViewer } from '@/lib/server/viewer'

/** /admin: admins land on the reports queue; everyone else gets a 404 (checked on the server). */
export default async function AdminIndexPage() {
  const { isAdmin } = await getViewer()
  if (!isAdmin) notFound()
  redirect('/admin/reports')
}
