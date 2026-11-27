import { axiosInstance } from "../../../services/api/axiosInstance";

export interface CostEstimationItem {
  id?: string;
  category: 'Raw Material' | 'Hardware' | 'Labor' | 'Finishing' | 'Packaging' | 'Overhead' | 'Other';
  item_name: string;
  specification?: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  total_cost?: number;
  remarks?: string;
  length_ft?: number;
  width_in?: number;
  thick_in?: number;
  pcs?: number;
}

export interface CostEstimation {
  id: string;
  estimation_number: string;
  title: string;
  product_code?: string;
  product_name?: string;
  product_type?: string;
  collection_name?: string;
  type_of_costing?: string;
  overall_size?: string;
  wood_type?: string;
  client_name?: string;
  crm_lead_id?: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Rejected';
  currency: string;
  exchange_rate: number;
  total_material_cost: number;
  total_labor_cost: number;
  total_overhead_cost: number;
  total_finishing_cost: number;
  total_packaging_cost: number;
  subtotal_cost: number;
  margin_percentage: number;
  margin_amount: number;
  tax_percentage: number;
  tax_amount: number;
  final_price: number;
  notes?: string;
  form_data?: string | null;
  approval_authority_id?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  items?: CostEstimationItem[];
}

export const FURNITURE_PRODUCT_TYPES: string[] = [
  "Sideboard",
  "Console Table",
  "Coffee Table",
  "Dining Table",
  "Dining Chair",
  "Armchair",
  "Sofa",
  "Bed",
  "Wardrobe",
  "Bedside Table",
  "TV Unit",
  "Bar Cabinet",
  "Bar Stool",
  "Study Desk",
  "Bookshelf",
  "Chest of Drawers",
  "Dressing Table",
  "Bench",
  "Ottoman",
  "Shoe Rack",
  "Mirror Frame",
  "Accent Cabinet",
  "Side Table",
  "Other Furniture",
];

export const ALL_COMMON_WOOD_PARTS_AND_FRAMES: string[] = [
  "Top Frame",
  "Side Frame",
  "Side Frame (Left)",
  "Side Frame (Right)",
  "Bottom Frame",
  "Front Frame",
  "Back Frame",
  "Face Frame",
  "Front Face Frame",
  "Door Frame",
  "Leg Frame",
  "Base Frame",
  "Internal Divider Frame",
  "Center Partition Frame",
  "Drawer Frame",
  "Intermediate Frame",
  "Carcass Frame",
  "Structure Frame",
  "Mirror Frame",
  "Top Panel",
  "Bottom Panel",
  "Left Side Panel",
  "Right Side Panel",
  "Center Partition",
  "Back Panel",
  "Shelf",
  "Internal Shelf",
  "Adjustable Shelf",
  "Shutter / Door",
  "Drawer Front",
  "Drawer Sides",
  "Drawer Back",
  "Drawer Bottom",
  "Apron / Rail",
  "Front Apron",
  "Back Apron",
  "Side Apron",
  "Legs / Posts",
  "Front Legs",
  "Back Legs",
  "Stretcher",
  "Cross Stretcher",
  "Bottom Stretcher",
  "Corner Cleats",
  "Plinth / Skirting",
  "Facia / Beading",
  "Headboard Panel",
  "Footboard Panel",
  "Bed Side Rail",
  "Mattress Support Slats (Patties)",
  "Storage Box Panel",
];

export interface FurniturePartTemplate {
  name: string;
  defaultPcs?: number;
}

export function getAssociatedWoodPartsForProduct(productType: string): FurniturePartTemplate[] {
  if (!productType) return [];
  const normalized = productType.trim().toLowerCase();

  if (normalized.includes("sideboard") || normalized.includes("credenza")) {
    return [
      { name: "Top Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frame (Left)", defaultPcs: 1 },
      { name: "Side Frame (Right)", defaultPcs: 1 },
      { name: "Left Side Panel", defaultPcs: 1 },
      { name: "Right Side Panel", defaultPcs: 1 },
      { name: "Center Partition Frame", defaultPcs: 1 },
      { name: "Back Panel", defaultPcs: 1 },
      { name: "Back Frame", defaultPcs: 1 },
      { name: "Front Face Frame", defaultPcs: 1 },
      { name: "Internal Shelf", defaultPcs: 2 },
      { name: "Shutter / Door Frame", defaultPcs: 2 },
      { name: "Shutter / Door Panel", defaultPcs: 2 },
      { name: "Drawer Front", defaultPcs: 2 },
      { name: "Drawer Sides", defaultPcs: 4 },
      { name: "Drawer Back", defaultPcs: 2 },
      { name: "Drawer Bottom", defaultPcs: 2 },
      { name: "Base Plinth / Leg Frame", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("console")) {
    return [
      { name: "Top Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Side Frame", defaultPcs: 2 },
      { name: "Front Apron / Frame", defaultPcs: 1 },
      { name: "Back Frame / Rail", defaultPcs: 1 },
      { name: "Table Legs / Leg Frame", defaultPcs: 4 },
      { name: "Bottom Stretcher / Bottom Frame", defaultPcs: 1 },
      { name: "Drawer Front", defaultPcs: 2 },
      { name: "Drawer Sides", defaultPcs: 4 },
      { name: "Drawer Back", defaultPcs: 2 },
      { name: "Drawer Bottom", defaultPcs: 2 },
      { name: "Corner Cleats / Brackets", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("coffee")) {
    return [
      { name: "Table Top Panel", defaultPcs: 1 },
      { name: "Top Frame / Sub-frame", defaultPcs: 1 },
      { name: "Side Frame / Aprons", defaultPcs: 4 },
      { name: "Table Legs / Leg Frame", defaultPcs: 4 },
      { name: "Bottom Shelf / Bottom Frame", defaultPcs: 1 },
      { name: "Drawer Front", defaultPcs: 1 },
      { name: "Drawer Box (Sides/Back/Bottom)", defaultPcs: 1 },
      { name: "Corner Cleats", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("dining table")) {
    return [
      { name: "Table Top Main Panel", defaultPcs: 1 },
      { name: "Top Sub-base Frame", defaultPcs: 1 },
      { name: "Side Frame / Long Aprons", defaultPcs: 2 },
      { name: "End Rails / Short Frame", defaultPcs: 2 },
      { name: "Main Dining Legs / Leg Frame", defaultPcs: 4 },
      { name: "Center Support Stretcher", defaultPcs: 1 },
      { name: "Corner Cleats / Heavy Brackets", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("chair")) {
    return [
      { name: "Front Legs", defaultPcs: 2 },
      { name: "Back Legs / Uprights", defaultPcs: 2 },
      { name: "Seat Outer Frame", defaultPcs: 4 },
      { name: "Seat Base Wooden Panel", defaultPcs: 1 },
      { name: "Backrest Slat / Frame", defaultPcs: 1 },
      { name: "Side Frame / Stretchers", defaultPcs: 2 },
      { name: "Front / Back Stretchers", defaultPcs: 2 },
      { name: "Corner Reinforcement Blocks", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("armchair")) {
    return [
      { name: "Front Legs", defaultPcs: 2 },
      { name: "Back Legs", defaultPcs: 2 },
      { name: "Armrest Planks (L & R)", defaultPcs: 2 },
      { name: "Armrest Supporting Frame", defaultPcs: 2 },
      { name: "Seat Perimeter Frame", defaultPcs: 4 },
      { name: "Seat Base Panel", defaultPcs: 1 },
      { name: "Backrest Frame / Support", defaultPcs: 1 },
      { name: "Lower Bottom Stretchers", defaultPcs: 2 },
    ];
  }

  if (normalized.includes("sofa") || normalized.includes("couch")) {
    return [
      { name: "Base Perimeter Frame", defaultPcs: 4 },
      { name: "Front Apron / Skirt Frame", defaultPcs: 1 },
      { name: "Back Support Frame", defaultPcs: 1 },
      { name: "Armrest Frames (L & R)", defaultPcs: 2 },
      { name: "Backrest Framing Structure", defaultPcs: 1 },
      { name: "Seat Support Slats", defaultPcs: 6 },
      { name: "Wooden Legs", defaultPcs: 4 },
      { name: "Internal Corner Blocks", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("bed") && !normalized.includes("bedside")) {
    return [
      { name: "Headboard Main Panel", defaultPcs: 1 },
      { name: "Headboard Frame / Posts", defaultPcs: 2 },
      { name: "Footboard Main Panel", defaultPcs: 1 },
      { name: "Footboard Frame / Posts", defaultPcs: 2 },
      { name: "Bed Side Frame Rails (L & R)", defaultPcs: 2 },
      { name: "Center Longitudinal Support Beam", defaultPcs: 1 },
      { name: "Center Leg Support Frame", defaultPcs: 2 },
      { name: "Mattress Support Slats (Patties)", defaultPcs: 12 },
      { name: "Storage Box Side Panels", defaultPcs: 2 },
      { name: "Storage Box Bottom Panel", defaultPcs: 2 },
    ];
  }

  if (normalized.includes("wardrobe") || normalized.includes("armoire") || normalized.includes("closet")) {
    return [
      { name: "Top Roof Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Base Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frame (Left)", defaultPcs: 1 },
      { name: "Side Frame (Right)", defaultPcs: 1 },
      { name: "Left Outer Side Panel", defaultPcs: 1 },
      { name: "Right Outer Side Panel", defaultPcs: 1 },
      { name: "Center Vertical Partition Frame", defaultPcs: 1 },
      { name: "Back Panel", defaultPcs: 1 },
      { name: "Back Frame", defaultPcs: 1 },
      { name: "Fixed Shelves", defaultPcs: 2 },
      { name: "Adjustable Shelves", defaultPcs: 4 },
      { name: "Door Frame / Shutter Frame", defaultPcs: 2 },
      { name: "Door Panels / Shutters", defaultPcs: 2 },
      { name: "Internal Drawer Fronts", defaultPcs: 2 },
      { name: "Internal Drawer Sides", defaultPcs: 4 },
      { name: "Internal Drawer Backs", defaultPcs: 2 },
      { name: "Internal Drawer Bottoms", defaultPcs: 2 },
      { name: "Base Plinth / Skirting Frame", defaultPcs: 1 },
    ];
  }

  if (normalized.includes("bedside") || normalized.includes("nightstand")) {
    return [
      { name: "Top Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frame (L & R)", defaultPcs: 2 },
      { name: "Left Side Panel", defaultPcs: 1 },
      { name: "Right Side Panel", defaultPcs: 1 },
      { name: "Back Panel", defaultPcs: 1 },
      { name: "Open Shelf", defaultPcs: 1 },
      { name: "Drawer Front", defaultPcs: 1 },
      { name: "Drawer Sides", defaultPcs: 2 },
      { name: "Drawer Back", defaultPcs: 1 },
      { name: "Drawer Bottom", defaultPcs: 1 },
      { name: "Leg Base Frame / Legs", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("tv") || normalized.includes("media")) {
    return [
      { name: "Top Main Surface Deck", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Base Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frame (L & R)", defaultPcs: 2 },
      { name: "Left End Panel", defaultPcs: 1 },
      { name: "Right End Panel", defaultPcs: 1 },
      { name: "Center Partition Frame", defaultPcs: 2 },
      { name: "Back Panel with Cable Ports", defaultPcs: 1 },
      { name: "Open Audio Shelf", defaultPcs: 1 },
      { name: "Door Frame & Shutters", defaultPcs: 2 },
      { name: "Drawer Front", defaultPcs: 2 },
      { name: "Drawer Sides", defaultPcs: 4 },
      { name: "Drawer Back", defaultPcs: 2 },
      { name: "Drawer Bottom", defaultPcs: 2 },
      { name: "Base Leg Frame", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("bar cabinet") || normalized.includes("bar unit")) {
    return [
      { name: "Top Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frames (L & R)", defaultPcs: 2 },
      { name: "Side Panels (L & R)", defaultPcs: 2 },
      { name: "Back Panel & Frame", defaultPcs: 1 },
      { name: "Center Divider Frame", defaultPcs: 1 },
      { name: "Door Frame & Shutters", defaultPcs: 2 },
      { name: "Wine Glass Hanging Stem Panel", defaultPcs: 1 },
      { name: "Bottle Rack Grid Frame", defaultPcs: 1 },
      { name: "Drop-front Prep Flap", defaultPcs: 1 },
      { name: "Internal Shelves", defaultPcs: 2 },
      { name: "Drawer Front & Box", defaultPcs: 1 },
      { name: "Base Leg Frame", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("stool")) {
    return [
      { name: "Solid Seat Top", defaultPcs: 1 },
      { name: "Front Legs", defaultPcs: 2 },
      { name: "Back Legs", defaultPcs: 2 },
      { name: "Lower Footrest Frame (4 Sides)", defaultPcs: 4 },
      { name: "Upper Seat Apron Frame", defaultPcs: 4 },
      { name: "Backrest Frame (if equipped)", defaultPcs: 1 },
    ];
  }

  if (normalized.includes("desk") || normalized.includes("study") || normalized.includes("office table")) {
    return [
      { name: "Main Desktop Plank", defaultPcs: 1 },
      { name: "Top Frame Support", defaultPcs: 1 },
      { name: "Side Frame (Left & Right)", defaultPcs: 2 },
      { name: "Left Pedestal Panel", defaultPcs: 1 },
      { name: "Right Pedestal Panel", defaultPcs: 1 },
      { name: "Modesty Panel (Back Knee Board)", defaultPcs: 1 },
      { name: "Footrest Stretcher Bar", defaultPcs: 1 },
      { name: "Drawer Fronts", defaultPcs: 3 },
      { name: "Drawer Boxes (Sides/Back/Bottom)", defaultPcs: 3 },
      { name: "Pedestal Door & Frame", defaultPcs: 1 },
      { name: "Keyboard Tray Panel", defaultPcs: 1 },
    ];
  }

  if (normalized.includes("bookshelf") || normalized.includes("bookcase") || normalized.includes("display")) {
    return [
      { name: "Top Roof Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Base Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Upright Frames (L & R)", defaultPcs: 2 },
      { name: "Left Upright Side Panel", defaultPcs: 1 },
      { name: "Right Upright Side Panel", defaultPcs: 1 },
      { name: "Center Vertical Partition", defaultPcs: 1 },
      { name: "Fixed Middle Shelf", defaultPcs: 1 },
      { name: "Adjustable Book Shelves", defaultPcs: 4 },
      { name: "Back Panel & Frame", defaultPcs: 1 },
      { name: "Bottom Plinth Frame", defaultPcs: 1 },
      { name: "Crown Molding / Top Facia", defaultPcs: 1 },
    ];
  }

  if (normalized.includes("chest") || normalized.includes("drawer")) {
    return [
      { name: "Top Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frame (Left & Right)", defaultPcs: 2 },
      { name: "Left Side Panel", defaultPcs: 1 },
      { name: "Right Side Panel", defaultPcs: 1 },
      { name: "Back Panel & Frame", defaultPcs: 1 },
      { name: "Front Divider Rails", defaultPcs: 4 },
      { name: "Drawer Runners / Cleats", defaultPcs: 8 },
      { name: "Small Top Drawer Fronts", defaultPcs: 2 },
      { name: "Large Lower Drawer Fronts", defaultPcs: 3 },
      { name: "Drawer Sides", defaultPcs: 10 },
      { name: "Drawer Backs", defaultPcs: 5 },
      { name: "Drawer Bottoms", defaultPcs: 5 },
      { name: "Base Leg Frame", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("dress") || normalized.includes("vanity")) {
    return [
      { name: "Main Vanity Table Top", defaultPcs: 1 },
      { name: "Top Frame Structure", defaultPcs: 1 },
      { name: "Mirror Frame Vertical Posts", defaultPcs: 2 },
      { name: "Mirror Frame Horizontal Rails", defaultPcs: 2 },
      { name: "Mirror Backing Board", defaultPcs: 1 },
      { name: "Pedestal Side Frames & Panels", defaultPcs: 4 },
      { name: "Center Knee-hole Back Panel", defaultPcs: 1 },
      { name: "Jewelry Drawer Fronts", defaultPcs: 2 },
      { name: "Deep Storage Drawer Fronts", defaultPcs: 2 },
      { name: "Drawer Boxes (Sides/Back/Bottom)", defaultPcs: 4 },
      { name: "Base Leg Frame", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("bench")) {
    return [
      { name: "Solid Seat Plank / Slats", defaultPcs: 1 },
      { name: "Top Seat Frame", defaultPcs: 1 },
      { name: "Long Side Rails", defaultPcs: 2 },
      { name: "Short End Rails", defaultPcs: 2 },
      { name: "Leg Posts / Leg Frame", defaultPcs: 4 },
      { name: "Bottom Longitudinal Stretcher", defaultPcs: 1 },
      { name: "Cross Stretchers", defaultPcs: 2 },
      { name: "Corner Cleats", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("ottoman") || normalized.includes("pouf")) {
    return [
      { name: "Top Seat Base Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Side Apron Boards (4 Sides)", defaultPcs: 4 },
      { name: "Bottom Supporting Rails", defaultPcs: 2 },
      { name: "Internal Reinforcement Blocks", defaultPcs: 4 },
      { name: "Turned Wooden Feet", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("shoe")) {
    return [
      { name: "Top Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Base Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frame (L & R)", defaultPcs: 2 },
      { name: "Left Side Panel", defaultPcs: 1 },
      { name: "Right Side Panel", defaultPcs: 1 },
      { name: "Slanted Shoe Shelves", defaultPcs: 4 },
      { name: "Front Louvered Door Frames & Panels", defaultPcs: 2 },
      { name: "Ventilated Back Panel", defaultPcs: 1 },
      { name: "Base Plinth / Leg Frame", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("mirror")) {
    return [
      { name: "Top Frame Rail", defaultPcs: 1 },
      { name: "Bottom Frame Rail", defaultPcs: 1 },
      { name: "Side Frame (Left Stile)", defaultPcs: 1 },
      { name: "Side Frame (Right Stile)", defaultPcs: 1 },
      { name: "Rear Backing Board", defaultPcs: 1 },
      { name: "Corner Joint Splines / Cleats", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("cabinet")) {
    return [
      { name: "Top Panel", defaultPcs: 1 },
      { name: "Top Frame", defaultPcs: 1 },
      { name: "Bottom Panel", defaultPcs: 1 },
      { name: "Bottom Frame", defaultPcs: 1 },
      { name: "Side Frames (L & R)", defaultPcs: 2 },
      { name: "Left Side Panel", defaultPcs: 1 },
      { name: "Right Side Panel", defaultPcs: 1 },
      { name: "Center Divider Frame", defaultPcs: 1 },
      { name: "Back Panel & Frame", defaultPcs: 1 },
      { name: "Adjustable Shelves", defaultPcs: 2 },
      { name: "Door Frame & Shutters", defaultPcs: 2 },
      { name: "Base Stand / Leg Frame", defaultPcs: 4 },
    ];
  }

  if (normalized.includes("side table") || normalized.includes("end table")) {
    return [
      { name: "Table Top Panel", defaultPcs: 1 },
      { name: "Top Frame / Sub-top", defaultPcs: 1 },
      { name: "Side Frame / Aprons", defaultPcs: 4 },
      { name: "Leg Posts / Leg Frame", defaultPcs: 4 },
      { name: "Lower Shelf / Tier", defaultPcs: 1 },
      { name: "Drawer Front", defaultPcs: 1 },
      { name: "Drawer Sides, Back & Bottom", defaultPcs: 1 },
    ];
  }

  // General fallback for any custom / other furniture type
  return [
    { name: "Top Panel", defaultPcs: 1 },
    { name: "Top Frame", defaultPcs: 1 },
    { name: "Side Frame (Left & Right)", defaultPcs: 2 },
    { name: "Left Side Panel", defaultPcs: 1 },
    { name: "Right Side Panel", defaultPcs: 1 },
    { name: "Bottom Panel", defaultPcs: 1 },
    { name: "Bottom Frame", defaultPcs: 1 },
    { name: "Back Panel & Frame", defaultPcs: 1 },
    { name: "Internal Shelves / Partitions", defaultPcs: 2 },
    { name: "Door Frame & Shutters", defaultPcs: 2 },
    { name: "Base Frame / Legs", defaultPcs: 4 },
  ];
}

export interface CostRateMaster {
  id?: string;
  item_name: string;
  category: string;
  unit_of_measure: string;
  rate: number;
  effective_date?: string;
  created_at?: string;
}

export const costingApi = {
  uploadImage: async (file: Blob): Promise<string> => {
    if (file.size > 10 * 1024 * 1024) throw new Error("Product image must be 10 MB or smaller.");
    const data = new FormData();
    data.append("file", file, "product-image");
    const res = await axiosInstance.post("/costing/images", data);
    return res.data.data.url;
  },
  getSummary: async () => {
    const res = await axiosInstance.get("/costing/summary");
    return res.data.data;
  },

  getAllEstimations: async (search?: string, status?: string) => {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const res = await axiosInstance.get("/costing/estimations", { params });
    return res.data.data as CostEstimation[];
  },

  getApprovalAuthorities: async (): Promise<Array<{id: string; fullName: string; designationTitle: string}>> => {
    return (await axiosInstance.get("/costing/approval-authorities")).data.data;
  },

  getEstimationById: async (id: string) => {
    const res = await axiosInstance.get(`/costing/estimations/${id}`);
    return res.data.data as CostEstimation;
  },

  createEstimation: async (data: Partial<CostEstimation>) => {
    const res = await axiosInstance.post("/costing/estimations", data);
    return res.data.data as CostEstimation;
  },

  updateEstimation: async (id: string, data: Partial<CostEstimation>) => {
    const res = await axiosInstance.put(`/costing/estimations/${id}`, data);
    return res.data.data as CostEstimation;
  },

  deleteEstimation: async (id: string) => {
    const res = await axiosInstance.delete(`/costing/estimations/${id}`);
    return res.data.data;
  },

  getAllRates: async () => {
    const res = await axiosInstance.get("/costing/rates");
    return res.data.data as CostRateMaster[];
  },

  saveRate: async (data: Partial<CostRateMaster>) => {
    const res = await axiosInstance.post("/costing/rates", data);
    return res.data.data as CostRateMaster;
  },

  deleteRate: async (id: string) => {
    const res = await axiosInstance.delete(`/costing/rates/${id}`);
    return res.data.data;
  },

  calculateCft: async (payload: {
    length: number;
    width: number;
    thickness: number;
    pcs: number;
    rate?: number;
  }): Promise<{ cft: number; cftRounded: number; amount: number }> => {
    const res = await axiosInstance.post("/costing/calculate-cft", payload);
    return res.data.data;
  },

  // Costing Request Bunches & Items
  createRequestBunch: async (data: {
    merchant_name: string;
    client_name?: string;
    notes?: string;
    priority?: 'Normal' | 'High' | 'Urgent';
    items: Array<{
      product_name: string;
      product_code?: string;
      buyer_code?: string;
      costing_code?: string;
      product_type?: string;
      collection_name?: string;
      sample_availability?: 'Not Available' | 'Sample Available';
      wood_type?: string;
      overall_size?: string;
      client_name?: string;
      target_price?: number | null;
      target_currency?: string | null;
      description?: string;
      image_url?: string;
      image_urls?: string[];
      priority?: 'Normal' | 'High' | 'Urgent';
    }>;
  }): Promise<CostingRequestBunch> => {
    const res = await axiosInstance.post("/costing/requests/bunch", data);
    return res.data.data as CostingRequestBunch;
  },

  getBunches: async (params?: { search?: string; status?: string; merchant?: string }): Promise<CostingRequestBunch[]> => {
    const res = await axiosInstance.get("/costing/requests/bunches", { params });
    return res.data.data as CostingRequestBunch[];
  },

  getBunchById: async (id: string): Promise<CostingRequestBunch> => {
    const res = await axiosInstance.get(`/costing/requests/bunches/${id}`);
    return res.data.data as CostingRequestBunch;
  },

  getRequestItems: async (params?: { search?: string; stage?: string; priority?: string; bunchCode?: string }): Promise<CostingRequestItem[]> => {
    const res = await axiosInstance.get("/costing/requests/items", { params });
    return res.data.data as CostingRequestItem[];
  },

  getRequestItemById: async (id: string): Promise<CostingRequestItem> => {
    const res = await axiosInstance.get(`/costing/requests/items/${id}`);
    return res.data.data as CostingRequestItem;
  },

  updateRequestItemDetails: async (
    id: string,
    data: {
      product_name?: string;
      costing_code?: string;
      buyer_code?: string;
      product_type?: string;
      collection_name?: string;
      sample_availability?: string;
      wood_type?: string;
      overall_size?: string;
      client_name?: string;
      target_price?: number | null;
      target_currency?: string | null;
      description?: string;
      priority?: 'Normal' | 'High' | 'Urgent';
    }
  ): Promise<CostingRequestItem> => {
    const res = await axiosInstance.patch(`/costing/requests/items/${id}`, data);
    return res.data.data as CostingRequestItem;
  },

  updateRequestItemStage: async (id: string, data: { stage: string; estimationId?: string; estimationNumber?: string; finalPrice?: number; finalPriceUsd?: number }): Promise<any> => {
    const res = await axiosInstance.patch(`/costing/requests/items/${id}/stage`, data);
    return res.data.data;
  },

  getTracker: async (params?: { search?: string; stage?: string; merchant?: string; dateFrom?: string; dateTo?: string }): Promise<CostingTrackerResponse> => {
    const res = await axiosInstance.get("/costing/tracker", { params });
    return res.data.data as CostingTrackerResponse;
  },

  getDashboardMetrics: async (): Promise<{
    metrics: {
      total_requests: number;
      not_started_count: number;
      in_progress_count: number;
      in_review_count: number;
      approved_count: number;
      rejected_count: number;
      total_bunches: number;
    };
    recent_activity: any[];
    merchant_breakdown: any[];
  }> => {
    const res = await axiosInstance.get("/costing/dashboard-metrics");
    return res.data.data;
  },

  getNextCodes: async (count: number = 1): Promise<{ bunchCode: string; productCodes: string[]; nextCostingCode: number; costingCodes: string[] }> => {
    const res = await axiosInstance.get("/costing/requests/next-codes", { params: { count } });
    return res.data.data;
  },

  uploadImageFile: async (file: File): Promise<string> => {
    return costingApi.uploadImage(file);
  },
};

export interface CostingRequestItem {
  id: string;
  bunch_id: string;
  bunch_code: string;
  product_code: string;
  buyer_code?: string;
  costing_code?: string;
  product_name: string;
  product_type?: string;
  collection_name?: string;
  sample_availability?: 'Not Available' | 'Sample Available';
  wood_type?: string;
  overall_size?: string;
  client_name?: string;
  target_price?: number | null;
  target_currency?: string | null;
  description?: string;
  image_url?: string;
  image_urls?: string[] | string;
  priority: 'Normal' | 'High' | 'Urgent';
  stage: 'Pending' | 'In Progress' | 'In Review' | 'Approved' | 'Rejected';
  approved_at?: string | null;
  estimation_id?: string;
  estimation_number?: string;
  final_price?: number;
  final_price_usd?: number;
  latest_buyer_quote?: {
    label: string;
    currency: string;
    amount: number;
    note?: string;
    usd_rate?: number;
  } | null;
  merchant_name: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const parseItemImageUrls = (item: Pick<CostingRequestItem, "image_url" | "image_urls">): string[] => {
  const list: string[] = [];
  if (Array.isArray(item.image_urls)) {
    item.image_urls.forEach((u) => {
      if (typeof u === "string" && u.trim()) list.push(u.trim());
    });
  } else if (typeof item.image_urls === "string" && item.image_urls.trim()) {
    try {
      const parsed = JSON.parse(item.image_urls);
      if (Array.isArray(parsed)) {
        parsed.forEach((u) => {
          if (typeof u === "string" && u.trim()) list.push(u.trim());
        });
      }
    } catch {
      // ignore invalid json
    }
  }
  if (list.length === 0 && item.image_url && item.image_url.trim()) {
    list.push(item.image_url.trim());
  }
  return list;
};

// UI visibility only; the API independently checks active approval-authority IDs.
export const isDirectorApprover = (user: any): boolean => {
  const name = (user?.fullName || "").trim().toLowerCase();
  return name === "ravi utmani" || name === "raj utmani";
};

export interface CostingRequestBunch {
  id: string;
  bunch_code: string;
  merchant_id?: string;
  merchant_name: string;
  client_name?: string;
  notes?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  total_products: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
  items?: CostingRequestItem[];
}

export interface CostingTrackerResponse {
  kpis: {
    total_requests: number;
    not_started_count: number;
    under_process_count: number;
    approved_count: number;
    rejected_count: number;
  };
  items: CostingRequestItem[];
}
