import { GridSkeleton } from '@/components/ui/Skeleton'

export default function CocktailsLoading() {
  return <GridSkeleton label="Loading cocktails…" count={6} imageClass="h-44" />
}
