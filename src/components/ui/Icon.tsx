import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

/** Decorative Font Awesome Free icon. The adjacent visible text (or the control's aria-label) carries the meaning. */
export function Icon({ icon, className }: { icon: IconDefinition; className?: string }) {
  return <FontAwesomeIcon icon={icon} className={className} aria-hidden="true" focusable="false" />
}
