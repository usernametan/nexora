import { earthTasks } from '../data/mockData'
import {
  dailyStorageKey,
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
} from '../hooks/useLocalStorage'
import { PROFILE_KEY } from '../context/profile'
import { dateKey } from './format'

const EARTH_TASKS_KEY = 'personal-cosmos:earth-tasks'
const EARTH_COMPLETED_KEY = 'personal-cosmos:earth-completed'
const MOON_HYDRATION_KEY = 'personal-cosmos:moon-hydration'
const SATURN_SESSIONS_KEY = 'personal-cosmos:saturn-sessions'

const seedTarget = (key, value) => {
  if (readStoredValue(key, null) !== null) return
  writeStoredValue(key, value)
}

export function migrateLegacyStorage() {
  if (typeof window === 'undefined') return
  const profile = readStoredValue(PROFILE_KEY, null)
  const timeZone = profile && typeof profile === 'object' ? profile.timezone : undefined
  const today = dateKey(new Date(), timeZone)

  const legacyTasks = readStoredValue(EARTH_TASKS_KEY, null)
  if (Array.isArray(legacyTasks)) {
    seedTarget(dailyStorageKey(EARTH_TASKS_KEY, today), legacyTasks)
    removeStoredValue(EARTH_TASKS_KEY)
  } else {
    const completed = readStoredValue(EARTH_COMPLETED_KEY, null)
    if (Array.isArray(completed)) {
      seedTarget(dailyStorageKey(EARTH_TASKS_KEY, today), earthTasks.map((task) => ({
        ...task,
        done: completed.includes(task.id),
      })))
      removeStoredValue(EARTH_COMPLETED_KEY)
    }
  }

  const legacyHydration = readStoredValue(MOON_HYDRATION_KEY, null)
  if (typeof legacyHydration === 'number') {
    seedTarget(dailyStorageKey(MOON_HYDRATION_KEY, today), legacyHydration)
    removeStoredValue(MOON_HYDRATION_KEY)
  }

  const legacySessions = readStoredValue(SATURN_SESSIONS_KEY, null)
  if (Array.isArray(legacySessions)) {
    const grouped = legacySessions.reduce((dates, session) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(session.date))) {
        dates[session.date] = [...(dates[session.date] ?? []), session]
      }
      return dates
    }, {})
    Object.entries(grouped).forEach(([date, items]) => {
      seedTarget(dailyStorageKey(SATURN_SESSIONS_KEY, date), items)
    })
    removeStoredValue(SATURN_SESSIONS_KEY)
  }
}
