export function GlassPanel({ as: Element = 'section', className = '', children, ...props }) {
  return (
    <Element className={`glass-panel ${className}`} {...props}>
      {children}
    </Element>
  )
}
