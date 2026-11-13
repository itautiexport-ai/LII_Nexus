import { axiosInstance } from '../../../../services/api/axiosInstance';
import type { MetalPrice } from '../pages/MetalPricesPage';
export const metalPricesApi = {
  async list(): Promise<MetalPrice[]> { return (await axiosInstance.get('/metal-prices')).data.data; },
  async save(value: Omit<MetalPrice, 'id' | 'createdAt'>, id?: string): Promise<MetalPrice> {
    return (id ? await axiosInstance.put(`/metal-prices/${encodeURIComponent(id)}`, value)
      : await axiosInstance.post('/metal-prices', value)).data.data;
  },
  async remove(id: string) { await axiosInstance.delete(`/metal-prices/${encodeURIComponent(id)}`); },
  async importBrowser(records: MetalPrice[]): Promise<{inserted: number; skipped: number}> {
    return (await axiosInstance.post('/metal-prices/import-browser', { records })).data.data;
  },
};
export function metalPriceError(e: any) { return e?.response?.data?.error?.message || e?.message || 'Could not save metal prices. Please retry.'; }
