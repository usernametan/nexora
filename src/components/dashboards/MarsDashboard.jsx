import { subjectGroups, vaultFiles } from '../../data/mockData'
import { ChevronRightIcon, FileIcon, SearchIcon, SparkIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

export function MarsDashboard() {
  return (
    <div className="dashboard-page mars-dashboard">
      <header className="dashboard-header vault-header">
        <div>
          <p className="eyebrow"><span /> Mars · Knowledge vault</p>
          <h1>What you know,<br />within reach.</h1>
          <p className="dashboard-date">26 resources across 3 subjects</p>
        </div>
        <label className="vault-search">
          <SearchIcon />
          <span className="sr-only">Search the knowledge vault</span>
          <input type="search" placeholder="Search your cosmos" readOnly />
          <kbd>⌘ K</kbd>
        </label>
      </header>

      <div className="subject-grid">
        {subjectGroups.map((subject) => (
          <GlassPanel className="subject-card" key={subject.id}>
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
      </div>

      <GlassPanel className="files-panel">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Recently added</p>
            <h2>Knowledge files</h2>
          </div>
          <button className="text-action" type="button">View all files <ChevronRightIcon /></button>
        </div>
        <div className="file-table">
          <div className="file-table__head">
            <span>Name</span><span>Subject</span><span>Pages</span><span>Updated</span><span />
          </div>
          {vaultFiles.map((file) => (
            <button className="file-row" type="button" key={file.name}>
              <span className="file-name"><i><FileIcon /></i><strong>{file.name}</strong><small>{file.size}</small></span>
              <span>{file.subject}</span>
              <span>{file.pages}</span>
              <span>{file.updated}</span>
              <ChevronRightIcon />
            </button>
          ))}
        </div>
        <p className="prototype-note">Preview files are illustrative and do not open in this prototype.</p>
      </GlassPanel>
    </div>
  )
}
