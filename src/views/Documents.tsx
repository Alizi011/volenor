import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  List,
  LayoutGrid,
  MoreVertical,
  FolderOpen,
  Plus,
  Download,
  Pencil,
  FolderInput,
  Trash2,
  Eye,
  X,
  Receipt,
  Landmark,
  Shield,
  Heart,
  Home,
  Briefcase,
  Bookmark,
} from 'lucide-react';
import type { Document, CustomCategory } from '../types';
import { CATEGORIES, AVAILABLE_ICONS, AVAILABLE_COLORS, generateId } from '../data/demoData';
import { getIcon } from '../lib/iconMap';
import Header from '../components/Header';

interface DocumentsProps {
  documents: Document[];
  customCategories: CustomCategory[];
  onAddDocument: (doc: Partial<Document>) => void;
  onDeleteDocument: (id: string) => void;
  onAddCustomCategory: (cat: CustomCategory) => void;
  onDeleteCustomCategory: (id: string) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

const builtInIcons: Record<string, React.ElementType> = {
  Receipt, Landmark, Shield, Heart, Home, Briefcase, Bookmark,
};

type FilterType = 'all' | 'pdf' | 'image' | 'doc';
type ViewMode = 'list' | 'grid';

function useAllCategories(customCategories: CustomCategory[]) {
  return useMemo(() => {
    const builtIn = CATEGORIES.map((c) => ({ ...c, isCustom: false }));
    const custom = customCategories.map((c) => ({ ...c, isCustom: true }));
    return [...builtIn, ...custom];
  }, [customCategories]);
}

export default function Documents({
  documents,
  customCategories,
  onAddDocument,
  onDeleteDocument,
  onAddCustomCategory,
  onDeleteCustomCategory,
  addToast,
}: DocumentsProps) {
  const allCategories = useAllCategories(customCategories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; docId: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Category form state
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState(AVAILABLE_ICONS[0]);
  const [catColor, setCatColor] = useState(AVAILABLE_COLORS[0]);

  const filteredDocs = useMemo(() => {
    let filtered = documents;
    if (selectedCategory) {
      filtered = filtered.filter((d) => d.category === selectedCategory);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter((d) => d.type === filterType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.notes.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [documents, selectedCategory, filterType, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const handleContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, docId });
  };

  const handleDelete = (id: string) => {
    onDeleteDocument(id);
    setContextMenu(null);
    addToast('info', 'Dokument slettet');
  };

  const handleAddCategory = () => {
    if (!catName.trim()) return;
    const id = generateId();
    onAddCustomCategory({ id, label: catName, icon: catIcon, color: catColor });
    addToast('success', `Kategori "${catName}" opprettet`);
    setCatName('');
    setShowCategoryModal(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryInfo = (catId: string) => allCategories.find((c) => c.id === catId as any);

  const CategoryIcon = ({ name, color, size = 18 }: { name: string; color: string; size?: number }) => {
    const Icon = builtInIcons[name] || getIcon(name);
    return <Icon size={size} style={{ color }} />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="DOKUMENTARKIV"
        showSearch
        searchPlaceholder="Søk i dokumenter..."
        onSearch={setSearchQuery}
        showUpload
        onUpload={(doc) => {
          onAddDocument(doc);
          addToast('success', 'Dokument lastet opp');
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Folder tree */}
        <div
          className="w-64 shrink-0 overflow-y-auto p-5 hidden md:block"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
          }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Kategorier
          </h3>
          <div className="space-y-1">
            {allCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                    borderLeft: isActive ? `3px solid ${cat.color}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <CategoryIcon name={cat.icon} color={cat.color} />
                  <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {cat.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {count}
                  </span>
                  {cat.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomCategory(cat.id);
                        if (selectedCategory === cat.id) setSelectedCategory(null);
                        addToast('info', 'Kategori slettet');
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add category button */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mt-3 transition-all duration-200"
            style={{ border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-yellow)';
              e.currentTarget.style.color = 'var(--accent-yellow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Plus size={18} />
            <span className="text-sm">Ny kategori</span>
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedCategory
                  ? getCategoryInfo(selectedCategory)?.label
                  : 'Alle dokumenter'}
              </h2>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                ({filteredDocs.length} filer)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                {(
                  [
                    { value: 'all', label: 'Alle' },
                    { value: 'pdf', label: 'PDF' },
                    { value: 'image', label: 'Bilder' },
                    { value: 'doc', label: 'Dokumenter' },
                  ] as { value: FilterType; label: string }[]
                ).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilterType(f.value)}
                    className="px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: filterType === f.value ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                      color: filterType === f.value ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                      borderRight: '1px solid var(--border-color)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 transition-colors"
                  style={{
                    backgroundColor: viewMode === 'list' ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    color: viewMode === 'list' ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                  }}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 transition-colors"
                  style={{
                    backgroundColor: viewMode === 'grid' ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    color: viewMode === 'grid' ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                  }}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* File display */}
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FolderOpen size={64} className="mb-4" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
              <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>
                Ingen filer i denne kategorien
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Last opp et dokument for å komme i gang
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div>
              <div
                className="grid gap-4 px-4 pb-3 text-xs font-medium uppercase"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 0.75fr 50px',
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span>Navn</span>
                <span>Kategori</span>
                <span>Dato</span>
                <span>Størrelse</span>
                <span></span>
              </div>

              {filteredDocs.map((doc, i) => {
                const cat = getCategoryInfo(doc.category);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="grid gap-4 px-4 py-3 items-center cursor-pointer transition-colors"
                    style={{
                      gridTemplateColumns: '2fr 1fr 1fr 0.75fr 50px',
                      borderBottom: '1px solid rgba(42,42,42,0.5)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => setPreviewDoc(doc)}
                    onContextMenu={(e) => handleContextMenu(e, doc.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                      <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {doc.name}
                      </span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-md w-fit"
                      style={{
                        backgroundColor: `${cat?.color}20`,
                        color: cat?.color,
                      }}
                    >
                      {cat?.label}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(doc.date)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatSize(doc.size)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, doc.id);
                      }}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
              {filteredDocs.map((doc, i) => {
                const cat = getCategoryInfo(doc.category);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl p-5 cursor-pointer transition-all duration-200"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    onClick={() => setPreviewDoc(doc)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                      e.currentTarget.style.border = '1px solid var(--border-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.border = '1px solid transparent';
                    }}
                  >
                    <div
                      className="h-28 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <FileText size={36} style={{ color: '#f87171' }} />
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {doc.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(doc.date)}
                    </p>
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-md mt-2"
                      style={{
                        backgroundColor: `${cat?.color}20`,
                        color: cat?.color,
                      }}
                    >
                      {cat?.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[100] w-48 rounded-xl py-1.5 shadow-xl"
              style={{
                top: contextMenu.y,
                left: contextMenu.x,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {[
                { icon: Eye, label: 'Åpne', action: () => { setPreviewDoc(documents.find(d => d.id === contextMenu.docId) || null); setContextMenu(null); } },
                { icon: Download, label: 'Last ned', action: () => { setContextMenu(null); addToast('info', 'Nedlasting startet'); } },
                { icon: Pencil, label: 'Endre navn', action: () => { setContextMenu(null); } },
                { icon: FolderInput, label: 'Flytt til...', action: () => { setContextMenu(null); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
              <div className="my-1" style={{ borderTop: '1px solid var(--border-color)' }} />
              <button
                onClick={() => handleDelete(contextMenu.docId)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                style={{ color: 'var(--accent-red)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Trash2 size={16} />
                Slett
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Preview panel */}
      <AnimatePresence>
        {previewDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[110]"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setPreviewDoc(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-[640px] max-w-full z-[120] flex flex-col overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border-color)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <h3 className="text-base font-semibold truncate pr-4" style={{ color: 'var(--text-primary)' }}>
                  {previewDoc.name}
                </h3>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div
                  className="h-80 rounded-xl flex flex-col items-center justify-center mb-6"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <FileText size={64} style={{ color: '#f87171', marginBottom: '1rem' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    PDF-forhåndsvisning
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    (Simulert i demo-versjon)
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Kategori
                    </label>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                      {getCategoryInfo(previewDoc.category)?.label}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Dato
                    </label>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(previewDoc.date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Størrelse
                    </label>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                      {formatSize(previewDoc.size)}
                    </p>
                  </div>
                  {previewDoc.tags.length > 0 && (
                    <div>
                      <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {previewDoc.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {previewDoc.notes && (
                    <div>
                      <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>Notater</label>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{previewDoc.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <Download size={16} /> Last ned
                </button>
                <button
                  onClick={() => { handleDelete(previewDoc.id); setPreviewDoc(null); }}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}
                >
                  <Trash2 size={16} /> Slett
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add category modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={() => setShowCategoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none"
            >
              <div
                className="w-full max-w-md rounded-2xl p-8 pointer-events-auto"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Ny kategori
                  </h2>
                  <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Navn</label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="F.eks. Hobby, Skole, Barn..."
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Ikon</label>
                    <div className="grid grid-cols-8 gap-2">
                      {AVAILABLE_ICONS.map((iconName) => {
                        const Icon = getIcon(iconName);
                        const isSelected = catIcon === iconName;
                        return (
                          <button
                            key={iconName}
                            onClick={() => setCatIcon(iconName)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: isSelected ? `${catColor}30` : 'var(--bg-tertiary)',
                              border: isSelected ? `2px solid ${catColor}` : '2px solid transparent',
                              color: isSelected ? catColor : 'var(--text-secondary)',
                            }}
                            title={iconName}
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Farge</label>
                    <div className="grid grid-cols-9 gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setCatColor(color)}
                          className="w-8 h-8 rounded-lg transition-all"
                          style={{
                            backgroundColor: color,
                            border: catColor === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                            transform: catColor === color ? 'scale(1.15)' : 'scale(1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Forhåndsvisning:</span>
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = getIcon(catIcon); return <Icon size={18} style={{ color: catColor }} />; })()}
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {catName || 'Min kategori'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleAddCategory}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}
                  >
                    Opprett
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
