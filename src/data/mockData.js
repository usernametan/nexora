const isoDay = (offset = 0) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - offset)
  return date.toISOString().slice(0, 10)
}

export const planets = [
  {
    id: 'earth',
    name: 'Earth',
    module: 'Daily execution',
    description: 'Tasks, schedule, and the rhythm of today.',
    color: '#6ea8ff',
    texture: 'earth',
    radius: 0.4,
    orbitRadius: 2.25,
    orbitSpeed: 0.055,
    angle: 0.35,
    height: -0.1,
    tilt: 0.12,
    rotationSpeed: 0.12,
    locked: false,
  },
  {
    id: 'moon',
    name: 'Moon',
    module: 'Wellbeing',
    description: 'Sleep, hydration, energy, and personal cycles.',
    color: '#d9e2eb',
    texture: 'moon',
    radius: 0.27,
    orbitRadius: 3.15,
    orbitSpeed: 0.042,
    angle: 1.28,
    height: 0.48,
    tilt: -0.06,
    rotationSpeed: 0.07,
    locked: false,
  },
  {
    id: 'mars',
    name: 'Mars',
    module: 'Knowledge vault',
    description: 'Subjects, notes, papers, and everything learned.',
    color: '#e18768',
    texture: 'mars',
    radius: 0.34,
    orbitRadius: 4.15,
    orbitSpeed: 0.031,
    angle: 2.38,
    height: -0.48,
    tilt: 0.18,
    rotationSpeed: 0.09,
    locked: false,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    module: 'Deep work',
    description: 'Focus sessions, protected time, and flow.',
    color: '#d8b978',
    texture: 'saturn',
    radius: 0.52,
    orbitRadius: 5.55,
    orbitSpeed: 0.021,
    angle: -0.72,
    height: 0.4,
    tilt: 0.3,
    rotationSpeed: 0.1,
    locked: false,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    module: 'Quick notes & errands',
    description: 'Capture small tasks before they leave your mind.',
    color: '#a9adb4',
    texture: 'mercury',
    radius: 0.2,
    orbitRadius: 1.42,
    orbitSpeed: 0.078,
    angle: 2.18,
    height: 0.76,
    tilt: 0.05,
    rotationSpeed: 0.08,
    locked: false,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    module: 'Expense tracker',
    description: 'A clear view of spending, budgets, and future goals.',
    color: '#d6aa83',
    texture: 'jupiter',
    radius: 0.62,
    orbitRadius: 6.75,
    orbitSpeed: 0.016,
    angle: -1.48,
    height: -0.82,
    tilt: 0.08,
    rotationSpeed: 0.11,
    locked: false,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    module: 'Bookmark vault',
    description: 'Saved ideas and references from across the web.',
    color: '#739bdd',
    texture: 'neptune',
    radius: 0.49,
    orbitRadius: 8.05,
    orbitSpeed: 0.012,
    angle: -2.22,
    height: 0.56,
    tilt: -0.15,
    rotationSpeed: 0.09,
    locked: false,
  },
]

export const activePlanets = planets.filter((planet) => !planet.locked)
export const lockedPlanets = planets.filter((planet) => planet.locked)

export const earthTasks = [
  { id: 1, title: 'Complete DBMS assignment', meta: 'Academic · 90 min', done: true },
  { id: 2, title: 'Revise Binary Trees', meta: 'Study · 45 min', done: false },
  { id: 3, title: 'Finish Personal Cosmos UI', meta: 'Project · 2 hr', done: false },
  { id: 4, title: 'Submit project documentation', meta: 'Deadline · Today', done: false },
]

export const timeline = [
  { time: '08:00', title: 'Classes', detail: 'University block', tone: 'blue' },
  { time: '10:00', title: 'Computer Science', detail: 'Data structures', tone: 'violet' },
  { time: '12:00', title: 'Lunch', detail: 'Reset & recharge', tone: 'warm' },
  { time: '14:00', title: 'Project Work', detail: 'Personal Cosmos', tone: 'cyan' },
  { time: '17:00', title: 'LeetCode', detail: 'Trees · Medium', tone: 'violet' },
  { time: '20:00', title: 'Personal Time', detail: 'Offline', tone: 'green' },
]

export const calendarEvents = {
  8: { label: 'DBMS', tone: 'blue' },
  18: { label: 'Project deadline', tone: 'orange' },
  23: { label: 'GDGC', tone: 'violet' },
  25: { label: 'Exam', tone: 'red' },
  29: { label: 'Review', tone: 'green' },
}

export const moonMetrics = [
  { label: 'Sleep', value: '7h 42m', score: 86, color: '#b9c9e8' },
  { label: 'Hydration', value: '5 / 8', score: 63, color: '#74b8df' },
  { label: 'Energy', value: 'Steady', score: 74, color: '#9f8fd8' },
]

export const subjectGroups = [
  {
    id: 'computer-science',
    name: 'Computer Science',
    count: 12,
    color: '#6ea8ff',
    topics: ['Data Structures', 'DBMS', 'Operating Systems'],
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    count: 8,
    color: '#a996e8',
    topics: ['Calculus', 'Linear Algebra'],
  },
  {
    id: 'literature',
    name: 'Literature',
    count: 6,
    color: '#dc9a77',
    topics: ['English', 'Research Papers'],
  },
]

export const vaultFiles = [
  { id: 'dsa-notes', name: 'DSA_Notes.pdf', subject: 'Computer Science', pages: 24, size: '3.8 MB', updated: 'Today' },
  { id: 'dbms-module-3', name: 'DBMS_Module_3.pdf', subject: 'DBMS', pages: 31, size: '5.2 MB', updated: 'Yesterday' },
  { id: 'os-unit-2', name: 'OS_Unit_2.pdf', subject: 'Operating Systems', pages: 18, size: '2.7 MB', updated: 'Sep 21' },
  { id: 'research-paper', name: 'Research_Paper.pdf', subject: 'Research', pages: 42, size: '8.1 MB', updated: 'Sep 18' },
  { id: 'linear-algebra', name: 'Linear_Algebra_Cheatsheet.pdf', subject: 'Mathematics', pages: 12, size: '1.4 MB', updated: 'Sep 14' },
  { id: 'graphs', name: 'Graph_Algorithms.pdf', subject: 'Computer Science', pages: 36, size: '4.9 MB', updated: 'Sep 11' },
  { id: 'calculus', name: 'Calculus_Problem_Set.pdf', subject: 'Mathematics', pages: 21, size: '2.2 MB', updated: 'Sep 6' },
  { id: 'paper-notes', name: 'Research_Notes.pdf', subject: 'Literature', pages: 16, size: '1.9 MB', updated: 'Sep 2' },
]

export const focusSessions = [
  { id: 'focus-1', label: 'DSA', minutes: 45, color: '#75aaf4', date: isoDay(0) },
  { id: 'focus-2', label: 'Project', minutes: 80, color: '#a88ee5', date: isoDay(0) },
  { id: 'focus-3', label: 'DBMS', minutes: 79, color: '#d9ab72', date: isoDay(1) },
  { id: 'focus-4', label: 'DSA', minutes: 60, color: '#75aaf4', date: isoDay(2) },
  { id: 'focus-5', label: 'Project', minutes: 50, color: '#a88ee5', date: isoDay(4) },
  { id: 'focus-6', label: 'DBMS', minutes: 90, color: '#d9ab72', date: isoDay(5) },
]

export const ambientOptions = [
  { id: 'space', label: 'Ambient Space', detail: 'Low harmonic drift' },
  { id: 'lofi', label: 'Lo-Fi', detail: 'Soft instrumental pulse' },
  { id: 'noise', label: 'White Noise', detail: 'Continuous deep focus' },
]

export const mercuryItems = [
  {
    id: 'mercury-1',
    title: 'Pick up the parcel',
    detail: 'Post office · before 6pm',
    kind: 'errand',
    done: false,
    created: isoDay(0),
  },
  {
    id: 'mercury-2',
    title: 'Call the dentist',
    detail: 'Reschedule the cleaning appointment',
    kind: 'errand',
    done: false,
    created: isoDay(0),
  },
  {
    id: 'mercury-3',
    title: 'Idea: Sunday review',
    detail: 'Twenty minutes to plan the week ahead',
    kind: 'note',
    done: false,
    created: isoDay(1),
  },
  {
    id: 'mercury-4',
    title: 'Return library books',
    detail: 'Two books due this week',
    kind: 'errand',
    done: true,
    created: isoDay(2),
  },
]

export const jupiterBudget = 1200

export const jupiterCategories = [
  { id: 'food', label: 'Food', color: '#d9b273' },
  { id: 'transport', label: 'Transport', color: '#7fa9dd' },
  { id: 'study', label: 'Study', color: '#a88ee5' },
  { id: 'home', label: 'Home', color: '#7fb59b' },
  { id: 'fun', label: 'Fun', color: '#dd8b69' },
]

export const jupiterExpenses = [
  { id: 'expense-1', title: 'Weekly groceries', category: 'food', amount: 86.4, date: isoDay(0) },
  { id: 'expense-2', title: 'Metro card top-up', category: 'transport', amount: 30, date: isoDay(1) },
  { id: 'expense-3', title: 'DBMS textbook', category: 'study', amount: 64.5, date: isoDay(3) },
  { id: 'expense-4', title: 'Coffee with friends', category: 'fun', amount: 18.75, date: isoDay(4) },
  { id: 'expense-5', title: 'Desk lamp', category: 'home', amount: 42, date: isoDay(6) },
  { id: 'expense-6', title: 'Monthly internet', category: 'home', amount: 55, date: isoDay(9) },
]

export const neptuneBookmarks = [
  {
    id: 'bookmark-1',
    title: 'React documentation',
    url: 'https://react.dev',
    tags: ['development', 'reference'],
    note: 'Hooks, component patterns, and the new docs.',
    added: isoDay(0),
  },
  {
    id: 'bookmark-2',
    title: 'Three.js manual',
    url: 'https://threejs.org/manual/',
    tags: ['3d', 'reference'],
    note: 'Primer for scenes, materials, and lighting.',
    added: isoDay(2),
  },
  {
    id: 'bookmark-3',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    tags: ['development', 'reference'],
    note: 'The reliable answer for almost everything web.',
    added: isoDay(4),
  },
  {
    id: 'bookmark-4',
    title: 'A Pattern Language',
    url: 'https://en.wikipedia.org/wiki/A_Pattern_Language',
    tags: ['design', 'reading'],
    note: 'Ideas for designing spaces that feel human.',
    added: isoDay(7),
  },
]
