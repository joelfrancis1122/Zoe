import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  habits: [], // Established habits
  dailies: [], // Reset every 24 hours
  todos: [], // One-off tasks
  history: [], // { date: 'YYYY-MM-DD', expGained: number, tasksCompleted: number }
  lastResetDate: new Date().toISOString().split('T')[0],
};

// Helper to determine EXP based on difficulty
export const getExpReward = (difficulty) => {
  switch (difficulty) {
    case 'trivial': return 5;
    case 'easy': return 10;
    case 'medium': return 25;
    case 'hard': return 50;
    default: return 10;
  }
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // --- CREATE ---
    addTask: (state, action) => {
      const { type, title, difficulty } = action.payload;
      
      const isCorrupted = Math.random() < 0.10;
      const newTask = {
        id: uuidv4(),
        title,
        difficulty: difficulty || 'medium',
        createdAt: new Date().toISOString(),
      };

      if (isCorrupted) {
        newTask.isCorrupted = true;
        newTask.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      }

      if (type === 'habit') {
        state.habits.push({ ...newTask, streak: 0 });
      } else if (type === 'daily') {
        state.dailies.push({ ...newTask, completed: false });
      } else if (type === 'todo') {
        state.todos.push({ ...newTask, completed: false });
      }
    },

    // --- COMPLETE ---
    completeTask: (state, action) => {
      const { id, type } = action.payload;
      const today = new Date().toISOString().split('T')[0];
      
      let expYield = 0;

      if (type === 'habit') {
        const habit = state.habits.find(h => h.id === id);
        if (habit) {
          habit.streak += 1;
          habit.lastCompletedAt = new Date().toISOString();
          expYield = getExpReward(habit.difficulty);
        }
      } else if (type === 'daily') {
        const daily = state.dailies.find(d => d.id === id);
        if (daily) {
          daily.completed = true;
          expYield = getExpReward(daily.difficulty);
        }
      } else if (type === 'todo') {
        const todo = state.todos.find(t => t.id === id);
        if (todo) {
          expYield = getExpReward(todo.difficulty);
          // Remove completed to-dos immediately
          state.todos = state.todos.filter(t => t.id !== id);
        }
      }

      // Log to history
      if (expYield > 0) {
        if (!state.history) state.history = []; // Safety check
        const todayEntry = state.history.find(h => h.date === today);
        if (todayEntry) {
          todayEntry.expGained += expYield;
          todayEntry.tasksCompleted += 1;
        } else {
          state.history.push({
            date: today,
            expGained: expYield,
            tasksCompleted: 1
          });
        }
      }
    },

    // --- REMOVE TASK ---
    removeTask: (state, action) => {
      const { id, type } = action.payload;
      if (type === 'habit') {
        state.habits = state.habits.filter(t => t.id !== id);
      } else if (type === 'daily') {
        state.dailies = state.dailies.filter(t => t.id !== id);
      } else if (type === 'todo') {
        state.todos = state.todos.filter(t => t.id !== id);
      }
    },

    // --- MOVE TASK (DRAG AND DROP) ---
    moveTask: (state, action) => {
      const { source, destination } = action.payload;
      
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;
      
      const sourceKey = source.droppableId; // e.g. 'todos'
      const destKey = destination.droppableId; // e.g. 'dailies'
      
      const sourceList = state[sourceKey];
      const destList = state[destKey];
      
      const [movedTask] = sourceList.splice(source.index, 1);
      
      // If crossing columns, initialize any missing default fields for the new type
      if (sourceKey !== destKey) {
        if (destKey === 'habits') {
          if (movedTask.streak === undefined) movedTask.streak = 0;
        } else if (destKey === 'dailies' || destKey === 'todos') {
          if (movedTask.completed === undefined) movedTask.completed = false;
        }
      }
      
      destList.splice(destination.index, 0, movedTask);
    },

    // --- RESET DAILIES ---
    checkDailyReset: (state) => {
      const today = new Date().toISOString().split('T')[0];
      if (state.lastResetDate !== today) {
        // Find incomplete dailies to penalize user (handled in a thunk or component)
        // Reset all dailies
        state.dailies.forEach(d => { d.completed = false; });
        state.lastResetDate = today;
      }
    },
    // --- SYNC STATE ---
    syncTasksState: (state, action) => {
      const data = action.payload;
      if (data.habits) state.habits = data.habits;
      if (data.dailies) state.dailies = data.dailies;
      if (data.todos) state.todos = data.todos;
      if (data.history) state.history = data.history;
      if (data.lastResetDate) state.lastResetDate = data.lastResetDate;
    }
  },
});

export const { addTask, completeTask, removeTask, moveTask, checkDailyReset, syncTasksState } = tasksSlice.actions;
export default tasksSlice.reducer;
