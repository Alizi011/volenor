import { useEffect, useState } from "react";

export interface InboxDocument {
  id: number;
  householdId: number;
  uploadedByUserId: number | null;
  source: string;
  fromEmail: string | null;
  subject: string | null;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  status: string;
  detectedType: string | null;
  detectedSender: string | null;
  detectedAmount: number | null;
  detectedDueDate: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  createdAt: string;
}

export function useInboxDocuments() {
  const [documents, setDocuments] = useState<InboxDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);

    const res = await fetch("/api/inbox_documents");
    const json = await res.json();

    setDocuments(json.inboxDocuments ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    refresh: fetchDocuments,
  };
}