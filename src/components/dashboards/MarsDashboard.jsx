import { useEffect, useRef, useState } from 'react'
import { subjectGroups, vaultFiles } from '../../data/mockData'
import { ChevronRightIcon, FileIcon, SearchIcon, SparkIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const RECENT_COUNT = 4

export function MarsDashboard() {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const searchRef = useRef(null)
  const needle = query.trim().toLowerCase()

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

  const visibleSubjects = subjectGroups.filter((subject) => (
    !needle
    || subject.name.toLowerCase().includes(needle)
    || subject.topics.some((topic) => topic.toLowerCase().includes(needle))
  ))
  const matchingFiles = vaultFiles.filter((file) => (
    !needle
    || file.name.toLowerCase().includes(needle)
    || file.subject.toLowerCase().includes(needle)
  ))
  const visibleFiles = needle || showAll ? matchingFiles : matchingFiles.slice(0, RECENT_COUNT)

  const toggleSubject = (subject) => {
    setQuery((current) => (current.toLowerCase() === subject.name.toLowerCase() ? '' : subject.name))
    setSelectedFile(null)
  }

  return (
    <div className="dashboard-page mars-dashboard">
      <header className="dashboard-header vault-header">
        <div>
          <p className="eyebrow"><span /> Mars · Knowledge vault</p>
          <h1>What you know,<br />within reach.</h1>
          <p className="dashboard-date">{vaultFiles.length} resources across {subjectGroups.length} subjects</p>
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
            {showAll ? 'Show recent' : `View all ${vaultFiles.length} files`} <ChevronRightIcon />
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
              <p>This file is indexed in the local prototype. Select another row to compare metadata.</p>
            </div>
            <button className="text-action" type="button" onClick={() => setSelectedFile(null)}>Close preview</button>
          </div>
        )}
        <p className="prototype-note">Select a file to inspect its metadata. File contents are illustrative in this prototype.</p>
      </GlassPanel>
    </div>
  )
}
