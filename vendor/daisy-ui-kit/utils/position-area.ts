/**
 * Maps placement values to CSS position-area values for anchor positioning
 *
 * Using span to align edges:
 * - "bottom span-right" = below anchor, aligned to left edge (spans from left to center)
 * - "bottom span-left" = below anchor, aligned to right edge (spans from center to right)
 */
export function getPositionArea(placement: string): string {
  const positionMap: Record<string, string> = {
    // Top positions
    top: 'center top', // centered above
    'top-start': 'top span-right', // above, left edge aligned
    'top-end': 'top span-left', // above, right edge aligned

    // Right positions
    right: 'center right', // centered to right
    'right-start': 'right span-bottom', // right, top edge aligned
    'right-end': 'right span-top', // right, bottom edge aligned

    // Bottom positions (most common for dropdowns)
    bottom: 'center bottom', // centered below
    'bottom-start': 'bottom span-right', // below, left edge aligned
    'bottom-end': 'bottom span-left', // below, right edge aligned

    // Left positions
    left: 'center left', // centered to left
    'left-start': 'left span-bottom', // left, top edge aligned
    'left-end': 'left span-top', // left, bottom edge aligned
  }

  return positionMap[placement] || 'bottom span-right'
}

/**
 * Gets position-try-fallbacks for automatic repositioning
 */
export function getPositionFallbacks(_placement: string): string {
  // Simple flip fallbacks - flip to opposite side on same axis
  return 'flip-block, flip-inline'
}
