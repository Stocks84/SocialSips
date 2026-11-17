import 'server-only'
import type { Metadata } from 'next'
import { getViewer } from '@/lib/server/viewer'
import { adminMetadata } from '@/lib/share-meta'

/** `export const generateMetadata = adminTitle('Reports')` on an admin page: the title only shows for admins. */
export const adminTitle = (title: string) => async (): Promise<Metadata> => adminMetadata(title, (await getViewer()).isAdmin)
