export interface CaseWorkspace {
  case: any;
  documents: any[];
  events: any[];
  finance: any[];
  communications: any[];
  aiSummary: string | null;
  statistics: {
    documentCount: number;
    eventCount: number;
    financeCount: number;
    communicationCount: number;
  };
}