import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/auth'
import { useToast } from '../../context/toast'
import { subjectGroups, vaultFiles } from '../../data/mockData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { api } from '../../lib/api'
import { createId } from '../../utils/format'
import { CheckIcon, ChevronRightIcon, EditIcon, ExternalLinkIcon, FileIcon, SearchIcon, SparkIcon, TrashIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const RECENT_COUNT = 4
const subjects = subjectGroups.map((subject) => subject.name)
const emptyDraft = { name: '', subject: subjects[0], pages: '', size: '' }

const formatBytes = (bytes) => {
  const value = Number(bytes) || 0
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function MarsDashboard() {
  const { signedIn } = useAuth()
  const { showToast } = useToast()
  const [files, setFiles] = useLocalStorage('personal-cosmos:mars-files', vaultFiles)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [pickedFile, setPickedFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const searchRef = useRef(null)
  const fileInputRef = useRef(null)
  const needle = query.trim().toLowerCase()
  const safeFiles = Array.isArray(files) ? files : vaultFiles
  const groups = useMemo(() => subjectGroups.map((subject) => ({
    ...subject,
    count: safeFiles.filter((file) => file.subject === subject.name).length || subject.count,
  })), [safeFiles])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const visibleSubjects = groups.filter((subject) => (
    !needle
    || subject.name.toLowerCase().includes(needle)
    || subject.topics.some((topic) => topic.toLowerCase().includes(needle))
  ))
  const matchingFiles = [...safeFiles]
    .sort((first, second) => (Number(second.createdAt) || 0) - (Number(first.createdAt) || 0))
    .filter((file) => (
      !needle
      || file.name.toLowerCase().includes(needle)
      || file.subject.toLowerCase().includes(needle)
    ))
  const visibleFiles = needle || showAll ? matchingFiles : matchingFiles.slice(0, RECENT_COUNT)

  const resetDraft = () => {
    setDraft(emptyDraft)
    setEditingId(null)
    setPickedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startEdit = (file) => {
    setEditingId(file.id)
    setDraft({
      name: file.name,
      subject: file.subject,
      pages: String(file.pages ?? ''),
      size: file.size ?? '',
    })
    setPickedFile(null)
    setSelectedFile(null)
  }

  const submitFile = async (event) => {
    event.preventDefault()
    const name = draft.name.trim()
    if (!name) return
    setBusy(true)
    try {
      const metadata = {
        name,
        subject: draft.subject,
        pages: Math.max(0, Number(draft.pages) || 0),
        size: draft.size || '—',
      }
      if (pickedFile) {
        metadata.name = pickedFile.name
        metadata.size = formatBytes(pickedFile.size)
        if (signedIn) {
          const formData = new FormData()
          formData.append('file', pickedFile)
          const uploaded = await api.upload('/files', formData)
          metadata.fileId = uploaded.id
          metadata.downloadUrl = uploaded.downloadUrl
          metadata.contentType = uploaded.contentType
        }
      }
      if (editingId) {
        setFiles((current) => (Array.isArray(current) ? current : vaultFiles).map((file) => (
          file.id === editingId ? { ...file, ...metadata } : file
        )))
        showToast('Vault record updated.', { tone: 'success' })
      } else {
        setFiles((current) => [...(Array.isArray(current) ? current : vaultFiles), {
          id: createId('file'),
          ...metadata,
          createdAt: Date.now(),
          updated: 'Today',
        }])
        showToast(signedIn && pickedFile ? 'File uploaded to your vault.' : 'Vault record added.', { tone: 'success' })
      }
      resetDraft()
    } catch (error) {
      showToast(error.message || 'The file could not be uploaded.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const removeFile = async (file) => {
    setFiles((current) => (Array.isArray(current) ? current : vaultFiles).filter((item) => item.id !== file.id))
    setSelectedFile(null)
    if (editingId === file.id) resetDraft()
    if (file.fileId && signedIn) {
      try {
        await api.delete(`/files/${file.fileId}`)
      } catch {
        showToast('Record removed; the stored file could not be deleted.', { tone: 'error' })
        return
      }
      showToast(`Deleted “${file.name}”`, { tone: 'default' })
      return
    }
    showToast(`Deleted “${file.name}”`, {
      actionLabel: 'Undo',
      onAction: () => setFiles((current) => [...(Array.isArray(current) ? current : vaultFiles), file]),
    })
  }

  const toggleSubject = (subject) => {
    setQuery((current) => (current.toLowerCase() === subject.name.toLowerCase() ? '' : subject.name))
    setSelectedFile(null)
  }

  const downloadStoredFile = async (file) => {
    try {
      const blob = await api.download(`/files/${file.fileId}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1500)
    } catch (error) {
      showToast(error.message || 'The file could not be downloaded.', { tone: 'error' })
    }
  }

  return (
    <div className="dashboard-page mars-dashboard">
      <header className="dashboard-header vault-header">
        <div>
          <p className="eyebrow"><span /> Mars · Knowledge vault</p>
          <h1>What you know,<br />within reach.</h1>
          <p className="dashboard-date">{safeFiles.length} resources across {groups.length} subjects</p>
        </div>
        <label className="vault-search">
          <SearchIcon />
          <span className="sr-only">Search the knowledge vault</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your cosmos"
          />
          <kbd>⌘ K</kbd>
        </label>
      </header>

      <div className="subject-grid">
        {visibleSubjects.map((subject) => (
          <GlassPanel
            as="button"
            type="button"
            className={`subject-card ${needle === subject.name.toLowerCase() ? 'is-selected' : ''}`}
            key={subject.id}
            onClick={() => toggleSubject(subject)}
          >
            <div className="subject-icon" style={{ '--subject-color': subject.color }}>
              <SparkIcon size={19} />
            </div>
            <div className="subject-card__heading">
              <div>
                <h2>{subject.name}</h2>
                <span>{subject.count} resources</span>
              </div>
              <ChevronRightIcon />
            </div>
            <div className="topic-list">
              {subject.topics.map((topic) => <span key={topic}>{topic}</span>)}
            </div>
          </GlassPanel>
        ))}
        {visibleSubjects.length === 0 && <p className="empty-state">No subjects match “{query}”.</p>}
      </div>

      <GlassPanel className="mars-add-panel">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{editingId ? 'Editing record' : 'Add to the vault'}</p>
            <h2>{editingId ? 'Update this resource' : 'Index a file or note'}</h2>
          </div>
          <span className="section-count">{signedIn ? 'Cloud storage ready' : 'Metadata only when signed out'}</span>
        </div>
        <form className="item-form mars-form" onSubmit={submitFile}>
          <div className="field-row">
            <input
              className="field-input"
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="File name"
              aria-label="File name"
            />
            <select
              className="field-input field-select"
              value={draft.subject}
              onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
              aria-label="File subject"
            >
              {subjects.map((subject) => <option value={subject} key={subject}>{subject}</option>)}
            </select>
          </div>
          <div className="field-row">
            <input
              className="field-input compact-number"
              type="number"
              min="0"
              value={draft.pages}
              onChange={(event) => setDraft((current) => ({ ...current, pages: event.target.value }))}
              placeholder="Pages"
              aria-label="File pages"
            />
            <input
              className="field-input compact-number"
              type="text"
              value={draft.size}
              onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
              placeholder="Size"
              aria-label="File size"
            />
            <label className="file-picker">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(event) => setPickedFile(event.target.files?.[0] ?? null)}
                aria-label="Choose a file to upload"
              />
              <span>{pickedFile ? pickedFile.name : 'Choose file'}</span>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-action" type="submit" disabled={busy || !draft.name.trim()}>
              {editingId ? <CheckIcon /> : <FileIcon />}
              {busy ? 'UPLOADING…' : editingId ? 'SAVE RECORD' : 'ADD TO VAULT'}
            </button>
            {editingId && (
              <button className="secondary-action" type="button" onClick={resetDraft}>CANCEL</button>
            )}
          </div>
        </form>
      </GlassPanel>

      <GlassPanel className="files-panel">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{needle ? 'Matching the search' : showAll ? 'Complete vault' : 'Recently added'}</p>
            <h2>Knowledge files</h2>
          </div>
          <button
            className="text-action"
            type="button"
            onClick={() => setShowAll((current) => !current)}
            aria-expanded={showAll || Boolean(needle)}
          >
            {showAll ? 'Show recent' : `View all ${safeFiles.length} files`} <ChevronRightIcon />
          </button>
        </div>
        <div className="file-table">
          <div className="file-table__head">
            <span>Name</span><span>Subject</span><span>Pages</span><span>Updated</span><span />
          </div>
          {visibleFiles.map((file) => (
            <button
              className={`file-row ${selectedFile?.id === file.id ? 'is-selected' : ''}`}
              type="button"
              key={file.id}
              onClick={() => setSelectedFile((current) => (current?.id === file.id ? null : file))}
              aria-expanded={selectedFile?.id === file.id}
            >
              <span className="file-name"><i><FileIcon /></i><strong>{file.name}</strong><small>{file.size}</small></span>
              <span>{file.subject}</span>
              <span>{file.pages}</span>
              <span>{file.updated}</span>
              <ChevronRightIcon />
            </button>
          ))}
          {visibleFiles.length === 0 && <p className="empty-state">No files match “{query}”.</p>}
        </div>
        {selectedFile && (
          <div className="file-preview">
            <span className="file-preview__icon"><FileIcon size={20} /></span>
            <div>
              <strong>{selectedFile.name}</strong>
              <small>{selectedFile.subject} · {selectedFile.pages} pages · {selectedFile.size} · Updated {selectedFile.updated}</small>
              <p>
                {selectedFile.fileId
                  ? 'Stored in your private cloud vault.'
                  : 'Metadata record. Upload a real file while signed in to store its contents.'}
              </p>
            </div>
            <div className="file-preview__actions">
              {selectedFile.fileId && (
                <button className="secondary-action" type="button" onClick={() => downloadStoredFile(selectedFile)}>
                  <ExternalLinkIcon /> DOWNLOAD
                </button>
              )}
              <button className="icon-action" type="button" onClick={() => startEdit(selectedFile)} aria-label={`Edit ${selectedFile.name}`}>
                <EditIcon />
              </button>
              <button className="icon-action icon-action--danger" type="button" onClick={() => removeFile(selectedFile)} aria-label={`Delete ${selectedFile.name}`}>
                <TrashIcon />
              </button>
              <button className="text-action" type="button" onClick={() => setSelectedFile(null)}>Close</button>
            </div>
          </div>
        )}
        <p className="prototype-note">
          {signedIn
            ? 'Uploads are stored by the Java API. Metadata syncs with the rest of your cosmos.'
            : 'Sign in from settings to store real files. Until then, only metadata is saved on this device.'}
        </p>
      </GlassPanel>
    </div>
  )
}
