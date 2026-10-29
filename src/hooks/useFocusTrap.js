import { useEffect } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return undefined
    const node = ref.current
    const previous = document.activeElement

    const focusables = () => [...node.querySelectorAll(FOCUSABLE)].filter((element) => (
      element.offsetParent !== null || element === document.activeElement
    ))

    const initial = node.querySelector('[autofocus]') || focusables()[0] || node
    window.setTimeout(() => initial.focus?.(), 0)

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) {
        event.preventDefault()
        node.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', handleKeyDown)
    return () => {
      node.removeEventListener('keydown', handleKeyDown)
      if (previous instanceof HTMLElement) previous.focus?.()
    }
  }, [active, ref])
}
