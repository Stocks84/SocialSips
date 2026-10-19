/** Small success confirmation after an edit (?saved=1). */
export default function SavedBanner({ show, text = 'Changes saved ✅' }: { show: boolean; text?: string }) {
  if (!show) return null
  return <p className="card-glass p-3 mb-4 text-sm text-accent-cyan" role="status" data-testid="saved-banner">{text}</p>
}
