export const Theme = {
  colors: {
    bg: '#0b0e14',        // Infinite Void
    surface: '#0b0e14',   // Level 0 (The Void)
    surfaceLow: '#10131a', // Level 1 (The Deck)
    surfaceHigh: '#1c2028', // Level 2 (The Component)
    surfaceBright: '#282c36', // Level 3 (The Overlay - Glass base)
    primary: '#99f7ff',    // Neon Cyan (Bio-signal)
    primaryDark: '#00f1fe',
    secondary: '#c4dcfd',  // Cool Steel
    accent: '#6fb5ff',     // Tertiary
    text: '#ecedf6',       // On-Surface
    textSecondary: '#a9abb3', // Muted Tech
    error: '#ff716c',
    success: '#00e676',
    glass: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(153, 247, 255, 0.15)',
    outlineVariant: 'rgba(69, 72, 79, 0.15)', // The Ghost Border
  },
  fonts: {
    headline: 'SpaceGrotesk_700Bold',
    body: 'Manrope_400Regular',
    bodyBold: 'Manrope_700Bold',
    mono: 'SpaceGrotesk_400Regular',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12, // 'md' corner for 'machined' feel
    lg: 20,
    xl: 30,
    round: 9999,
  }
};
