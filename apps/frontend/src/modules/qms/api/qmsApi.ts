export interface QualityInspection {
  id: string;
  inspectionNumber: string;
  date: string;
  type: "IQC" | "IPQC" | "FQC";
  stageName: string;
  itemCode: string;
  itemName: string;
  lotNumber: string;
  sampleSize: number;
  defectsCount: number;
  defectRate: number;
  status: "Passed" | "Conditional" | "Rejected";
  inspector: string;
  defectsBreakdown?: string;
  remarks: string;
}

export interface NonConformanceReport {
  id: string;
  ncrNumber: string;
  date: string;
  title: string;
  partNumber: string;
  partName: string;
  severity: "Critical" | "Major" | "Minor";
  stage: "Incoming" | "In-Process" | "Final Inspection" | "Customer Return";
  defectDescription: string;
  rootCauseCategory: "Material" | "Machine" | "Method" | "Manpower" | "Environment";
  containmentAction: string;
  disposition: "Rework" | "Scrap" | "Return to Vendor" | "Use As-Is (Concession)";
  status: "Open" | "Under Investigation" | "Disposition Assigned" | "Closed";
  assignedTo: string;
  targetDate: string;
}

export interface CapaItem {
  id: string;
  capaNumber: string;
  title: string;
  ncrReference: string;
  problemStatement: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  verificationMethod: string;
  owner: string;
  dueDate: string;
  status: "Draft" | "Investigation" | "Action Implemented" | "Verification" | "Closed";
  progress: number;
}

export interface QualityAudit {
  id: string;
  auditNumber: string;
  title: string;
  type: "Internal ISO 9001" | "Process Audit" | "Supplier Quality" | "Safety & Environmental";
  department: string;
  auditDate: string;
  leadAuditor: string;
  status: "Scheduled" | "In Progress" | "Completed";
  score: number;
  minorFindings: number;
  majorFindings: number;
  opportunities: number;
}

const DEFAULT_INSPECTIONS: QualityInspection[] = [
  {
    id: "insp-001",
    inspectionNumber: "INS-2026-0842",
    date: "2026-10-15",
    type: "IQC",
    stageName: "Raw Timber Receiving",
    itemCode: "WD-TEAK-01",
    itemName: "Teak Wood Planks 2x4",
    lotNumber: "LOT-9921",
    sampleSize: 125,
    defectsCount: 1,
    defectRate: 0.8,
    status: "Passed",
    inspector: "Vipin Sharma",
    defectsBreakdown: "1 minor knot deviation",
    remarks: "Moisture content verified at 11.2%, well within 12% acceptance threshold.",
  },
  {
    id: "insp-002",
    inspectionNumber: "INS-2026-0841",
    date: "2026-10-15",
    type: "IPQC",
    stageName: "CNC Routing & Tenoning",
    itemCode: "FR-LEG-CHAIR",
    itemName: "Ergonomic Chair Front Legs",
    lotNumber: "LOT-8830",
    sampleSize: 80,
    defectsCount: 3,
    defectRate: 3.75,
    status: "Passed",
    inspector: "Rajesh Kumar",
    defectsBreakdown: "2 tool marks, 1 dimensional variance (+0.4mm)",
    remarks: "Approved under secondary sanding tolerance.",
  },
  {
    id: "insp-003",
    inspectionNumber: "INS-2026-0840",
    date: "2026-10-14",
    type: "FQC",
    stageName: "Finished Goods Pack-out",
    itemCode: "TBL-EXEC-6FT",
    itemName: "Executive Walnut Desk 6ft",
    lotNumber: "LOT-7714",
    sampleSize: 50,
    defectsCount: 4,
    defectRate: 8.0,
    status: "Rejected",
    inspector: "Amit Verma",
    defectsBreakdown: "3 lacquer bubbles, 1 drawer slide misalignment",
    remarks: "NCR-2026-044 generated. Returned to Finishing line for touch-up buffing.",
  },
  {
    id: "insp-004",
    inspectionNumber: "INS-2026-0839",
    date: "2026-10-14",
    type: "IPQC",
    stageName: "Lacquer Spray Coating",
    itemCode: "CAB-WALL-03",
    itemName: "Wall Hanging Display Cabinet",
    lotNumber: "LOT-6629",
    sampleSize: 60,
    defectsCount: 2,
    defectRate: 3.33,
    status: "Conditional",
    inspector: "Sunil Dogra",
    defectsBreakdown: "2 minor overspray spots on back panel",
    remarks: "Conditional acceptance: back panel concealed; buffing required before packing.",
  },
  {
    id: "insp-005",
    inspectionNumber: "INS-2026-0838",
    date: "2026-10-13",
    type: "IQC",
    stageName: "Hardware & Fittings Inward",
    itemCode: "HDW-SLIDE-SOFT",
    itemName: "Soft-Close Telescopic Channel 450mm",
    lotNumber: "LOT-5510",
    sampleSize: 200,
    defectsCount: 0,
    defectRate: 0.0,
    status: "Passed",
    inspector: "Vipin Sharma",
    defectsBreakdown: "Zero defect",
    remarks: "Cycle tested 25 random samples to 100 opening cycles. 100% smooth actuation.",
  },
];

const DEFAULT_NCRS: NonConformanceReport[] = [
  {
    id: "ncr-001",
    ncrNumber: "NCR-2026-044",
    date: "2026-10-14",
    title: "Lacquer Blistering and Surface Bubbling on Walnut Desks",
    partNumber: "TBL-EXEC-6FT",
    partName: "Executive Walnut Desk Top",
    severity: "Major",
    stage: "Final Inspection",
    defectDescription: "Visible micro-bubbles across 4 table surfaces post curing oven.",
    rootCauseCategory: "Environment",
    containmentAction: "Quarantined 22 units from lot LOT-7714 in Bay 4.",
    disposition: "Rework",
    status: "Under Investigation",
    assignedTo: "Manoj Singh (Finishing Lead)",
    targetDate: "2026-10-18",
  },
  {
    id: "ncr-002",
    ncrNumber: "NCR-2026-043",
    date: "2026-10-12",
    title: "Mortise and Tenon Joint Loose Clearance (+0.8mm)",
    partNumber: "FR-LEG-CHAIR",
    partName: "Chair Leg Tenon",
    severity: "Critical",
    stage: "In-Process",
    defectDescription: "Tenon width milled below lower tolerance limit resulting in wobbly chair base joints.",
    rootCauseCategory: "Machine",
    containmentAction: "Stopped CNC machine #04 immediately; calibrated milling cutter.",
    disposition: "Scrap",
    status: "Disposition Assigned",
    assignedTo: "Gurpreet Singh (Machining)",
    targetDate: "2026-10-16",
  },
  {
    id: "ncr-003",
    ncrNumber: "NCR-2026-042",
    date: "2026-10-09",
    title: "Supplier Hex Bolt Head Dimension Non-Standard",
    partNumber: "BLT-M6-40",
    partName: "M6 x 40mm Zinc Plated Bolts",
    severity: "Minor",
    stage: "Incoming",
    defectDescription: "Hex socket head broaching depth is 0.3mm shallow, Allen keys slipping.",
    rootCauseCategory: "Material",
    containmentAction: "Lot marked Rejected and segregated in Red quarantine rack.",
    disposition: "Return to Vendor",
    status: "Closed",
    assignedTo: "Vipin Sharma (IQC)",
    targetDate: "2026-10-11",
  },
];

const DEFAULT_CAPAS: CapaItem[] = [
  {
    id: "capa-001",
    capaNumber: "CAPA-2026-012",
    title: "Elimination of Spray Booth Humidity-Induced Lacquer Blistering",
    ncrReference: "NCR-2026-044",
    problemStatement: "Seasonal humidity spikes in Finishing Booth #2 causing moisture entrapment in PU topcoat.",
    rootCause: "Desiccant air dryer coalescing filter saturated; inline hygrometer was uncalibrated.",
    correctiveAction: "Replaced coalescing filter element and installed automated dew point monitor.",
    preventiveAction: "Added weekly PM checklist item for compressed air moisture verification with alert threshold.",
    verificationMethod: "Inspect 5 consecutive production lots with zero blister defects over 14 days.",
    owner: "Manoj Singh & Amit Verma",
    dueDate: "2026-10-25",
    status: "Action Implemented",
    progress: 75,
  },
  {
    id: "capa-002",
    capaNumber: "CAPA-2026-011",
    title: "CNC Spindle Tool Wear Drift Detection",
    ncrReference: "NCR-2026-043",
    problemStatement: "Tool wear compensation parameters were not updated between shift handovers.",
    rootCause: "Absence of digital tool life counter and operator manual measurement error.",
    correctiveAction: "Integrated digital vernier Bluetooth upload directly into machine console.",
    preventiveAction: "Hard limit of 250 cycles per carbide insert configured in CNC controller software.",
    verificationMethod: "100% Cpk statistical capability measurement on tenon dimensions > 1.33.",
    owner: "Gurpreet Singh",
    dueDate: "2026-10-20",
    status: "Verification",
    progress: 90,
  },
];

const DEFAULT_AUDITS: QualityAudit[] = [
  {
    id: "aud-001",
    auditNumber: "AUD-2026-Q3-01",
    title: "ISO 9001:2015 Clause 8.5 Internal Process Audit",
    type: "Internal ISO 9001",
    department: "Assembly & Finishing",
    auditDate: "2026-10-22",
    leadAuditor: "Dr. Sandeep Patel (Lead Auditor)",
    status: "Scheduled",
    score: 0,
    minorFindings: 0,
    majorFindings: 0,
    opportunities: 0,
  },
  {
    id: "aud-002",
    auditNumber: "AUD-2026-Q2-04",
    title: "Supplier Quality Management & Traceability Audit",
    type: "Supplier Quality",
    department: "Raw Material & Hardware Stores",
    auditDate: "2026-09-18",
    leadAuditor: "Amit Verma",
    status: "Completed",
    score: 94.5,
    minorFindings: 2,
    majorFindings: 0,
    opportunities: 3,
  },
  {
    id: "aud-003",
    auditNumber: "AUD-2026-Q2-03",
    title: "Finishing & Coating Environmental Compliance",
    type: "Safety & Environmental",
    department: "Finishing Bay & Paint Shop",
    auditDate: "2026-08-30",
    leadAuditor: "Priya Nair",
    status: "Completed",
    score: 91.0,
    minorFindings: 3,
    majorFindings: 1,
    opportunities: 4,
  },
];

const STORAGE_KEYS = {
  INSPECTIONS: "lii_nexus_qms_inspections",
  NCRS: "lii_nexus_qms_ncrs",
  CAPAS: "lii_nexus_qms_capas",
  AUDITS: "lii_nexus_qms_audits",
};

export const qmsApi = {
  // Inspections
  getInspections: async (): Promise<QualityInspection[]> => {
    const raw = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(DEFAULT_INSPECTIONS));
      return DEFAULT_INSPECTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_INSPECTIONS;
    }
  },

  createInspection: async (data: Omit<QualityInspection, "id" | "inspectionNumber">): Promise<QualityInspection> => {
    const list = await qmsApi.getInspections();
    const count = list.length + 843;
    const newItem: QualityInspection = {
      ...data,
      id: "insp-" + Date.now(),
      inspectionNumber: `INS-2026-0${count}`,
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(updated));
    return newItem;
  },

  deleteInspection: async (id: string): Promise<void> => {
    const list = await qmsApi.getInspections();
    const updated = list.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(updated));
  },

  // NCRs
  getNcrs: async (): Promise<NonConformanceReport[]> => {
    const raw = localStorage.getItem(STORAGE_KEYS.NCRS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NCRS, JSON.stringify(DEFAULT_NCRS));
      return DEFAULT_NCRS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_NCRS;
    }
  },

  createNcr: async (data: Omit<NonConformanceReport, "id" | "ncrNumber">): Promise<NonConformanceReport> => {
    const list = await qmsApi.getNcrs();
    const num = list.length + 45;
    const newItem: NonConformanceReport = {
      ...data,
      id: "ncr-" + Date.now(),
      ncrNumber: `NCR-2026-0${num}`,
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEYS.NCRS, JSON.stringify(updated));
    return newItem;
  },

  updateNcrStatus: async (id: string, status: NonConformanceReport["status"]): Promise<void> => {
    const list = await qmsApi.getNcrs();
    const updated = list.map((n) => (n.id === id ? { ...n, status } : n));
    localStorage.setItem(STORAGE_KEYS.NCRS, JSON.stringify(updated));
  },

  // CAPAs
  getCapas: async (): Promise<CapaItem[]> => {
    const raw = localStorage.getItem(STORAGE_KEYS.CAPAS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CAPAS, JSON.stringify(DEFAULT_CAPAS));
      return DEFAULT_CAPAS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CAPAS;
    }
  },

  createCapa: async (data: Omit<CapaItem, "id" | "capaNumber">): Promise<CapaItem> => {
    const list = await qmsApi.getCapas();
    const num = list.length + 13;
    const newItem: CapaItem = {
      ...data,
      id: "capa-" + Date.now(),
      capaNumber: `CAPA-2026-0${num}`,
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEYS.CAPAS, JSON.stringify(updated));
    return newItem;
  },

  // Audits
  getAudits: async (): Promise<QualityAudit[]> => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(DEFAULT_AUDITS));
      return DEFAULT_AUDITS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_AUDITS;
    }
  },

  createAudit: async (data: Omit<QualityAudit, "id" | "auditNumber">): Promise<QualityAudit> => {
    const list = await qmsApi.getAudits();
    const num = list.length + 5;
    const newItem: QualityAudit = {
      ...data,
      id: "aud-" + Date.now(),
      auditNumber: `AUD-2026-Q4-0${num}`,
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(updated));
    return newItem;
  },
};
