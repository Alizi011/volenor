import { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppView } from './types';
import { useSettings } from './hooks/useStorage';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import {
  useSynapseDocuments,
  useSynapseTasks,
  useSynapseInbox,
  useSynapseFinances,
  useSynapseBudgets,
  useSynapseDebtCases,
  useSynapseDebtNotes,
  useSynapseCommunications,
  useSynapseFamily,
  useSynapseCategories,
  useSynapseCalendar,
} from './hooks/useSynapse';
import { CATEGORIES } from './data/demoData';
import Sidebar from './components/Sidebar';
import ToastContainer, { useToast } from './components/Toast';
import Dashboard from './views/Dashboard';
import Documents from './views/Documents';
import Tasks from './views/Tasks';
import InboxView from './views/Inbox';
import CalendarView from './views/Calendar';
import Finances from './views/Finances';
import BankStatements from './views/BankStatements';
import Debts from './views/Debts';
import Family from './views/Family';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

/* ═══════════════════════════════════════════
   MAIN APP — with sidebar + all views
   ═══════════════════════════════════════════ */
function MainApp() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const { settings, setSettings } = useSettings();
  const { toasts, addToast, removeToast } = useToast();

  // Backend data via tRPC
  const { documents, addDocument, deleteDocument } = useSynapseDocuments();
  const { tasks, addTask, updateTask, deleteTask } = useSynapseTasks();
  const { inbox, addInboxItem, removeInboxItem } = useSynapseInbox();
  const { finances, addFinance, deleteFinance } = useSynapseFinances();
  const { budgets, addBudget } = useSynapseBudgets();
  const { cases: debtCases, addCase, updateCase, deleteCase, closeCase } = useSynapseDebtCases();
  const { members, addMember, deleteMember } = useSynapseFamily();
  const { customCategories, addCategory, deleteCategory } = useSynapseCategories();
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent } = useSynapseCalendar();
  const debtNotesHook = useSynapseDebtNotes();
  const commHook = useSynapseCommunications();

  useTheme(settings.theme);

  const activeDebtCount = debtCases.filter((d) => d.status !== 'closed' && d.status !== 'resolved').length;

  const handleThemeToggle = useCallback(() => {
    setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  }, [settings.theme, setSettings]);

  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const handleUploadToInbox = useCallback(
    (file: File) => {
      addInboxItem({
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        size: file.size,
        type: file.name.endsWith('.pdf') ? 'pdf' : file.name.match(/\.(jpg|jpeg|png|gif)$/) ? 'image' : 'doc',
      });
      addToast('success', `Fil lastet opp til innboksen`);
    },
    [addInboxItem, addToast]
  );

  const handleCategorizeInboxItem = useCallback(
    (itemId: string, category: string) => {
      const item = inbox.find((i: any) => i.id === itemId);
      if (!item) return;
      addDocument({
        name: item.name,
        category,
        date: item.date,
        size: item.size,
        type: item.type,
        tags: '[]',
        notes: '',
      });
      removeInboxItem(itemId);
      addToast('success', 'Fil kategorisert');
    },
    [inbox, addDocument, removeInboxItem, addToast]
  );

  const handleDeleteInboxItem = useCallback(
    (itemId: string) => {
      removeInboxItem(itemId);
      addToast('info', 'Fil slettet fra innboksen');
    },
    [removeInboxItem, addToast]
  );

  const handleAddNote = useCallback((caseId: string, note: { id: string; content: string; createdAt: string }) => {
    debtNotesHook.create.mutate({ debtCaseId: Number(caseId), content: note.content });
  }, [debtNotesHook.create]);

  const handleAddCommunication = useCallback((caseId: string, comm: { id: string; type: any; direction: any; date: string; description: string; documentIds: string[] }) => {
    commHook.create.mutate({
      debtCaseId: Number(caseId),
      type: comm.type,
      direction: comm.direction,
      date: comm.date,
      description: comm.description,
      documentIds: JSON.stringify(comm.documentIds),
    });
  }, [commHook.create]);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        theme={settings.theme}
        onThemeToggle={handleThemeToggle}
        inboxCount={inbox.length}
        activeDebtCount={activeDebtCount}
      />

      <main className="flex-1 ml-16 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {currentView === 'dashboard' && (
              <Dashboard
                documents={documents}
                tasks={tasks}
                inbox={inbox}
                onNavigate={handleNavigate}
                onUpload={handleUploadToInbox}
                addToast={addToast}
              />
            )}
            {currentView === 'documents' && (
              <Documents
                documents={documents}
                customCategories={customCategories}
                onAddDocument={(doc: any) => {
                  addDocument(doc);
                  addToast('success', 'Dokument lagt til');
                }}
                
                onDeleteDocument={deleteDocument}
                onAddCustomCategory={addCategory}
                onDeleteCustomCategory={deleteCategory}
                addToast={addToast}
              />
            )}
            {currentView === 'tasks' && (
              <Tasks
                tasks={tasks}
                onAddTask={(task: any) => {
                  addTask(task);
                  addToast('success', 'Oppgave opprettet');
                }}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                addToast={addToast}
              />
            )}
            {currentView === 'inbox' && (
              <InboxView
                inbox={inbox}
                customCategories={customCategories}
                onCategorize={handleCategorizeInboxItem}
                onDelete={handleDeleteInboxItem}
                onUpload={handleUploadToInbox}
              />
            )}
            {currentView === 'calendar' && (
            <CalendarView
              tasks={tasks}
              documents={documents}
              calendarEvents={calendarEvents}
              onAddCalendarEvent={addCalendarEvent}
              onDeleteCalendarEvent={deleteCalendarEvent}
              addToast={addToast}
            />
          )}
            {currentView === 'finances' && (
              <Finances
                finances={finances}
                budgets={budgets}
                categories={[...CATEGORIES]}
                onAddFinance={addFinance}
                onUpdateFinance={(_id: string, _data: any) => {}}
                onDeleteFinance={deleteFinance}
               onAddBudget={addBudget}
                onUpdateBudget={(_id: string, _data: any) => {}}
                addToast={addToast}
              />
            )}

            {currentView === 'bankStatements' && (
  <BankStatements addToast={addToast} />
)}
            {currentView === 'debts' && (
              <Debts
                cases={debtCases}
                members={members}
                documents={documents}
                onAddCase={addCase}
                onUpdateCase={updateCase}
                onDeleteCase={deleteCase}
                onAddNote={handleAddNote}
                onAddCommunication={handleAddCommunication}
                onLinkDocument={(caseId: string, docId: string) => {
                  const c = debtCases.find((d: any) => d.id === caseId);
                  if (!c) return;
                  const ids = [...c.documentIds, docId];
                  updateCase(caseId, { documentIds: JSON.stringify(ids) });
                }}
                onUnlinkDocument={(caseId: string, docId: string) => {
                  const c = debtCases.find((d: any) => d.id === caseId);
                  if (!c) return;
                  const ids = c.documentIds.filter((id: string) => id !== docId);
                  updateCase(caseId, { documentIds: JSON.stringify(ids) });
                }}
                onCloseCase={closeCase}
                addToast={addToast}
              />
            )}
            {currentView === 'family' && (
              <Family
                members={members}
                debtCases={debtCases}
                finances={finances}
                documents={documents}
                onAddMember={addMember}
                onDeleteMember={deleteMember}
                addToast={addToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   AUTH GUARD — redirect unauthenticated users
   ═══════════════════════════════════════════ */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl animate-pulse"
            style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}
          >
            S
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Laster inn...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* ═══════════════════════════════════════════
   ROOT COMPONENT — router entry
   ═══════════════════════════════════════════ */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/profile"
        element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AuthGuard>
            <Admin />
          </AuthGuard>
        }
      />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <MainApp />
          </AuthGuard>
        }
      />
    </Routes>
  );
}
