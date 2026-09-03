import { axiosInstance } from "../../../services/api/axiosInstance";

export interface MaterialInwardRecord {
  id: string;
  inwardNo: string;
  inwardDate: string;
  supplierName: string;
  poNumber: string | null;
  invoiceChallanNo: string | null;
  invoiceChallanDate: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export const materialInwardApi = {
  async list(): Promise<MaterialInwardRecord[]> {
    const res = await axiosInstance.get("/material-inwards");
    return res.data.data;
  },

  async getById(id: string): Promise<MaterialInwardRecord> {
    const res = await axiosInstance.get(`/material-inwards/${id}`);
    return res.data.data;
  },

  async create(data: Partial<MaterialInwardRecord>): Promise<MaterialInwardRecord> {
    const res = await axiosInstance.post("/material-inwards", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<MaterialInwardRecord>): Promise<MaterialInwardRecord> {
    const res = await axiosInstance.put(`/material-inwards/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/material-inwards/${id}`);
  },

  async uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await axiosInstance.post("/material-inwards/upload-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data.fileUrl;
  },
};
