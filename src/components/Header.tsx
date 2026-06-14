import { useState, useEffect } from 'react';
import { Search, Upload, X } from 'lucide-react';
//import type { FileType } from '../types';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  onUpload?: (formData: FormData) => void; // Endret til FormData for ekte filoverføring
  searchPlaceholder?: string;
  showSearch?: boolean;
  showUpload?: boolean;
  inboxCount?: number;
}

export default function Header({
  title,
  onSearch,
  onUpload,
  searchPlaceholder = 'Søk...',
  showSearch = false,
  showUpload = false,
  inboxCount,
}: HeaderProps) {
  const [time, setTime] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <>
      <header
        className="h-14 px-8 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-4">
          <h1
            className="text-base font-bold tracking-[0.05em] uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {typeof inboxCount === 'number' && inboxCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}
            >
              {inboxCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSearch && (
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-64 rounded-lg pl-9 pr-3 text-sm outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-yellow)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 255, 71, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {searchValue && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {showUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: 'var(--accent-yellow)',
                color: '#0a0a0a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <Upload size={16} />
              Last opp
            </button>
          )}

          <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {time}
          </span>

          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            BM
          </div>
        </div>
      </header>

      {showUploadModal && onUpload && (
        <UploadModal onClose={() => setShowUploadModal(false)} onUpload={onUpload} />
      )}
    </>
  );
}

function UploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: HeaderProps['onUpload'];
}) {
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('invoices');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleSubmit = () => {
    if (!fileName.trim() || !selectedFile) {
      alert("Vennligst velg en fil og fyll ut filnavn.");
      return;
    }

    // Pakker alt inn i FormData
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', fileName.trim());
    formData.append('category', category);
    formData.append('notes', notes.trim());
    formData.append('type', selectedFile.type.startsWith('image/') ? 'image' : 'pdf');
    
    // Konverterer tags-streng til kommaseparert tekst før sending
    const processedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .join(',');
    formData.append('tags', processedTags);

    onUpload?.(formData);
    onClose();
  };

  const categories: { value: string; label: string }[] = [
    { value: 'invoices', label: 'Fakturaer og regninger' },
    { value: 'bank', label: 'Bank og skatt' },
    { value: 'id', label: 'ID og juridisk' },
    { value: 'health', label: 'Helse' },
    { value: 'vehicle', label: 'Kjøretøy og bolig' },
    { value: 'projects', label: 'Gjøremål og prosjekter' },
    { value: 'receipts', label: 'Referanse og kvitteringer' },
  ];

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
          Last opp dokument
        </h2>

        <label
          className="border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors duration-200 block cursor-pointer"
          style={{ borderColor: 'var(--border-color)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-yellow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <Upload size={40} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            {selectedFile ? selectedFile.name : 'Dra filer hit, eller klikk for å velge'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            PDF, JPG, PNG opptil 50MB
          </p>

          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </label>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Filnavn
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="ÅÅÅÅ-MM-DD_KATEGORI_BESKRIVELSE.pdf"
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
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 rounded-lg px-3 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 h-10 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--accent-yellow)',
              color: '#0a0a0a',
            }}
          >
            Lagre
          </button>
        </div>
      </div>
    </div>
  );
}