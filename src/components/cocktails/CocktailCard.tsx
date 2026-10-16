import Link from 'next/link'
import type { Cocktail } from '@/types/database'

type Props = Pick<Cocktail, 'id' | 'name' | 'description' | 'is_alcohol_free'>

export default function CocktailCard({ id, name, description, is_alcohol_free }: Props) {
  return (
    <Link href={`/cocktails/${id}`} className="card card-hover p-5 block">
      <h3 className="font-bold text-lg text-accent-cyan mb-1">🍸 {name}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
      {is_alcohol_free && <span className="badge badge-cyan mt-3">Alcohol-free</span>}
    </Link>
  )
}
