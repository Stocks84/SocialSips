import PeopleList from '@/components/social/PeopleList'

export const metadata = { title: 'Following' }

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <PeopleList username={username} which="following" />
}
