import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  X,
  Filter,
  Circle,
  Clock,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, TaskCategory } from '../types';
import { TASK_CATEGORIES } from '../data/demoData';
import Header from '../components/Header';

interface TasksProps {
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

const COLUMNS: { status: TaskStatus; label: string; color: string; icon: React.ElementType }[] = [
  { status: 'new', label: 'Ny', color: 'var(--accent-yellow)', icon: Circle },
  { status: 'in_progress', label: 'Pågående', color: 'var(--accent-blue)', icon: Clock },
  { status: 'done', label: 'Ferdig', color: 'var(--accent-green)', icon: CheckCircle2 },
  { status: 'archived', label: 'Arkiv', color: 'var(--text-secondary)', icon: Archive },
];

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  high: { color: 'var(--accent-red)', label: 'Høy' },
  medium: { color: 'var(--accent-orange)', label: 'Middels' },
  low: { color: 'var(--accent-green)', label: 'Lav' },
};

export default function Tasks({ tasks, onAddTask, onUpdateTask, onDeleteTask, addToast }: TasksProps) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriority, setFilterPriority] = useState<TaskPriority[]>([]);
  const [filterCategory, setFilterCategory] = useState<TaskCategory[]>([]);
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('invoice');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newTags, setNewTags] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterPriority.length > 0 && !filterPriority.includes(t.priority)) return false;
      if (filterCategory.length > 0 && !filterCategory.includes(t.category)) return false;
      return true;
    });
  }, [tasks, filterPriority, filterCategory]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    COLUMNS.forEach((col) => {
      grouped[col.status] = filteredTasks.filter((t) => t.status === col.status);
    });
    return grouped;
  }, [filteredTasks]);

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle,
      category: newCategory,
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      priority: newPriority,
      status: 'new',
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      notes: newNotes,
    });
    setNewTitle('');
    setNewDueDate('');
    setNewTags('');
    setNewNotes('');
    setShowNewTask(false);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    onUpdateTask(taskId, { status: newStatus });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="GJØREMÅL" />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Oppgaver
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ({filteredTasks.length} oppgaver)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: showFilter ? 'var(--bg-secondary)' : 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <Filter size={16} />
            Filter
          </button>
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}
          >
            <Plus size={16} />
            Ny oppgave
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-8 overflow-hidden"
          >
            <div
              className="rounded-xl p-5 mb-4"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    Prioritet
                  </h4>
                  <div className="space-y-2">
                    {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterPriority.includes(p)}
                          onChange={(e) => {
                            setFilterPriority((prev) =>
                              e.target.checked ? [...prev, p] : prev.filter((x) => x !== p)
                            );
                          }}
                          className="rounded"
                        />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {priorityConfig[p].label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    Kategori
                  </h4>
                  <div className="space-y-2">
                    {TASK_CATEGORIES.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterCategory.includes(cat.id)}
                          onChange={(e) => {
                            setFilterCategory((prev) =>
                              e.target.checked ? [...prev, cat.id] : prev.filter((x) => x !== cat.id)
                            );
                          }}
                          className="rounded"
                        />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {cat.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFilterPriority([]);
                  setFilterCategory([]);
                }}
                className="mt-4 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-yellow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Tilbakestill filter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 min-w-[800px]">
          {COLUMNS.map((column) => {
            const colTasks = tasksByColumn[column.status] || [];

            return (
              <div
                key={column.status}
                className="rounded-xl flex flex-col"
                style={{ backgroundColor: 'rgba(17,17,17,0.4)' }}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {column.label}
                  </span>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column content */}
                <div className="flex-1 p-3 space-y-3 min-h-[400px]">
                  {colTasks.map((task, i) => {
                    const cat = TASK_CATEGORIES.find((c) => c.id === task.category);
                    const overdue = isOverdue(task.dueDate);

                    return (
                      <motion.div
                        key={task.id ?? `task-${i}`}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderLeft: `3px solid ${priorityConfig[task.priority].color}`,
                        }}
                        onClick={() => setTaskDetail(task)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Priority indicator + drag handle */}
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${priorityConfig[task.priority].color}20`,
                              color: priorityConfig[task.priority].color,
                            }}
                          >
                            {priorityConfig[task.priority].label}
                          </span>
                        </div>

                        {/* Title */}
                        <h4
                          className="text-sm font-medium mb-2 line-clamp-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {task.title}
                        </h4>

                        {/* Category */}
                        {cat && (
                          <span
                            className="inline-block text-xs px-2 py-0.5 rounded-md mb-2"
                            style={{
                              backgroundColor: `${cat.color}20`,
                              color: cat.color,
                            }}
                          >
                            {cat.label}
                          </span>
                        )}

                        {/* Due date */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <Calendar size={12} style={{ color: overdue ? 'var(--accent-red)' : 'var(--text-secondary)' }} />
                          <span
                            className="text-xs"
                            style={{ color: overdue ? 'var(--accent-red)' : 'var(--text-secondary)' }}
                          >
                            {formatDueDate(task.dueDate)}
                            {overdue && ' (forfalt)'}
                          </span>
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status change buttons */}
                        <div className="flex gap-1 mt-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                          {COLUMNS.map((col) => (
                            <button
                              key={col.status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(task.id, col.status);
                              }}
                              className="flex-1 h-6 rounded text-xs transition-colors"
                              style={{
                                backgroundColor: task.status === col.status ? col.color : 'var(--bg-tertiary)',
                                color: task.status === col.status ? '#0a0a0a' : 'var(--text-secondary)',
                                opacity: task.status === col.status ? 1 : 0.6,
                              }}
                            >
                              {col.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New task modal */}
      <AnimatePresence>
        {showNewTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={() => setShowNewTask(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none"
            >
              <div
                className="w-full max-w-lg rounded-2xl p-8 pointer-events-auto"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Ny oppgave
                  </h2>
                  <button
                    onClick={() => setShowNewTask(false)}
                    className="p-1 rounded-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Tittel
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Hva skal gjøres?"
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Kategori
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {TASK_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Prioritet
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <option value="high">Høy</option>
                        <option value="medium">Middels</option>
                        <option value="low">Lav</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Frist
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Tags
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="Skilt med komma..."
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Notater
                    </label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Valgfrie notater..."
                      className="w-full rounded-lg px-3 py-3 text-sm outline-none resize-none"
                      rows={3}
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowNewTask(false)}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}
                  >
                    Lagre
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task detail modal */}
      <AnimatePresence>
        {taskDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={() => setTaskDetail(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none"
            >
              <div
                className="w-full max-w-lg rounded-2xl p-8 pointer-events-auto"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {taskDetail.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${priorityConfig[taskDetail.priority].color}20`,
                          color: priorityConfig[taskDetail.priority].color,
                        }}
                      >
                        {priorityConfig[taskDetail.priority].label} prioritet
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${TASK_CATEGORIES.find((c) => c.id === taskDetail.category)?.color}20`,
                          color: TASK_CATEGORIES.find((c) => c.id === taskDetail.category)?.color,
                        }}
                      >
                        {TASK_CATEGORIES.find((c) => c.id === taskDetail.category)?.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setTaskDetail(null)}
                    className="p-1 rounded-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Frist
                    </label>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                      {new Date(taskDetail.dueDate).toLocaleDateString('nb-NO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Status
                    </label>
                    <div className="flex gap-2 mt-1">
                      {COLUMNS.map((col) => (
                        <button
                          key={col.status}
                          onClick={() => {
                            onUpdateTask(taskDetail.id, { status: col.status });
                            setTaskDetail((prev) => (prev ? { ...prev, status: col.status } : null));
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: taskDetail.status === col.status ? col.color : 'var(--bg-tertiary)',
                            color: taskDetail.status === col.status ? '#0a0a0a' : 'var(--text-secondary)',
                          }}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {taskDetail.tags.length > 0 && (
                    <div>
                      <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {taskDetail.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {taskDetail.notes && (
                    <div>
                      <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Notater
                      </label>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                        {taskDetail.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setTaskDetail(null)}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Lukk
                  </button>
                  <button
                    onClick={() => {
                      onDeleteTask(taskDetail.id);
                      setTaskDetail(null);
                      addToast('info', 'Oppgave slettet');
                    }}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}
                  >
                    Slett
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
