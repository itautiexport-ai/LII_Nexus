import { axiosInstance } from "../../services/api/axiosInstance";

export interface TableFreezeSettings {
  id?: string;
  tableKey: string;
  userId?: string | null;
  freezeColumns: number;
  freezeColumnKey?: string | null;
  freezeRows: number;
  freezeHeader: boolean;
  tableMaxHeight: string;
  isUniversal?: boolean;
  hasCustomSetting?: boolean;
}

const LOCAL_STORAGE_PREFIX = "lii_table_freeze_";

export const tableFreezeApi = {
  async getSettings(tableKey: string): Promise<TableFreezeSettings> {
    try {
      const response = await axiosInstance.get(`/table-freeze-settings/${tableKey}`);
      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        // Cache in localStorage for resilience & instant layout hydration
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${tableKey}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(`[tableFreezeApi] Failed to fetch settings from backend for ${tableKey}, using local fallback:`, err);
    }

    // LocalStorage fallback
    const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${tableKey}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore parse error
      }
    }

    // Default settings
    return {
      tableKey,
      userId: null,
      freezeColumns: 0,
      freezeColumnKey: null,
      freezeRows: 0,
      freezeHeader: true,
      tableMaxHeight: "72vh",
      isUniversal: true,
      hasCustomSetting: false,
    };
  },

  async saveSettings(
    tableKey: string,
    payload: {
      freezeColumns: number;
      freezeColumnKey?: string | null;
      freezeRows: number;
      freezeHeader: boolean;
      tableMaxHeight: string;
      isUniversal: boolean;
    }
  ): Promise<TableFreezeSettings> {
    // Update local cache immediately
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${tableKey}`, JSON.stringify({ tableKey, ...payload }));

    try {
      const response = await axiosInstance.post(`/table-freeze-settings/${tableKey}`, payload);
      if (response.data?.success && response.data.data) {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${tableKey}`, JSON.stringify(response.data.data));
        return response.data.data;
      }
    } catch (err) {
      console.error(`[tableFreezeApi] Error saving freeze settings for ${tableKey}:`, err);
      throw err;
    }

    return {
      tableKey,
      ...payload,
    };
  },

  async resetSettings(tableKey: string, resetUniversal: boolean = false): Promise<void> {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${tableKey}`);
    try {
      await axiosInstance.delete(`/table-freeze-settings/${tableKey}?universal=${resetUniversal ? "true" : "false"}`);
    } catch (err) {
      console.warn(`[tableFreezeApi] Error resetting freeze settings for ${tableKey}:`, err);
    }
  },
};
