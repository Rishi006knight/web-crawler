export const motionTokens = {
  duration: {
    fast: 120, // press, hover, micro-feedback
    base: 200, // standard state transitions
    slow: 320, // drawer/modal entry
    deliberate: 480 // staged reveals
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)'
  }
} as const;
