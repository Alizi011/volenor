import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  format,
  eachDayOfInterval,
  isToday,
} from 'date-fns';
import { nb } from 'date-fns/locale';
import type { Task, Document } from '../types';
import { TASK_CATEGORIES } from '../data/demoData';
import Header from '../components/Header';

interface CalendarViewProps {
  tasks: Task[];
  documents: Document[];
}

type ViewMode = 'month' | 'week' | 'list';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'invoice' | 'deadline';
  priority?: string;
  category?: string;
  color: string;
}

export default function CalendarView({ tasks, documents }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 0, 15));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const events = useMemo<CalendarEvent[]>(() => {
    const allEvents: CalendarEvent[] = [];

    tasks.forEach((task) => {
      const cat = TASK_CATEGORIES.find((c) => c.id === task.category);
      const isInvoice = task.category === 'invoice';
      allEvents.push({
        id: `task-${task.id}`,
        title: task.title,
        date: new Date(task.dueDate),
        type: isInvoice ? 'invoice' : 'task',
        priority: task.priority,
        category: task.category,
        color: isInvoice ? 'var(--accent-orange)' : cat?.color || 'var(--accent-blue)',
      });
    });

    documents.forEach((doc) => {
      if (doc.category === 'invoices') {
        allEvents.push({
          id: `doc-${doc.id}`,
          title: doc.name.replace(/\.pdf$/, '').replace(/_/g, ' '),
          date: new Date(doc.date),
          type: 'invoice',
          color: 'var(--accent-orange)',
        });
      }
    });

    return allEvents;
  }, [tasks, documents]);

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => isSameDay(e.date, date));
  };

  // Month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week view
  const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentMonth(addMonths(currentMonth, -1));
    } else {
      setCurrentMonth(addDays(currentMonth, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addDays(currentMonth, 7));
    }
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const weekDaysNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="KALENDER" />

      {/* Controls */}
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center" style={{ color: 'var(--text-primary)' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: nb })}
          </h2>
          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="h-9 px-4 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            I dag
          </button>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            {([
              { value: 'month', label: 'Måned' },
              { value: 'week', label: 'Uke' },
              { value: 'list', label: 'Liste' },
            ] as { value: ViewMode; label: string }[]).map((v) => (
              <button
                key={v.value}
                onClick={() => setViewMode(v.value)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: viewMode === v.value ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                  color: viewMode === v.value ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                  borderRight: '1px solid var(--border-color)',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto px-8 pb-6">
        {viewMode === 'month' && (
          <motion.div
            key={format(currentMonth, 'yyyy-MM')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {weekDaysNames.map((name) => (
                <div
                  key={name}
                  className="text-center py-2 text-xs font-medium uppercase"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => {
                const dayEvents = getEventsForDate(day);
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.005 }}
                    onClick={() => setSelectedDate(day)}
                    className="rounded-xl p-2 min-h-[100px] cursor-pointer transition-colors"
                    style={{
                      backgroundColor: inMonth ? 'var(--bg-secondary)' : 'transparent',
                      opacity: inMonth ? 1 : 0.4,
                    }}
                    onMouseEnter={(e) => {
                      if (inMonth) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (inMonth) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                  >
                    <div className="flex justify-center mb-1">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{
                          color: isToday(day) ? '#0a0a0a' : 'var(--text-primary)',
                          backgroundColor: isToday(day) ? 'var(--accent-yellow)' : 'transparent',
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate"
                          style={{
                            backgroundColor: `${event.color}20`,
                            color: event.color,
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs px-1.5" style={{ color: 'var(--text-secondary)' }}>
                          +{dayEvents.length - 3} mer
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewMode === 'week' && (
          <motion.div
            key={format(weekStart, 'yyyy-MM-dd')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div key={day.toISOString()} className="space-y-2">
                    <div
                      className="text-center py-2 rounded-lg"
                      style={{
                        backgroundColor: isToday(day) ? 'var(--accent-yellow)' : 'var(--bg-secondary)',
                      }}
                    >
                      <div
                        className="text-xs font-medium uppercase"
                        style={{ color: isToday(day) ? '#0a0a0a' : 'var(--text-secondary)' }}
                      >
                        {weekDaysNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                      </div>
                      <div
                        className="text-lg font-semibold"
                        style={{ color: isToday(day) ? '#0a0a0a' : 'var(--text-primary)' }}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderLeft: `3px solid ${event.color}`,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {events
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 rounded-xl px-5 py-3"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="text-sm w-24 shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {format(event.date, 'd. MMM', { locale: nb })}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div
                    className="text-sm flex-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {event.title}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${event.color}20`,
                      color: event.color,
                    }}
                  >
                    {event.type === 'invoice' ? 'Faktura' : event.type === 'deadline' ? 'Frist' : 'Oppgave'}
                  </span>
                </motion.div>
              ))}
          </motion.div>
        )}
      </div>

      {/* Day detail panel */}
      <AnimatePresence>
        {selectedDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSelectedDate(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-[400px] max-w-full z-[120] overflow-y-auto"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border-color)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {format(selectedDate, 'EEEE d. MMMM yyyy', { locale: nb })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                    Ingen hendelser denne dagen
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 rounded-xl p-4"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderLeft: `3px solid ${event.color}`,
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {event.title}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-md mt-1 inline-block"
                            style={{
                              backgroundColor: `${event.color}20`,
                              color: event.color,
                            }}
                          >
                            {event.type === 'invoice' ? 'Faktura' : event.type === 'deadline' ? 'Frist' : 'Oppgave'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
