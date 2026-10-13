import { ArrowLeftIcon } from './Icons'

export function BackButton({ onClick, disabled = false }) {
  return (
    <button className="back-button" type="button" onClick={onClick} disabled={disabled}>
      <ArrowLeftIcon />
      <span>Back to Cosmos</span>
    </button>
  )
}
