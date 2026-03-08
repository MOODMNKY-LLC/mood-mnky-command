/**
 * Haptic feedback utilities for mobile devices
 * Uses the Vibration API where available
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

const patterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 25, 50, 25, 50],
}

/**
 * Trigger haptic feedback on supported devices
 */
export function haptic(type: HapticType = 'light') {
  if (typeof window === 'undefined') return
  
  // Check for Vibration API support
  if ('vibrate' in navigator) {
    navigator.vibrate(patterns[type])
  }
}

/**
 * Light tap feedback - for button presses
 */
export function hapticLight() {
  haptic('light')
}

/**
 * Medium tap feedback - for selections
 */
export function hapticMedium() {
  haptic('medium')
}

/**
 * Heavy tap feedback - for important actions
 */
export function hapticHeavy() {
  haptic('heavy')
}

/**
 * Success feedback pattern
 */
export function hapticSuccess() {
  haptic('success')
}

/**
 * Warning feedback pattern
 */
export function hapticWarning() {
  haptic('warning')
}

/**
 * Error feedback pattern
 */
export function hapticError() {
  haptic('error')
}
