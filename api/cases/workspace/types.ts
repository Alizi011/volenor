export interface CaseWorkspace {
  case: any;
  documents: any[];
  events: any[];
  finance: any[];

  notes: any[];
  parties: any[];
  communications: any[];
  journal: any[];

  aiSummary: string | null;

  statistics: {
    documentCount: number;
    eventCount: number;
    financeCount: number;
    noteCount: number;
    partyCount: number;
    communicationCount: number;
    journalCount: number;
  };
}