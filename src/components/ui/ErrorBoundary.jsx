import { Component } from 'react'
import { OrbitIcon, ResetIcon } from './Icons'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('Personal Cosmos UI error', error, info)
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="app-fallback" role="alert">
        <div className="app-fallback__card">
          <span className="app-fallback__mark"><OrbitIcon size={30} /></span>
          <p className="profile-kicker">Signal interrupted</p>
          <h1>This part of the cosmos could not render.</h1>
          <p>Your data is still saved on this device. Reload the page to reconnect the interface.</p>
          <div className="app-fallback__actions">
            <button className="primary-action" type="button" onClick={() => window.location.reload()}>
              <ResetIcon size={14} /> RELOAD
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                if (this.props.onReset) this.props.onReset()
                this.setState({ error: null })
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      </div>
    )
  }
}
