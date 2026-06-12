import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { completeTask, removeTask, updateTask, getExpReward } from '../features/tasksSlice';
import { gainExp, earnCoins, startMeltdown, takeDamage } from '../features/userSlice';
import { Draggable } from '@hello-pangea/dnd';
import { Check, GripVertical, Trophy, X, Flame, AlertTriangle, Edit2, ChevronDown, ChevronUp, AlignLeft, List } from 'lucide-react';
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

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [editDiff, setEditDiff] = useState(task.difficulty);
  const [editChecklist, setEditChecklist] = useState(task.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    dispatch(updateTask({
      id: task.id,
      type,
      updates: {
        title: editTitle,
        notes: editNotes,
        difficulty: editDiff,
        checklist: editChecklist
      }
    }));
    setIsEditing(false);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditDiff(task.difficulty);
    setEditChecklist(task.checklist || []);
    setIsEditing(false);
  };

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
              disabled={isCompleted || isEditing}
            >
              {isCompleted && type !== 'habit' && <Check size={14} />}
              {isCompleted && type === 'habit' && <Check size={14} className="text-muted" />}
            </button>
            
            <div className="task-content">
              {isEditing ? (
                <div className="task-edit-form" onClick={(e) => e.stopPropagation()}>
                  <input 
                    className="edit-input" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                  />
                  <textarea 
                    className="edit-textarea" 
                    placeholder="Add notes..." 
                    value={editNotes} 
                    onChange={(e) => setEditNotes(e.target.value)}
                  />

                  <div className="edit-checklist-container">
                    {editChecklist.map((item) => (
                      <div key={item.id} className="checklist-item-edit">
                        <span className="checklist-item-text">{item.text}</span>
                        <button 
                          className="btn-remove-item"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditChecklist(editChecklist.filter(i => i.id !== item.id));
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="add-checklist-item">
                      <input 
                        className="edit-input new-item-input" 
                        placeholder="Add checklist item..." 
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newChecklistItem.trim()) {
                              setEditChecklist([...editChecklist, { id: Date.now().toString(), text: newChecklistItem.trim(), completed: false }]);
                              setNewChecklistItem('');
                            }
                          }
                        }}
                      />
                      <button 
                        className="btn-add-item"
                        onClick={(e) => {
                          e.preventDefault();
                          if (newChecklistItem.trim()) {
                            setEditChecklist([...editChecklist, { id: Date.now().toString(), text: newChecklistItem.trim(), completed: false }]);
                            setNewChecklistItem('');
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="edit-controls">
                    <select 
                      className="edit-select" 
                      value={editDiff} 
                      onChange={(e) => setEditDiff(e.target.value)}
                    >
                      <option value="trivial">Trivial</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <div className="edit-actions">
                      <button className="btn-save" onClick={handleSaveEdit}>Save</button>
                      <button className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="task-title">
                    {task.isCorrupted && <AlertTriangle size={14} className="text-danger inline-icon" />}
                    {task.title}
                  </h4>
                  
                  <div className="task-expand-pills">
                    {task.notes && (
                      <button 
                        className="task-expand-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNoteExpanded(!isNoteExpanded);
                        }}
                      >
                        <AlignLeft size={12} className="inline-icon" />
                        <span className="pill-text">Notes</span>
                        {isNoteExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                    {task.checklist && task.checklist.length > 0 && (
                      <button 
                        className="task-expand-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsChecklistExpanded(!isChecklistExpanded);
                        }}
                      >
                        <List size={12} className="inline-icon" />
                        <span className="pill-text">
                          {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                        </span>
                        {isChecklistExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>

                  {isNoteExpanded && task.notes && (
                    <div className="task-expanded-content">
                      {task.notes}
                    </div>
                  )}

                  {isChecklistExpanded && task.checklist && task.checklist.length > 0 && (
                    <div className="task-expanded-content checklist-content">
                      {task.checklist.map(item => (
                        <label key={item.id} className="checklist-item-view" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="checklist-checkbox"
                            checked={item.completed} 
                            onChange={() => {
                              const updatedChecklist = task.checklist.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i);
                              dispatch(updateTask({
                                id: task.id,
                                type,
                                updates: { checklist: updatedChecklist }
                              }));
                            }}
                          />
                          <span className={item.completed ? 'completed-text' : ''}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  )}
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
                </>
              )}
            </div>

            {!isEditing && (
              <div className="task-actions">
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

                {/* EDIT BUTTON */}
                <button 
                  className="task-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  title="Edit task"
                >
                  <Edit2 size={14} />
                </button>

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
            )}
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
