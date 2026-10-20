import { useState } from 'react'
import { useProfile } from '../../context/profile'
import { jupiterBudget, jupiterCategories, jupiterExpenses } from '../../data/mockData'
import { useCurrentDay, useLocalStorage } from '../../hooks/useLocalStorage'
import { createId, formatMoney, formatShortDate, todayIso } from '../../utils/format'
import { CheckIcon, EditIcon, PlusIcon, TrashIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const emptyDraft = (date = todayIso()) => ({ title: '', amount: '', category: 'food', date })

const categoryFor = (id) => jupiterCategories.find((category) => category.id === id) ?? {
  id: 'other',
  label: 'Other',
  color: '#8b98a8',
}

export function JupiterDashboard() {
  const { profile } = useProfile()
  const today = useCurrentDay(profile.timezone)
  const [expenses, setExpenses] = useLocalStorage('personal-cosmos:jupiter-expenses', jupiterExpenses)
  const [draft, setDraft] = useState(() => emptyDraft(today))
  const [editingId, setEditingId] = useState(null)
  const safeExpenses = Array.isArray(expenses) ? expenses : jupiterExpenses
  const month = today.slice(0, 7)
  const monthExpenses = safeExpenses.filter((expense) => String(expense.date).startsWith(month))
  const total = monthExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0)
  const remaining = jupiterBudget - total
  const spentPercent = Math.min(100, Math.round((total / jupiterBudget) * 100))
  const sortedExpenses = [...monthExpenses].sort((first, second) => String(second.date).localeCompare(String(first.date)))
  const categoryTotals = jupiterCategories.map((category) => ({
    ...category,
    total: monthExpenses
      .filter((expense) => expense.category === category.id)
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
  }))
  const amountValue = Number(draft.amount)

  const startEdit = (expense) => {
    setEditingId(expense.id)
    setDraft({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(emptyDraft(today))
  }

  const submitExpense = (event) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title || !(amountValue > 0)) return
    const nextExpense = {
      title,
      amount: Math.round(amountValue * 100) / 100,
      category: draft.category,
      date: draft.date || today,
    }
    if (editingId) {
      setExpenses((current) => (Array.isArray(current) ? current : jupiterExpenses).map((expense) => (
        expense.id === editingId ? { ...expense, ...nextExpense } : expense
      )))
    } else {
      setExpenses((current) => [...(Array.isArray(current) ? current : jupiterExpenses), {
        id: createId('expense'),
        ...nextExpense,
      }])
    }
    cancelEdit()
  }

  const removeExpense = (expenseId) => {
    setExpenses((current) => (Array.isArray(current) ? current : jupiterExpenses).filter((expense) => expense.id !== expenseId))
    if (editingId === expenseId) cancelEdit()
  }

  return (
    <div className="dashboard-page jupiter-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Jupiter · Expense tracker</p>
          <h1>Money, in<br />plain sight.</h1>
          <p className="dashboard-date">Every small entry keeps the whole picture honest.</p>
        </div>
        <div className="mercury-count jupiter-count">
          <strong>{formatMoney(total)}</strong>
          <span>spent this month</span>
        </div>
      </header>

      <div className="jupiter-layout">
        <GlassPanel className="spend-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Monthly budget</p>
              <h2>Orbit allowance</h2>
            </div>
            <span className="section-count">{monthExpenses.length} entries</span>
          </div>
          <div className="spend-total">
            {formatMoney(total)}
            <span>of {formatMoney(jupiterBudget)}</span>
          </div>
          <div className="budget-track" aria-label={`${spentPercent}% of monthly budget used`}>
            <span className={remaining < 0 ? 'is-over' : ''} style={{ width: `${spentPercent}%` }} />
          </div>
          <div className="spend-stats">
            <div>
              <span>{remaining < 0 ? 'Over budget' : 'Remaining'}</span>
              <strong className={remaining < 0 ? 'is-over' : ''}>{formatMoney(Math.abs(remaining))}</strong>
            </div>
            <div>
              <span>Daily average</span>
              <strong>{formatMoney(total / Math.max(1, Number(today.slice(8, 10))))}</strong>
            </div>
          </div>
          <div className="category-breakdown">
            {categoryTotals.map((category) => (
              <div className="category-row" key={category.id}>
                <span className="category-name"><i style={{ background: category.color }} />{category.label}</span>
                <div className="category-track">
                  <span style={{ width: `${total ? (category.total / total) * 100 : 0}%`, background: category.color }} />
                </div>
                <strong>{formatMoney(category.total)}</strong>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="expense-entry-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{editingId ? 'Editing expense' : 'Log spending'}</p>
              <h2>{editingId ? 'Correct the entry' : 'Add an expense'}</h2>
            </div>
          </div>
          <form className="item-form expense-form" onSubmit={submitExpense}>
            <input
              className="field-input"
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="What did you spend on?"
              aria-label="Expense title"
            />
            <div className="field-row">
              <input
                className="field-input"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={draft.amount}
                onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                placeholder="Amount"
                aria-label="Expense amount"
              />
              <select
                className="field-input field-select"
                value={draft.category}
                onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                aria-label="Expense category"
              >
                {jupiterCategories.map((category) => (
                  <option value={category.id} key={category.id}>{category.label}</option>
                ))}
              </select>
            </div>
            <input
              className="field-input field-input--date"
              type="date"
              value={draft.date}
              onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              aria-label="Expense date"
            />
            <div className="form-actions">
              <button className="primary-action" type="submit" disabled={!draft.title.trim() || !(amountValue > 0)}>
                {editingId ? <CheckIcon /> : <PlusIcon />}
                {editingId ? 'SAVE ENTRY' : 'LOG EXPENSE'}
              </button>
              {editingId && (
                <button className="secondary-action" type="button" onClick={cancelEdit}>CANCEL</button>
              )}
            </div>
          </form>
        </GlassPanel>
      </div>

      <GlassPanel className="expense-list-panel">
        <div className="section-heading">
          <div>
            <p className="section-kicker">This month</p>
            <h2>Expense log</h2>
          </div>
          <span className="section-count">{formatMoney(total)}</span>
        </div>
        <div className="expense-list">
          <div className="expense-list__head">
            <span>Entry</span><span>Category</span><span>Date</span><span>Amount</span><span />
          </div>
          {sortedExpenses.map((expense) => {
            const category = categoryFor(expense.category)
            return (
              <div className="expense-row" key={expense.id}>
                <span className="expense-title"><i style={{ background: category.color }} />{expense.title}</span>
                <span>{category.label}</span>
                <span>{formatShortDate(expense.date)}</span>
                <strong>{formatMoney(expense.amount)}</strong>
                <div className="row-actions">
                  <button className="icon-action" type="button" onClick={() => startEdit(expense)} aria-label={`Edit ${expense.title}`}>
                    <EditIcon />
                  </button>
                  <button className="icon-action icon-action--danger" type="button" onClick={() => removeExpense(expense.id)} aria-label={`Delete ${expense.title}`}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })}
          {sortedExpenses.length === 0 && <p className="empty-state">No expenses this month. Log the first one above.</p>}
        </div>
      </GlassPanel>
    </div>
  )
}
