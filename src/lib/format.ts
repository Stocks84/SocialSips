export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const commentCountLabel = (n: number) => `${n} comment${n === 1 ? '' : 's'}`
