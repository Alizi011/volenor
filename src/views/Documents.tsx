import { useState, useMemo, useRef } from 'react';
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
  onUpdateDocument: (doc: Document) => void;
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
  //onAddDocument,
  onDeleteDocument,
  onAddCustomCategory,
  onUpdateDocument,
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
  const [editDocument, setEditDocument] = useState({
  name: '',
  category: '',
  date: '',
  amount: '',
  tags: '',
  notes: '',
});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false); // Ny tilstand for å styre opplastingsmodalen herfra

  // Kategori-skjema tilstander
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState(AVAILABLE_ICONS[0]);
  const [catColor, setCatColor] = useState(AVAILABLE_COLORS[0]);

  // --- NYE LIVLIGE OPPSETT FOR EKTE FILOPPLASTING ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    uploadType: 'document',
  name: '',
  category: CATEGORIES[0]?.id ?? '',
  tags: '',
  notes: '',
  isFinancialDocument: false,
  amount: '',
  financeType: 'none',
  dueDate: '',
  isPaid: false,
  financialDocumentType: 'none',
  financialCategory: '',
  bankName: '',
  accountNumber: '',
  periodStart: '',
  periodEnd: '',
});

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

  console.log("DOCUMENTS I SIDEPANELET:", documents);
  console.log("CATEGORY COUNTS:", categoryCounts);

  const handleContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, docId });
  };

  const handleDelete = (id: string) => {
    onDeleteDocument(id);
    setContextMenu(null);
    addToast('info', 'Dokument slettet');
  };

const openDocumentPreview = (doc: Document) => {
  setPreviewDoc(doc);

  setEditDocument({
    name: doc.name ?? '',
    category: doc.category ?? '',
    date: doc.date ?? '',
    amount: String((doc as any).amount ?? ''),
    tags: Array.isArray(doc.tags) ? doc.tags.join(', ') : '',
    notes: doc.notes ?? '',
  });
};

const saveDocumentChanges = async () => {
  if (!previewDoc) return;

  try {
    const response = await fetch(`/api/documents/${previewDoc.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: editDocument.name,
        category: editDocument.category,
        date: editDocument.date,
        amount: Number(editDocument.amount || 0),
        tags: editDocument.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
        notes: editDocument.notes,
      }),
    });

    const result = await response.json();

    if (result.success) {
    const updatedDocument = {
  ...previewDoc,
  name: editDocument.name,
  category: editDocument.category,
  date: editDocument.date,
  amount: Number(editDocument.amount || 0),
  tags: editDocument.tags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean),
  notes: editDocument.notes,
};

onUpdateDocument(updatedDocument);
addToast('success', 'Dokument oppdatert');
setPreviewDoc(null);

    } else {
      addToast('error', result.message || 'Kunne ikke lagre dokumentet');
    }
  } catch (error) {
    console.error(error);
    addToast('error', 'Kunne ikke kontakte serveren');
  }
};


  // --- FUNKSJONER FOR KLIKK OG DRAG & DROP PÅ DEN STIPLED BOKSEN ---
  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupFileInfo(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFileInfo(e.dataTransfer.files[0]);
    }
  };

  const setupFileInfo = (file: File) => {
    setSelectedFile(file);
    setUploadForm(prev => ({ ...prev, name: file.name })); // Fyller automatisk filnavn-feltet
  };

  // Sender dataene til det nye Hono-endepunktet ditt på serveren
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      addToast('warning', 'Vennligst velg en fil først.');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', uploadForm.name);
    formData.append('category', uploadForm.category);
    formData.append('tags', uploadForm.tags);
    formData.append('notes', uploadForm.notes);
    formData.append('amount', uploadForm.amount);
    formData.append('financeType', uploadForm.financeType);
    formData.append('dueDate', uploadForm.dueDate);
    formData.append('isPaid', uploadForm.isPaid ? '1' : '0');
    formData.append('financialDocumentType', uploadForm.financialDocumentType);
    formData.append('financialCategory', uploadForm.financialCategory);
    formData.append('bankName', uploadForm.bankName);
    formData.append('accountNumber', uploadForm.accountNumber);
    formData.append('periodStart', uploadForm.periodStart);
    formData.append('periodEnd', uploadForm.periodEnd);
    

    

    // Finn filtype basert på etternavn
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const docType = ext === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(ext || '') ? 'image' : 'doc';
    formData.append('type', docType);

    try {
      // Vi bruker nå den rene relative API-stien siden Hono kjører på /api
      const endpoint =
  uploadForm.uploadType === 'bank'
    ? '/api/last_opp_bank'
    : '/api/last_opp';

const response = await fetch(endpoint, {
  method: 'POST',
  body: formData,
});

      const result = await response.json();

      if (result.success) {
        addToast('success', 'Dokumentet ble fysisk lagret på serveren!');
        
        // Oppdaterer frontend-listen med en gang
       //onAddDocument({
       // name: uploadForm.name,
       // category: uploadForm.category,
       // type: docType as any,
       // tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
       // notes: uploadForm.notes,
       // date: new Date().toISOString().slice(0, 10),
        //size: selectedFile.size,
        //fileData: result.filePath ?? result.fileData ?? result.url ?? null,
      //});

        // Nullstill skjemaet og lukk modalen
        setSelectedFile(null);
        setUploadForm({
  uploadType: 'document',
  name: '',
          category: CATEGORIES[0]?.id ?? '',
          tags: '',
          notes: '',
          isFinancialDocument: false,
          amount: '',
          financeType: 'none',
          dueDate: '',
          isPaid: false,
          financialDocumentType: 'none',
          financialCategory: '',
          bankName: '',
          accountNumber: '',
          periodStart: '',
          periodEnd: '',
        });
        setShowUploadModal(false);
        
        window.location.reload();
      } else {
        addToast('error', `Feil fra Hono-server: ${result.message}`);
      }
    } catch (error) {
      console.error('Nettverksfeil ved opplasting:', error);
      addToast('error', 'Kunne ikke opprette kontakt med Hono-backenden.');
    }
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
  const ResolvedIcon = builtInIcons[name] || getIcon(name) || FolderOpen;
  return <ResolvedIcon size={size} style={{ color }} />;
};

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="DOKUMENTARKIV"
        showSearch
        searchPlaceholder="Søk i dokumenter..."
        onSearch={setSearchQuery}
        showUpload
        onUpload={() => setShowUploadModal(true)} // Endret til å bare åpne modalen vår herfra!
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
                    type="button"
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
                console.log("DOC", doc);
                const cat = getCategoryInfo(doc.category);
                return (
                  <motion.div
                    key={doc.id ?? `doc-list-${i}`}
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
                    onClick={() => openDocumentPreview(doc)}
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
                    key={doc.id ?? `doc-grid-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl p-5 cursor-pointer transition-all duration-200"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    onClick={() => openDocumentPreview(doc)}
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

      {/* --- LIVE FILOPPLASTINGS MODAL --- */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none"
            >
              <div
                className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 pointer-events-auto"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Last opp dokument
                  </h2>
                  <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">

                  <div className="grid grid-cols-2 gap-2">
  <button
    type="button"
    onClick={() =>
      setUploadForm(prev => ({
        ...prev,
        uploadType: 'document',
      }))
    }
    className="h-10 rounded-lg text-sm font-medium"
    style={{
      backgroundColor: uploadForm.uploadType === 'document' ? 'var(--accent-yellow)' : 'var(--bg-tertiary)',
      color: uploadForm.uploadType === 'document' ? '#0a0a0a' : 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    }}
  >
    Dokument
  </button>

  <button
    type="button"
    onClick={() =>
      setUploadForm(prev => ({
        ...prev,
          uploadType: 'bank',
          category: '',
          tags: '',
          notes: '',
          isFinancialDocument: false,
          financeType: 'none',
          financialDocumentType: 'bank',
          financialCategory: '',
          bankName: '',
          accountNumber: '',
          periodStart: '',
          periodEnd: '',
          amount: '',
          dueDate: '',
          isPaid: false,
      }))
    }
    className="h-10 rounded-lg text-sm font-medium"
    style={{
      backgroundColor: uploadForm.uploadType === 'bank' ? 'var(--accent-yellow)' : 'var(--bg-tertiary)',
      color: uploadForm.uploadType === 'bank' ? '#0a0a0a' : 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    }}
  >
    Bankutskrift
  </button>
</div>
                  {/* Det ekte, usynlige inputet */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />

                  {/* Stiplet boks for Klikk & Drop */}
                  <div 
                    onClick={handleBoxClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-yellow-400 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900 transition-all text-center"
                  >
                    <FolderInput size={32} className="text-yellow-400 mb-2" />
                    <p className="text-sm font-medium text-zinc-300">
                      {selectedFile ? `Valgt: ${selectedFile.name}` : "Dra filer hit, eller klikk for å velge"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">PDF, JPG, PNG opptil 50MB</p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Filnavn</label>
                    <input
                      type="text"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

{uploadForm.uploadType === 'bank' && (
  <div
    className="space-y-4 rounded-lg p-3"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)'
    }}
  >
    <div>
      <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Bank
      </label>
      <input
        type="text"
        value={uploadForm.bankName}
        onChange={(e) => setUploadForm(prev => ({ ...prev, bankName: e.target.value }))}
        placeholder="F.eks. Nordea"
        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
      />
    </div>

    <div>
      <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Kontonummer
      </label>
      <input
        type="text"
        value={uploadForm.accountNumber}
        onChange={(e) => setUploadForm(prev => ({ ...prev, accountNumber: e.target.value }))}
        placeholder="Valgfritt"
        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Fra dato
        </label>
        <input
          type="date"
          value={uploadForm.periodStart}
          onChange={(e) => setUploadForm(prev => ({ ...prev, periodStart: e.target.value }))}
          className="w-full h-11 rounded-lg px-3 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Til dato
        </label>
        <input
          type="date"
          value={uploadForm.periodEnd}
          onChange={(e) => setUploadForm(prev => ({ ...prev, periodEnd: e.target.value }))}
          className="w-full h-11 rounded-lg px-3 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  </div>
)}

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Kategori</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none appearance-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {allCategories.map(c => (
                        <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--bg-secondary)' }}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tags</label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="Skilt med komma..."
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notater</label>
                    <textarea
                      value={uploadForm.notes}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Valgfrie notater..."
                      className="w-full h-20 rounded-lg p-3 text-sm outline-none resize-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                   <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <label
                      className="flex items-center gap-2 text-sm cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <input
                        type="checkbox"
                        checked={uploadForm.isFinancialDocument}
                        onChange={(e) =>
                          setUploadForm(prev => ({
                            ...prev,
                            isFinancialDocument: e.target.checked,
                            financeType: e.target.checked ? 'expense' : 'none',
                            financialDocumentType: e.target.checked ? 'expense' : 'none',
                          }))
                        }
                      />
                      Dette er et økonomidokument
                    </label>
                  </div>

                  {uploadForm.isFinancialDocument && (
  <div
    className="space-y-4 rounded-lg p-3"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)'
    }}
  >
        <div>
          <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Beløp
          </label>
          <input
            type="number"
            value={uploadForm.amount}
            onChange={(e) => setUploadForm(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="F.eks. 1250"
            className="w-full h-11 rounded-lg px-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Type
          </label>
          <select
            value={uploadForm.financeType}
            onChange={(e) => setUploadForm(prev => ({ ...prev, financeType: e.target.value }))}
            className="w-full h-11 rounded-lg px-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="expense">Utgift</option>
            <option value="income">Inntekt</option>
            <option value="none">Kun dokument</option>
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Dokumenttype
          </label>
          <select
            value={uploadForm.financialDocumentType}
            onChange={(e) => setUploadForm(prev => ({ ...prev, financialDocumentType: e.target.value }))}
            className="w-full h-11 rounded-lg px-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="expense">Utgift</option>
            <option value="income">Inntekt</option>
            <option value="debt">Gjeld / inkasso</option>
            <option value="legal">Juridisk / namsmannen</option>
            <option value="contract">Avtale</option>
            <option value="receipt">Kvittering</option>
            <option value="insurance">Forsikring</option>
            <option value="tax">Skatt</option>
            <option value="bank">Bank</option>
            <option value="other">Annet</option>
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Økonomikategori
          </label>
          <input
            type="text"
            value={uploadForm.financialCategory}
            onChange={(e) => setUploadForm(prev => ({ ...prev, financialCategory: e.target.value }))}
            placeholder="F.eks. Strøm, Husleie, Inkasso..."
            className="w-full h-11 rounded-lg px-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Forfallsdato
          </label>
          <input
            type="date"
            value={uploadForm.dueDate}
            onChange={(e) => setUploadForm(prev => ({ ...prev, dueDate: e.target.value }))}
            className="w-full h-11 rounded-lg px-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={uploadForm.isPaid}
            onChange={(e) => setUploadForm(prev => ({ ...prev, isPaid: e.target.checked }))}
          />
          Dokumentet er betalt
        </label>
      </div>
    )}

                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleUploadSubmit}
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
                {
  icon: Eye,
  label: 'Åpne',
  action: () => {
    const doc = documents.find(d => d.id === contextMenu.docId);
    if (doc) openDocumentPreview(doc);
    setContextMenu(null);
  },
},
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
                <input
  type="text"
  value={editDocument.name}
  onChange={(e) =>
    setEditDocument((prev) => ({
      ...prev,
      name: e.target.value,
    }))
  }
  className="flex-1 h-10 rounded-lg px-3 text-sm font-semibold outline-none"
  style={{
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  }}
/>
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
                className="h-80 rounded-xl overflow-hidden mb-6"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                {previewDoc.fileData ? (
                  previewDoc.type === 'pdf' ? (
                    <iframe
                      src={previewDoc.fileData}
                      title={previewDoc.name}
                      className="w-full h-full"
                    />
                  ) : previewDoc.type === 'image' ? (
                    <img
                      src={previewDoc.fileData}
                      alt={previewDoc.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <FileText size={64} style={{ color: '#f87171', marginBottom: '1rem' }} />
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Forhåndsvisning ikke tilgjengelig
                      </p>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <FileText size={64} style={{ color: '#f87171', marginBottom: '1rem' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Ingen filbane funnet
                    </p>
                  </div>
                )}
              </div>

                <div className="space-y-4">

                <div>
                  <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Kategori
                  </label>
                  <select
                    value={editDocument.category}
                    onChange={(e) =>
                      setEditDocument((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                  <div>
  <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
    Dato
  </label>
  <input
    type="date"
    value={editDocument.date}
    onChange={(e) =>
      setEditDocument((prev) => ({
        ...prev,
        date: e.target.value,
      }))
    }
    className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
    }}
  />
</div>


             <div>
  <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
    Beløp
  </label>
  <input
    type="number"
    step="0.01"
    inputMode="decimal"
    value={editDocument.amount}
    onChange={(e) =>
      setEditDocument((prev) => ({
        ...prev,
        amount: e.target.value,
      }))
    }
    className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
    }}
  />
</div>
                <div>
  <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
    Tags
  </label>
  <input
    type="text"
    value={editDocument.tags}
    onChange={(e) =>
      setEditDocument((prev) => ({
        ...prev,
        tags: e.target.value,
      }))
    }
    placeholder="Skilt med komma..."
    className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
    }}
  />
</div>
                  <div>
  <label
    className="text-xs uppercase tracking-wider font-medium"
    style={{ color: 'var(--text-secondary)' }}
  >
    Notater
  </label>

  <textarea
    value={editDocument.notes}
    onChange={(e) =>
      setEditDocument((prev) => ({
        ...prev,
        notes: e.target.value,
      }))
    }
    rows={4}
    placeholder="Skriv notater om dokumentet..."
    className="mt-2 w-full rounded-lg px-3 py-3 text-sm outline-none resize-none"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
    }}
  />
</div>
                </div>
              </div>

              <div
              className="flex gap-3 px-6 py-4 shrink-0"
              style={{ borderTop: '1px solid var(--border-color)' }}
            >
             <button
  onClick={() => {
    if (previewDoc?.fileData) {
      window.open(previewDoc.fileData, "_blank");
    } else {
      addToast("warning", "Ingen fil å laste ned");
    }
  }}
  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
  style={{
    backgroundColor: "var(--bg-tertiary)",
    color: "var(--text-primary)",
  }}
>
  <Download size={16} />
  Last ned
</button>

              <button
                onClick={saveDocumentChanges}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--accent-yellow)',
                  color: '#0a0a0a',
                }}
              >
                Lagre endringer
              </button>

              <button
                onClick={() => {
                  handleDelete(previewDoc.id);
                  setPreviewDoc(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--accent-red)',
                  color: '#fff',
                }}
              >
                <Trash2 size={16} />
                Slett
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
                       const ResolvedIcon = getIcon(iconName) || FolderOpen;
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
                            <ResolvedIcon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Farge</label>
                    <div className="grid grid-cols-9 gap-2">
                      {AVAILABLE_COLORS.map((color, i) => (
                      <button
                        key={`${color}-${i}`}
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
                      {(() => {
                      const ResolvedIcon = getIcon(catIcon) || FolderOpen;
                      return <ResolvedIcon size={18} style={{ color: catColor }} />;
                    })()}
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