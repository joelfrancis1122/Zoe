import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateTask } from '../features/tasksSlice';
import { X, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './TaskEditModal.css';

export default function TaskEditModal({ task, type, onClose }) {
  const dispatch = useDispatch();

  const [editTitle, setEditTitle] = useState(task.title || '');
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [editDiff, setEditDiff] = useState(task.difficulty || 'medium');
  const [editChecklist, setEditChecklist] = useState(task.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'unset';
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert("Task title cannot be empty!");
      return;
    }

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
    onClose();
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setEditChecklist([...editChecklist, { id: uuidv4(), text: newChecklistItem, completed: false }]);
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (itemId) => {
    setEditChecklist(editChecklist.filter(i => i.id !== itemId));
  };

  return (
    <div className="task-edit-overlay" onClick={onClose}>
      <div className="task-edit-modal glass-card" onClick={(e) => e.stopPropagation()}>
        
        <div className="task-edit-header">
          <h3>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="task-edit-body" onSubmit={handleSave}>
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              className="modal-input" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea 
              className="modal-textarea" 
              value={editNotes} 
              onChange={(e) => setEditNotes(e.target.value)} 
              placeholder="Add details, links, or markdown..."
            />
          </div>

          <div className="form-group">
            <label>Checklist</label>
            <div className="modal-checklist-container">
              {editChecklist.map(item => (
                <div key={item.id} className="modal-checklist-item">
                  <span className="checklist-text">{item.text}</span>
                  <button type="button" className="btn-remove-item" onClick={() => handleRemoveChecklistItem(item.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="add-checklist-item">
                <input 
                  type="text" 
                  placeholder="New subtask..." 
                  className="modal-input"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                />
                <button type="button" className="btn-add-item" onClick={handleAddChecklistItem}>
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <select 
              className="modal-select" 
              value={editDiff} 
              onChange={(e) => setEditDiff(e.target.value)}
            >
              <option value="trivial">Trivial</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="task-edit-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-modal-save">Save Changes</button>
          </div>
        </form>

      </div>
    </div>
  );
}
