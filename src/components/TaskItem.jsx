import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { completeTask, removeTask, getExpReward } from '../features/tasksSlice';
import { gainExp, earnCoins, startMeltdown, takeDamage } from '../features/userSlice';
import { Draggable } from '@hello-pangea/dnd';
import { Check, GripVertical, Trophy, X, Flame, AlertTriangle } from 'lucide-react';
import { playClickSound, playDamageSound } from '../utils/audio';
import './TaskItem.css';

const getDiffColor = (diff) => {
  switch (diff) {
    case 'trivial': return 'var(--diff-trivial)';
    case 'easy': return 'var(--diff-easy)';
    case 'hard': return 'var(--diff-hard)';
    case 'medium':
    default: return 'var(--diff-medium)';
  }
};

const getDiffBg = (diff) => {
  switch (diff) {
    case 'trivial': return 'rgba(148, 163, 184, 0.06)';
    case 'easy': return 'rgba(16, 185, 129, 0.06)';
    case 'hard': return 'rgba(239, 68, 68, 0.08)';
    case 'medium':
    default: return 'rgba(245, 197, 66, 0.06)';
  }
};

const getDiffBorder = (diff) => {
  switch (diff) {
    case 'trivial': return 'rgba(148, 163, 184, 0.1)';
    case 'easy': return 'rgba(16, 185, 129, 0.12)';
    case 'hard': return 'rgba(239, 68, 68, 0.15)';
    case 'medium':
    default: return 'rgba(245, 197, 66, 0.1)';
  }
};

export default function TaskItem({ task, type, index }) {
  const dispatch = useDispatch();
  const { augmentations = {} } = useSelector((state) => state.user);
  const [timeLeft, setTimeLeft] = useState(null); // For corrupted tasks
  const [cooldownLeft, setCooldownLeft] = useState(null); // For habits

  // Corrupted Task Timer Logic
  useEffect(() => {
    if (!task.isCorrupted || task.completed) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(task.expiresAt);
      const diff = Math.floor((expires - now) / 1000);

      if (diff <= 0) {
        clearInterval(interval);
        playDamageSound();
        dispatch(takeDamage({ amount: 15 })); // Boss penalty
        dispatch(removeTask({ id: task.id, type }));
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [task, dispatch, type]);

  // Habit Cooldown Timer Logic
  useEffect(() => {
    if (type !== 'habit' || !task.lastCompletedAt) return;
    
    const HABIT_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
    const lastCompleted = new Date(task.lastCompletedAt).getTime();

    const updateCooldown = () => {
      const now = Date.now();
      const elapsed = now - lastCompleted;
      if (elapsed < HABIT_COOLDOWN_MS) {
        setCooldownLeft(Math.floor((HABIT_COOLDOWN_MS - elapsed) / 1000));
      } else {
        setCooldownLeft(null);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [task.lastCompletedAt, type]);

  const handleComplete = () => {
    if (task.completed) return;
    playClickSound();
    dispatch(completeTask({ id: task.id, type }));
    
    let expYield = getExpReward(task.difficulty);
    if (task.isCorrupted) expYield *= 3; // Triple EXP for Boss Fights!
    let coinsYield = Math.ceil(expYield / 5);

    // Neural Overclocking: 5% chance per level for double credits
    const neuralLevel = augmentations.neural || 0;
    const doubleChance = neuralLevel * 0.05;
    if (Math.random() < doubleChance) {
      coinsYield *= 2;
      console.log('Neural Overclocking triggered! Double credits.');
      // You could dispatch a toast notification here if you had a global toast system
    }

    dispatch(gainExp({ amount: expYield }));
    dispatch(earnCoins({ amount: coinsYield }));
  };

  const isCompleted = type === 'habit' ? cooldownLeft !== null : task.completed;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => {
        const child = (
          <div 
            className={`task-item ${isCompleted ? 'completed' : ''} ${snapshot.isDragging ? 'is-dragging' : ''} ${task.isCorrupted ? 'is-corrupted' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...provided.draggableProps.style,
              background: task.isCorrupted ? 'rgba(239, 68, 68, 0.1)' : getDiffBg(task.difficulty),
              borderColor: task.isCorrupted ? '#ef4444' : getDiffBorder(task.difficulty),
            }}
          >
            {/* DRAG HANDLE */}
            <div className="task-drag-handle" {...provided.dragHandleProps}>
              <GripVertical size={16} />
            </div>

            <button 
              className="task-checkbox" 
              onClick={handleComplete}
              disabled={isCompleted}
            >
              {isCompleted && type !== 'habit' && <Check size={14} />}
              {isCompleted && type === 'habit' && <Check size={14} className="text-muted" />}
            </button>
            
            <div className="task-content">
              <h4 className="task-title">
                {task.isCorrupted && <AlertTriangle size={14} className="text-danger inline-icon" />}
                {task.title}
              </h4>
              <div className="task-meta">
                <span className="task-diff" style={{ color: task.isCorrupted ? '#ef4444' : getDiffColor(task.difficulty) }}>
                  {task.isCorrupted ? 'BOSS FIGHT' : task.difficulty}
                </span>
                
                {type === 'habit' && (
                  <span className="task-streak text-muted">
                    <Trophy size={12} className="inline-icon" /> {task.streak}
                  </span>
                )}

                {type === 'habit' && cooldownLeft !== null && (
                  <span className="task-timer text-muted" style={{ fontSize: '10px', marginLeft: '6px' }}>
                    CD: {Math.floor(cooldownLeft / 3600)}h {Math.floor((cooldownLeft % 3600) / 60)}m
                  </span>
                )}

                {task.isCorrupted && timeLeft !== null && (
                  <span className="task-timer text-danger">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

              {type === 'todo' && !isCompleted && (
                <button 
                  className="task-meltdown-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    dispatch(startMeltdown(task));
                  }}
                  title="System Meltdown (Focus Mode)"
                >
                  <Flame size={14} />
                </button>
              )}

              {/* REMOVE BUTTON */}
              <button 
                className="task-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  dispatch(removeTask({ id: task.id, type }));
                }}
                title="Remove task"
              >
                <X size={14} />
              </button>
          </div>
        );

        // Portal the dragged element to document.body to avoid parent offset issues
        if (snapshot.isDragging) {
          return createPortal(child, document.body);
        }
        return child;
      }}
    </Draggable>
  );
}
