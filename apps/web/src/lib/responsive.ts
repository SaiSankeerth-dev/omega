'use client';

// Responsive layout utilities for Omega

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Check if a media query matches (client-side only)
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`).matches;
}

/**
 * Create a media query string for a given breakpoint
 */
export function minWidth(breakpoint: Breakpoint): string {
  return `(min-width: ${breakpoints[breakpoint]}px)`;
}

export function maxWidth(breakpoint: Breakpoint): string {
  return `(max-width: ${breakpoints[breakpoint] - 1}px)`;
}

/**
 * Responsive spacing scale
 */
export const spacing = {
  section: {
    mobile: 'py-12',
    tablet: 'sm:py-16',
    desktop: 'lg:py-20',
  },
  container: {
    mobile: 'px-4',
    tablet: 'sm:px-6',
    desktop: 'lg:px-8',
  },
} as const;
