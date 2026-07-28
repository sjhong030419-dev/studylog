import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PlannerTargetType = 'time' | 'checklist'

export interface PlannerTask {
  id: string
  dateKey: string
  subjectId: string
  title: string
  targetType: PlannerTargetType
  targetMinutes?: number
  completed: boolean
}

interface PlannerState {
  tasks: PlannerTask[]
  addTask: (
    dateKey: string,
    subjectId: string,
    title: string,
    targetType: PlannerTargetType,
    targetMinutes?: number,
  ) => void
  toggleComplete: (id: string) => void
  removeTask: (id: string) => void
  carryOverTask: (id: string, toDateKey: string) => void
  tasksOn: (dateKey: string) => PlannerTask[]
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (dateKey, subjectId, title, targetType, targetMinutes) => {
        const trimmed = title.trim()
        if (!trimmed) return
        set({
          tasks: [
            ...get().tasks,
            {
              id: `task-${Date.now()}`,
              dateKey,
              subjectId,
              title: trimmed,
              targetType,
              targetMinutes: targetType === 'time' ? Math.max(1, targetMinutes ?? 30) : undefined,
              completed: false,
            },
          ],
        })
      },

      toggleComplete: (id) => {
        set({
          tasks: get().tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        })
      },

      removeTask: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) })
      },

      carryOverTask: (id, toDateKey) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return
        set({
          tasks: [
            ...get().tasks,
            { ...task, id: `task-${Date.now()}`, dateKey: toDateKey, completed: false },
          ],
        })
      },

      tasksOn: (dateKey) => get().tasks.filter((t) => t.dateKey === dateKey),
    }),
    { name: 'studylog-planner' },
  ),
)
