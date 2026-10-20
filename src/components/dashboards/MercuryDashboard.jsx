import { useState } from 'react'
import { mercuryItems } from '../../data/mockData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { createId, formatShortDate } from '../../utils/format'
import { CheckIcon, EditIcon, PlusIcon, TrashIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const emptyDraft = { title: '', detail: '', kind: 'errand' }

export function MercuryDashboard() {
  const [items, setItems] = useLocalStorage('personal-cosmos:mercury-items', mercuryItems)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const safeItems = Array.isArray(items) ? items : mercuryItems
  const openItems = safeItems.filter((item) => !item.done)
  const sortedItems = [...safeItems].sort((first, second) => (
    Number(first.done) - Number(second.done) || String(second.created).localeCompare(String(first.created))
  ))

  const startEdit = (item) => {
    setEditingId(item.id)
    setDraft({ title: item.title, detail: item.detail ?? '', kind: item.kind ?? 'note' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  const submitItem = (event) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    const detail = draft.detail.trim()
    if (editingId) {
      setItems((current) => (Array.isArray(current) ? current : mercuryItems).map((item) => (
        item.id === editingId ? { ...item, title, detail, kind: draft.kind } : item
      )))
    } else {
      setItems((current) => [...(Array.isArray(current) ? current : mercuryItems), {
        id: createId('mercury'),
        title,
        detail,
        kind: draft.kind,
        done: false,
        created: new Date().toISOString().slice(0, 10),
      }])
    }
    cancelEdit()
  }

  const toggleItem = (itemId) => {
    setItems((current) => (Array.isArray(current) ? current : mercuryItems).map((item) => (
      item.id === itemId ? { ...item, done: !item.done } : item
    )))
  }

  const removeItem = (itemId) => {
    setItems((current) => (Array.isArray(current) ? current : mercuryItems).filter((item) => item.id !== itemId))
    if (editingId === itemId) cancelEdit()
  }

  return (
    <div className="dashboard-page mercury-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Mercury · Quick notes & errands</p>
          <h1>Small things,<br />captured.</h1>
          <p className="dashboard-date">A short orbit for thoughts that cannot wait.</p>
        </div>
        <div className="mercury-count">
          <strong>{openItems.length}</strong>
          <span>{openItems.length === 1 ? 'open item' : 'open items'}</span>
        </div>
      </header>

      <div className="mercury-layout">
        <GlassPanel className="capture-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{editingId ? 'Editing item' : 'Quick capture'}</p>
              <h2>{editingId ? 'Update the details' : 'Drop it before it drifts'}</h2>
            </div>
            <span className="kind-chip">{draft.kind === 'note' ? 'Note' : 'Errand'}</span>
          </div>

          <form className="item-form capture-form" onSubmit={submitItem}>
            <input
              className="field-input"
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="What needs to be remembered?"
              aria-label="Item title"
            />
            <textarea
              className="field-input field-textarea"
              value={draft.detail}
              onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))}
              placeholder="A useful detail, place, or next step (optional)"
              aria-label="Item detail"
              rows={3}
            />
            <div className="segmented" role="group" aria-label="Item type">
              {['errand', 'note'].map((kind) => (
                <button
                  className={draft.kind === kind ? 'is-active' : ''}
                  type="button"
                  key={kind}
                  onClick={() => setDraft((current) => ({ ...current, kind }))}
                  aria-pressed={draft.kind === kind}
                >
                  {kind === 'errand' ? 'Errand' : 'Note'}
                </button>
              ))}
            </div>
            <div className="form-actions">
              <button className="primary-action" type="submit" disabled={!draft.title.trim()}>
                {editingId ? <CheckIcon /> : <PlusIcon />}
                {editingId ? 'SAVE ITEM' : 'CAPTURE'}
              </button>
              {editingId && (
                <button className="secondary-action" type="button" onClick={cancelEdit}>CANCEL</button>
              )}
            </div>
          </form>
        </GlassPanel>

        <GlassPanel className="mercury-list-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Current orbit</p>
              <h2>Notes & errands</h2>
            </div>
            <span className="section-count">{safeItems.length} total</span>
          </div>

          <div className="mercury-list">
            {sortedItems.map((item) => {
              const isDone = Boolean(item.done)
              return (
                <div className={`crud-row mercury-row ${isDone ? 'is-done' : ''}`} key={item.id}>
                  <button
                    className="crud-toggle"
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-pressed={isDone}
                    aria-label={`${isDone ? 'Reopen' : 'Complete'} ${item.title}`}
                  >
                    <span className="task-check"><CheckIcon /></span>
                  </button>
                  <div className="crud-copy">
                    <div className="crud-title-line">
                      <span className={`kind-chip kind-chip--${item.kind}`}>{item.kind === 'note' ? 'Note' : 'Errand'}</span>
                      <strong>{item.title}</strong>
                    </div>
                    {item.detail && <small>{item.detail}</small>}
                    <time>{formatShortDate(item.created)}</time>
                  </div>
                  <div className="row-actions">
                    <button className="icon-action" type="button" onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}>
                      <EditIcon />
                    </button>
                    <button className="icon-action icon-action--danger" type="button" onClick={() => removeItem(item.id)} aria-label={`Delete ${item.title}`}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}
            {safeItems.length === 0 && <p className="empty-state">Mercury is clear. Capture a note or errand to begin.</p>}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
