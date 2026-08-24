export interface MaterialInwardRecord {
  id: string;
  inwardNo: string;
  inwardDate: Date;
  supplierName: string;
  poNumber: string | null;
  invoiceChallanNo: string;
  invoiceChallanDate: Date | null;
  vehicleNumber: string | null;
  driverName: string | null;
  driverContact: string | null;
  materialName: string;
  quantityReceived: number;
  uom: string;
  receivedBy: string | null;
  remarks: string | null;
  photoUrl: string | null;
  status: "Pending" | "Inspected" | "Approved" | "Rejected";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
