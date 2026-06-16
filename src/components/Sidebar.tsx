import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutGrid,
  FolderOpen,
  CheckSquare,
  Inbox,
  Calendar,
  BarChart3,
  Gavel,
  Users,
  Moon,
  Sun,
  UserCircle,
  Shield,
} from 'lucide-react';
import type { AppView, AppTheme } from '../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  theme: AppTheme;
  onThemeToggle: () => void;
  inboxCount: number;
  activeDebtCount?: number;
}

const navItems: { view: AppView; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: LayoutGrid, label: 'Hjem' },
  { view: 'documents', icon: FolderOpen, label: 'Dokumenter' },
  { view: 'tasks', icon: CheckSquare, label: 'Gjøremål' },
  { view: 'inbox', icon: Inbox, label: 'Innboks' },
  { view: 'calendar', icon: Calendar, label: 'Kalender' },
  { view: 'finances', icon: BarChart3, label: 'Finans' },
  { view: 'debts', icon: Gavel, label: 'Gjeld' },
  { view: 'family', icon: Users, label: 'Familie' },
];

export default function Sidebar({
  currentView,
  onNavigate,
  theme,
  onThemeToggle,
  inboxCount,
  activeDebtCount = 0,
}: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="fixed left-0 top-0 h-screen w-16 flex flex-col items-center py-4 z-50"
      style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
      {/* Logo */}
      <div className="mb-6 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}>
          V
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          const isHovered = hoveredItem === item.view;

          return (
           <button
            key={item.view}
            aria-label={item.label}
            title={item.label}
            onClick={() => onNavigate(item.view)}
            onMouseEnter={() => setHoveredItem(item.view)}
            onMouseLeave={() => setHoveredItem(null)}
            className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
            }}
          >
              <Icon
                size={22}
                style={{
                  color: isActive ? 'var(--accent-yellow)' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'color 0.2s ease',
                }}
              />

              {/* Inbox badge */}
              {item.view === 'inbox' && inboxCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium"
                  style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}
                >
                  {inboxCount}
                </span>
              )}

              {/* Debt badge */}
              {item.view === 'debts' && activeDebtCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium"
                  style={{ backgroundColor: 'var(--accent-orange)', color: '#0a0a0a' }}
                >
                  {activeDebtCount}
                </span>
              )}

              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-[52px] whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium z-[100]"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Bottom section: Profile, Admin, Theme */}
      <div className="flex flex-col items-center gap-1">
        {/* Profile */}
        <button
        aria-label="Profil"
        title="Profil"
        onClick={() => navigate('/profile')}
        onMouseEnter={() => setHoveredItem('profile')}
        onMouseLeave={() => setHoveredItem(null)}
        className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
      >
          <UserCircle
            size={22}
            style={{
              color: hoveredItem === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.2s ease',
            }}
          />
          <AnimatePresence>
            {hoveredItem === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute left-[52px] whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium z-[100]"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              >
                Profil
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Admin (conditional) */}
        {isAdmin && (
          <button
          aria-label="Admin"
          title="Admin"
          onClick={() => navigate('/admin')}
          onMouseEnter={() => setHoveredItem('admin')}
          onMouseLeave={() => setHoveredItem(null)}
          className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
        >
            <Shield
              size={22}
              style={{
                color: hoveredItem === 'admin' ? 'var(--accent-orange)' : 'var(--text-secondary)',
                transition: 'color 0.2s ease',
              }}
            />
            <AnimatePresence>
              {hoveredItem === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-[52px] whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium z-[100]"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Admin
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Theme toggle */}
       <button
        aria-label={theme === 'dark' ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
        title={theme === 'dark' ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
        onClick={onThemeToggle}
        onMouseEnter={() => setHoveredItem('theme')}
        onMouseLeave={() => setHoveredItem(null)}
        className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
      >

          {theme === 'dark' ? (
            <Sun size={20} style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Moon size={20} style={{ color: 'var(--text-secondary)' }} />
          )}
          <AnimatePresence>
            {hoveredItem === 'theme' && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute left-[52px] whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium z-[100]"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              >
                {theme === 'dark' ? 'Lyst tema' : 'Mørkt tema'}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </nav>
  );
}
