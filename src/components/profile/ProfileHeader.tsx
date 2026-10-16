export default function ProfileHeader({ username }: { username: string }) {
  return (
    <div className="card p-6 flex items-center gap-5 mb-8">
      <div className="w-20 h-20 rounded-full bg-purple-cyan flex items-center justify-center text-3xl shadow-neon-purple" aria-hidden="true">🥳</div>
      <div>
        <h1 className="text-2xl font-black">@{username}</h1>
        <p className="text-text-secondary text-sm">Party vibe: ✨ to be chosen · Favourite drink: 🍹 TBC</p>
      </div>
    </div>
  )
}
