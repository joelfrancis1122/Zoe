import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addTask, checkDailyReset, moveTask } from '../features/tasksSlice';
import TaskItem from './TaskItem';
import { Plus, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import './TaskBoard.css';

// Reusable Custom Dropdown Component
function CustomDropdown({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div className="custom-dropdown-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label}</span>
        <ChevronDown size={14} className={`dropdown-icon ${isOpen ? 'open' : ''}`} />
      </div>
      {isOpen && (
        <div className="custom-dropdown-list">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`custom-dropdown-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskBoard() {
  const dispatch = useDispatch();
  const { habits, dailies, todos } = useSelector((state) => state.tasks);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('todo');
  const [newTaskDiff, setNewTaskDiff] = useState('medium');

  // Check for daily resets when the board loads
  useEffect(() => {
    dispatch(checkDailyReset());
  }, [dispatch]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    dispatch(addTask({
      type: newTaskType,
      title: newTaskTitle,
      difficulty: newTaskDiff,
    }));
    
    setNewTaskTitle('');
    setNewTaskDiff('medium');
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    
    dispatch(moveTask({ source, destination }));
  };

  const typeOptions = [
    { value: 'todo', label: 'To-Do' },
    { value: 'daily', label: 'Daily' },
    { value: 'habit', label: 'Habit' }
  ];

  const diffOptions = [
    { value: 'trivial', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--diff-trivial)' }}>●</span> Trivial</div> },
    { value: 'easy', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--diff-easy)' }}>●</span> Easy</div> },
    { value: 'medium', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--diff-medium)' }}>●</span> Medium</div> },
    { value: 'hard', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--diff-hard)' }}>●</span> Hard</div> }
  ];

  return (
    <div className="task-board">
      
      {/* ADD TASK FORM */}
      <form className="add-task-form glass-card" onSubmit={handleAddTask}>
        <input 
          type="text" 
          placeholder="Add a new task..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="add-task-input"
        />
        <div className="add-task-controls">
          <CustomDropdown value={newTaskType} options={typeOptions} onChange={setNewTaskType} />
          <CustomDropdown value={newTaskDiff} options={diffOptions} onChange={setNewTaskDiff} />
          <button type="submit" className="add-task-btn">
            <Plus size={18} />
          </button>
        </div>
      </form>
      {/* DRAG AND DROP COLUMNS */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="task-columns">
          
          {/* HABITS */}
          <div className="task-col">
            <h3 className="col-title">Habits</h3>
            <Droppable droppableId="habits">
              {(provided, snapshot) => (
                <div 
                  className={`task-list glass-card ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {habits.map((t, index) => <TaskItem key={t.id} task={t} type="habit" index={index} />)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* DAILIES */}
          <div className="task-col">
            <h3 className="col-title">Dailies</h3>
            <Droppable droppableId="dailies">
              {(provided, snapshot) => (
                <div 
                  className={`task-list glass-card ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {dailies.map((t, index) => <TaskItem key={t.id} task={t} type="daily" index={index} />)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* TO-DOS */}
          <div className="task-col">
            <h3 className="col-title">To-Do's</h3>
            <Droppable droppableId="todos">
              {(provided, snapshot) => (
                <div 
                  className={`task-list glass-card ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {todos.map((t, index) => <TaskItem key={t.id} task={t} type="todo" index={index} />)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

        </div>
      </DragDropContext>
    </div>
  );
}
