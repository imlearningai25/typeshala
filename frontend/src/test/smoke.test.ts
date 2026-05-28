import { describe, it, expect } from 'vitest'
import { cn } from '@/utils/cn'

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves tailwind conflicts', () => {
    // tailwind-merge picks the last conflicting class
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignores falsy values', () => {
    const active = false
    expect(cn('a', active && 'b', undefined, 'c')).toBe('a c')
  })
})
