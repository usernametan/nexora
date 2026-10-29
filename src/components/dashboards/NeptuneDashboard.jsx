import { useRef, useState } from 'react'
import { useProfile } from '../../context/profile'
import { useToast } from '../../context/toast'
import { neptuneBookmarks } from '../../data/mockData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { createId, formatShortDate, hostFromUrl, todayIso } from '../../utils/format'
import { CheckIcon, EditIcon, ExternalLinkIcon, PlusIcon, SearchIcon, TrashIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const emptyDraft = { title: '', url: '', tags: '', note: '', folder: 'inbox' }
const defaultFolders = ['inbox', 'development', 'reference', 'design', 'reading']

const normalizeUrl = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

const parseTags = (value) => [...new Set(
  value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean),
)].slice(0, 6)

export function NeptuneDashboard() {
  const { profile } = useProfile()
  const { showToast } = useToast()
  const [bookmarks, setBookmarks] = useLocalStorage('personal-cosmos:neptune-bookmarks', neptuneBookmarks)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [folderFilter, setFolderFilter] = useState('all')
  const importRef = useRef(null)
  const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : neptuneBookmarks
  const normalizedUrl = normalizeUrl(draft.url)
  const needle = query.trim().toLowerCase()
  const folders = [...new Set([...defaultFolders, ...safeBookmarks.map((bookmark) => bookmark.folder).filter(Boolean)])]
  const visibleBookmarks = safeBookmarks
    .filter((bookmark) => folderFilter === 'all' || (bookmark.folder || 'inbox') === folderFilter)
    .filter((bookmark) => (
      !needle
      || bookmark.title.toLowerCase().includes(needle)
      || bookmark.url.toLowerCase().includes(needle)
      || bookmark.tags.some((tag) => tag.includes(needle))
    ))
    .sort((first, second) => String(second.added).localeCompare(String(first.added)))

  const startEdit = (bookmark) => {
    setEditingId(bookmark.id)
    setDraft({
      title: bookmark.title,
      url: bookmark.url,
      tags: bookmark.tags.join(', '),
      note: bookmark.note ?? '',
      folder: bookmark.folder ?? 'inbox',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  const submitBookmark = (event) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title || !normalizedUrl) return
    const nextBookmark = {
      title,
      url: normalizedUrl,
      tags: parseTags(draft.tags),
      note: draft.note.trim(),
      folder: draft.folder.trim().toLowerCase() || 'inbox',
    }
    if (editingId) {
      setBookmarks((current) => (Array.isArray(current) ? current : neptuneBookmarks).map((bookmark) => (
        bookmark.id === editingId ? { ...bookmark, ...nextBookmark } : bookmark
      )))
    } else {
      setBookmarks((current) => [...(Array.isArray(current) ? current : neptuneBookmarks), {
        id: createId('bookmark'),
        ...nextBookmark,
        added: todayIso(profile.timezone),
      }])
    }
    cancelEdit()
  }

  const removeBookmark = (bookmarkId) => {
    const removed = safeBookmarks.find((bookmark) => bookmark.id === bookmarkId)
    setBookmarks((current) => (Array.isArray(current) ? current : neptuneBookmarks).filter((bookmark) => bookmark.id !== bookmarkId))
    if (editingId === bookmarkId) cancelEdit()
    if (removed) {
      showToast(`Deleted “${removed.title}”`, {
        actionLabel: 'Undo',
        onAction: () => setBookmarks((current) => [...(Array.isArray(current) ? current : neptuneBookmarks), removed]),
      })
    }
  }

  const importBrowserBookmarks = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const html = await file.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const existing = new Set(safeBookmarks.map((bookmark) => bookmark.url))
      const imported = [...doc.querySelectorAll('a[href]')]
        .map((anchor) => ({
          title: (anchor.textContent || '').trim() || anchor.href,
          url: normalizeUrl(anchor.getAttribute('href')),
        }))
        .filter((item) => item.url && !existing.has(item.url))
        .filter((item) => {
          existing.add(item.url)
          return true
        })
        .map((item) => ({
          id: createId('bookmark'),
          title: item.title,
          url: item.url,
          tags: ['imported'],
          note: '',
          folder: 'inbox',
          added: todayIso(profile.timezone),
        }))
      if (!imported.length) return
      setBookmarks((current) => [...(Array.isArray(current) ? current : neptuneBookmarks), ...imported])
      showToast(`Imported ${imported.length} bookmark${imported.length === 1 ? '' : 's'}`, { tone: 'success' })
    } catch {
      showToast('That bookmarks file could not be read.', { tone: 'error' })
    }
  }

  return (
    <div className="dashboard-page neptune-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Neptune · Bookmark vault</p>
          <h1>Ideas worth<br />keeping.</h1>
          <p className="dashboard-date">Saved references, one calm orbit away.</p>
        </div>
        <div className="mercury-count">
          <strong>{safeBookmarks.length}</strong>
          <span>{safeBookmarks.length === 1 ? 'saved link' : 'saved links'}</span>
        </div>
      </header>

      <div className="neptune-layout">
        <GlassPanel className="bookmark-form-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{editingId ? 'Editing bookmark' : 'Save a reference'}</p>
              <h2>{editingId ? 'Update this link' : 'Add to the vault'}</h2>
            </div>
          </div>
          <form className="item-form bookmark-form" onSubmit={submitBookmark}>
            <input
              className="field-input"
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Give it a memorable title"
              aria-label="Bookmark title"
            />
            <input
              className="field-input"
              type="text"
              inputMode="url"
              value={draft.url}
              onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://example.com"
              aria-label="Bookmark URL"
            />
            <input
              className="field-input field-input--quiet"
              type="text"
              value={draft.tags}
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              placeholder="Tags, separated by commas"
              aria-label="Bookmark tags"
            />
            <input
              className="field-input field-input--quiet"
              type="text"
              value={draft.folder}
              onChange={(event) => setDraft((current) => ({ ...current, folder: event.target.value }))}
              placeholder="Folder (inbox)"
              aria-label="Bookmark folder"
              list="bookmark-folders"
            />
            <datalist id="bookmark-folders">
              {folders.map((folder) => <option value={folder} key={folder} />)}
            </datalist>
            <textarea
              className="field-input field-textarea"
              value={draft.note}
              onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              placeholder="Why is it worth keeping? (optional)"
              aria-label="Bookmark note"
              rows={3}
            />
            {draft.url && !normalizedUrl && <p className="field-hint">Use a valid http or https link.</p>}
            <div className="form-actions">
              <button className="primary-action" type="submit" disabled={!draft.title.trim() || !normalizedUrl}>
                {editingId ? <CheckIcon /> : <PlusIcon />}
                {editingId ? 'SAVE BOOKMARK' : 'SAVE LINK'}
              </button>
              {editingId && (
                <button className="secondary-action" type="button" onClick={cancelEdit}>CANCEL</button>
              )}
            </div>
          </form>
        </GlassPanel>

        <GlassPanel className="bookmark-list-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Your collection</p>
              <h2>Saved orbit</h2>
            </div>
            <div className="bookmark-tools">
              <label className="vault-search bookmark-search">
                <SearchIcon size={14} />
                <span className="sr-only">Search bookmarks</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter links"
                  aria-label="Search bookmarks"
                />
              </label>
              <select
                className="field-input field-select compact-select"
                value={folderFilter}
                onChange={(event) => setFolderFilter(event.target.value)}
                aria-label="Filter by folder"
              >
                <option value="all">All folders</option>
                {folders.map((folder) => <option value={folder} key={folder}>{folder}</option>)}
              </select>
              <button className="secondary-action compact-action" type="button" onClick={() => importRef.current?.click()}>
                IMPORT BROWSER
              </button>
              <input
                ref={importRef}
                className="sr-only"
                type="file"
                accept="text/html,.html"
                onChange={importBrowserBookmarks}
                aria-label="Import browser bookmarks HTML file"
              />
            </div>
          </div>

          <div className="bookmark-list">
            {visibleBookmarks.map((bookmark) => (
              <article className="bookmark-card" key={bookmark.id}>
                <div className="bookmark-card__heading">
                  <div>
                    <h3>{bookmark.title}</h3>
                    <span>{hostFromUrl(bookmark.url)}</span>
                  </div>
                  <a className="bookmark-open" href={bookmark.url} target="_blank" rel="noreferrer" aria-label={`Open ${bookmark.title}`}>
                    <ExternalLinkIcon />
                  </a>
                </div>
                {bookmark.note && <p>{bookmark.note}</p>}
                <div className="bookmark-footer">
                  <div className="tag-list">
                    <span className="folder-chip">{bookmark.folder || 'inbox'}</span>
                    {bookmark.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <time>{formatShortDate(bookmark.added)}</time>
                </div>
                <div className="bookmark-actions">
                  <button className="icon-action" type="button" onClick={() => startEdit(bookmark)} aria-label={`Edit ${bookmark.title}`}>
                    <EditIcon />
                  </button>
                  <button className="icon-action icon-action--danger" type="button" onClick={() => removeBookmark(bookmark.id)} aria-label={`Delete ${bookmark.title}`}>
                    <TrashIcon />
                  </button>
                </div>
              </article>
            ))}
            {visibleBookmarks.length === 0 && (
              <p className="empty-state">{safeBookmarks.length === 0 ? 'Nothing saved yet. Add your first link.' : 'No bookmarks match that filter.'}</p>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
