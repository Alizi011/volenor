import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  FileText,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { InboxItem as InboxItemType, CustomCategory } from '../types';
import { CATEGORIES } from '../data/demoData';
import { getIcon } from '../lib/iconMap';
import Header from '../components/Header';

interface InboxViewProps {
  inbox: InboxItemType[];
  customCategories: CustomCategory[];
  onCategorize: (itemId: string, category: string) => void;
  onDelete: (itemId: string) => void;
  onUpload: (file: File) => void;
}

export default function InboxView({ inbox, customCategories, onCategorize, onDelete, onUpload }: InboxViewProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortingId, setSortingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const allCategories = [...CATEGORIES, ...customCategories];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files[0]);
    }
  };

  const handleCategorize = (itemId: string, category: string) => {
    setSortingId(itemId);
    setTimeout(() => {
      onCategorize(itemId, category);
      setSortingId(null);
    }, 250);
  };

  const handleDelete = (itemId: string) => {
    setDeletingId(itemId);
    setTimeout(() => {
      onDelete(itemId);
      setDeletingId(null);
    }, 300);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="INNBOKS" inboxCount={inbox.length} />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Alert banner */}
        {inbox.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 rounded-xl px-5 py-4 mb-6"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '4px solid var(--accent-yellow)',
            }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Du har {inbox.length} {inbox.length === 1 ? 'fil' : 'filer'} som trenger sortering. Kategoriser dem for å holde orden i arkivet.
            </span>
          </motion.div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-8 text-center mb-6 cursor-pointer transition-all duration-200"
          style={{
            borderColor: isDragging ? 'var(--accent-yellow)' : 'var(--border-color)',
            backgroundColor: isDragging ? 'rgba(232,255,71,0.05)' : 'var(--bg-secondary)',
          }}
        >
          <Inbox size={40} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Dra filer hit, eller klikk for å laste opp
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            PDF, JPG, PNG opptil 50MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        {/* File list */}
        {inbox.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <Inbox size={64} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
            <p className="text-lg font-medium mt-4" style={{ color: 'var(--text-primary)' }}>
              Innboksen er tom — alt er sortert!
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Nye filer du laster opp vil vises her til du kategoriserer dem.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {inbox.map((item, i) => (
              <motion.div
                key={item.id ?? `inbox-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: sortingId === item.id ? 0 : deletingId === item.id ? 0 : 1,
                    scale: sortingId === item.id ? 0.95 : deletingId === item.id ? 0.95 : 1,
                    x: deletingId === item.id ? 200 : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.95, x: 200 }}
                  transition={{ duration: 0.25 }}
                  layout
                  className="flex items-center gap-5 rounded-xl px-6 py-4"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderLeft: '3px solid var(--accent-yellow)',
                  }}
                >
                  {/* File icon */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <FileText size={24} style={{ color: 'var(--text-secondary)' }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(item.date)} · {formatSize(item.size)}
                    </p>
                  </div>

                  {/* Category buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {allCategories.map((cat) => {
                      const Icon = getIcon(cat.icon);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorize(item.id, cat.id)}
                          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 group"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${cat.color}30`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          }}
                          title={cat.label}
                        >
                          <Icon size={16} style={{ color: cat.color }} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-red)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
