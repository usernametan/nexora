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
    locked: true,
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
    locked: true,
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
    locked: true,
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
  { name: 'DSA_Notes.pdf', subject: 'Computer Science', pages: 24, size: '3.8 MB', updated: 'Today' },
  { name: 'DBMS_Module_3.pdf', subject: 'DBMS', pages: 31, size: '5.2 MB', updated: 'Yesterday' },
  { name: 'OS_Unit_2.pdf', subject: 'Operating Systems', pages: 18, size: '2.7 MB', updated: 'Sep 21' },
  { name: 'Research_Paper.pdf', subject: 'Research', pages: 42, size: '8.1 MB', updated: 'Sep 18' },
]

export const focusSessions = [
  { label: 'DSA', duration: '45m', color: '#75aaf4' },
  { label: 'Project', duration: '1h 20m', color: '#a88ee5' },
  { label: 'DBMS', duration: '1h 19m', color: '#d9ab72' },
]

export const weeklyFocus = [
  { day: 'M', hours: 3.2 },
  { day: 'T', hours: 4.6 },
  { day: 'W', hours: 2.8 },
  { day: 'T', hours: 5.1 },
  { day: 'F', hours: 3.8 },
  { day: 'S', hours: 1.6 },
  { day: 'S', hours: 0.8 },
]

export const ambientOptions = [
  { id: 'space', label: 'Ambient Space', detail: 'Low harmonic drift' },
  { id: 'lofi', label: 'Lo-Fi', detail: 'Soft instrumental pulse' },
  { id: 'noise', label: 'White Noise', detail: 'Continuous deep focus' },
]
