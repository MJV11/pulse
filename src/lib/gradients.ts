export const GRADIENTS = [
  'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
  'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
]

export function gradientFor(id: string) {
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return GRADIENTS[hash % GRADIENTS.length]
  }