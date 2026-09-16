import { useState, useEffect, useCallback, useMemo, CSSProperties } from "react";
import { tableFreezeApi, TableFreezeSettings } from "../api/tableFreezeApi";

export interface ColumnDefinition {
  key: string;
  label: string;
  width?: number;
}

export interface UseTableFreezeOptions {
  tableKey: string;
  availableColumns?: ColumnDefinition[];
  columnWidths?: number[];
  defaultSettings?: Partial<TableFreezeSettings>;
}

export function useTableFreeze({
  tableKey,
  availableColumns = [],
  columnWidths = [],
  defaultSettings,
}: UseTableFreezeOptions) {
  const [settings, setSettings] = useState<TableFreezeSettings>({
    tableKey,
    freezeColumns: defaultSettings?.freezeColumns ?? 0,
    freezeColumnKey: defaultSettings?.freezeColumnKey ?? null,
    freezeRows: defaultSettings?.freezeRows ?? 0,
    freezeHeader: defaultSettings?.freezeHeader ?? true,
    tableMaxHeight: defaultSettings?.tableMaxHeight ?? "72vh",
    isUniversal: true,
    hasCustomSetting: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch settings from API
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await tableFreezeApi.getSettings(tableKey);
      setSettings(data);
    } catch (err) {
      console.warn(`[useTableFreeze] Failed to load settings for ${tableKey}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [tableKey]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Determine effective freeze columns count
  const effectiveFreezeCount = useMemo(() => {
    if (settings.freezeColumnKey && availableColumns.length > 0) {
      const idx = availableColumns.findIndex((c) => c.key === settings.freezeColumnKey);
      if (idx !== -1) {
        return idx + 1;
      }
    }
    return Math.max(0, settings.freezeColumns || 0);
  }, [settings.freezeColumns, settings.freezeColumnKey, availableColumns]);

  // Calculate cumulative left offsets for frozen columns
  const columnOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < Math.max(availableColumns.length, columnWidths.length, 30); i++) {
      offsets.push(cumulative);
      let colW = 120; // default fallback column width in px
      if (columnWidths[i] !== undefined) {
        colW = columnWidths[i];
      } else if (availableColumns[i]?.width !== undefined) {
        colW = availableColumns[i].width!;
      }
      cumulative += colW;
    }
    return offsets;
  }, [availableColumns, columnWidths]);

  const isColumnFrozen = useCallback(
    (colIndex: number) => {
      return colIndex < effectiveFreezeCount;
    },
    [effectiveFreezeCount]
  );

  const isLastFrozenColumn = useCallback(
    (colIndex: number) => {
      return effectiveFreezeCount > 0 && colIndex === effectiveFreezeCount - 1;
    },
    [effectiveFreezeCount]
  );

  // Sticky Container style
  const getContainerStyle = useCallback(
    (customStyle?: CSSProperties): CSSProperties => {
      return {
        overflow: "auto",
        overflowX: "auto",
        overflowY: "auto",
        position: "relative",
        maxHeight: settings.tableMaxHeight === "none" ? undefined : settings.tableMaxHeight,
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        background: "#ffffff",
        ...customStyle,
      };
    },
    [settings.tableMaxHeight]
  );

  // Sticky Header Style (th)
  const getStickyHeaderStyle = useCallback(
    (
      colIndex?: number,
      options?: {
        topOffset?: number | string;
        customStyle?: CSSProperties;
        bg?: string;
        zIndex?: number;
      }
    ): CSSProperties => {
      const isFrozen = colIndex !== undefined && colIndex < effectiveFreezeCount;
      const isLast = colIndex !== undefined && isLastFrozenColumn(colIndex);
      const top = settings.freezeHeader ? (options?.topOffset ?? 0) : undefined;
      const left = isFrozen ? (columnOffsets[colIndex] ?? 0) : undefined;
      const position = (settings.freezeHeader || isFrozen) ? "sticky" : undefined;

      const zIndex = options?.zIndex ?? (
        isFrozen && settings.freezeHeader ? 40 : (settings.freezeHeader ? 30 : (isFrozen ? 20 : 1))
      );

      // Width enforcement: ensure header cell matches the exact calculated offset width
      let widthStyle: CSSProperties = {};
      if (colIndex !== undefined) {
        const colW = columnWidths[colIndex] ?? availableColumns[colIndex]?.width;
        if (colW !== undefined) {
          widthStyle = {
            width: `${colW}px`,
            minWidth: `${colW}px`,
            maxWidth: `${colW}px`,
            boxSizing: "border-box",
          };
        }
      }

      // Ensure background is always 100% opaque so scrolling text does not bleed through
      const backgroundColor =
        options?.bg ??
        options?.customStyle?.backgroundColor ??
        (options?.customStyle?.background && !options?.customStyle?.background.toString().includes("transparent")
          ? options.customStyle.background.toString()
          : "#f8fafc");

      // Border and shadow: ensure the boundary divider of the last frozen column is never wiped out
      const borderRight = isLast
        ? "2px solid #94a3b8"
        : (options?.customStyle?.borderRight ?? "1px solid #e2e8f0");
      const boxShadow = isLast
        ? "4px 0 8px -2px rgba(0, 0, 0, 0.16)"
        : options?.customStyle?.boxShadow;

      return {
        boxSizing: "border-box",
        ...widthStyle,
        ...options?.customStyle,
        position,
        top,
        left,
        zIndex,
        backgroundColor,
        borderRight,
        boxShadow,
      };
    },
    [settings.freezeHeader, effectiveFreezeCount, isLastFrozenColumn, columnOffsets, columnWidths, availableColumns]
  );

  // Sticky Data Cell Style (td)
  const getStickyCellStyle = useCallback(
    (
      colIndex: number,
      options?: {
        customStyle?: CSSProperties;
        bg?: string;
        rowIndex?: number;
        topOffset?: number | string;
      }
    ): CSSProperties => {
      const isFrozen = colIndex < effectiveFreezeCount;
      const isLast = isLastFrozenColumn(colIndex);
      const isRowFrozen = settings.freezeRows > 0 && options?.rowIndex !== undefined && options.rowIndex < settings.freezeRows;

      const left = isFrozen ? (columnOffsets[colIndex] ?? 0) : undefined;
      const top = isRowFrozen ? (options?.topOffset ?? 0) : undefined;
      const position = (isFrozen || isRowFrozen) ? "sticky" : undefined;

      const zIndex = (isFrozen && isRowFrozen) ? 25 : (isFrozen ? 20 : (isRowFrozen ? 15 : 1));

      // Width enforcement: ensure data cell matches the exact calculated offset width
      let widthStyle: CSSProperties = {};
      const colW = columnWidths[colIndex] ?? availableColumns[colIndex]?.width;
      if (colW !== undefined) {
        widthStyle = {
          width: `${colW}px`,
          minWidth: `${colW}px`,
          maxWidth: `${colW}px`,
          boxSizing: "border-box",
        };
      }

      // Ensure solid opaque background so scrolled content underneath is hidden
      const backgroundColor =
        options?.bg ??
        options?.customStyle?.backgroundColor ??
        (options?.customStyle?.background && !options?.customStyle?.background.toString().includes("transparent")
          ? options.customStyle.background.toString()
          : "#ffffff");

      // Border and shadow: ensure last frozen column boundary is prominent
      const borderRight = isLast
        ? "2px solid #94a3b8"
        : (options?.customStyle?.borderRight ?? "1px solid #f1f5f9");
      const boxShadow = isLast
        ? "4px 0 8px -2px rgba(0, 0, 0, 0.16)"
        : options?.customStyle?.boxShadow;

      return {
        boxSizing: "border-box",
        ...widthStyle,
        ...options?.customStyle,
        position,
        left,
        top,
        zIndex,
        backgroundColor,
        borderRight,
        boxShadow,
      };
    },
    [effectiveFreezeCount, isLastFrozenColumn, columnOffsets, columnWidths, availableColumns, settings.freezeRows]
  );

  // Save changes
  const save = useCallback(
    async (newSettings: {
      freezeColumns: number;
      freezeColumnKey?: string | null;
      freezeRows: number;
      freezeHeader: boolean;
      tableMaxHeight: string;
      isUniversal: boolean;
    }) => {
      setIsSaving(true);
      try {
        const saved = await tableFreezeApi.saveSettings(tableKey, newSettings);
        setSettings(saved);
        setIsModalOpen(false);
      } catch (err) {
        console.error(`[useTableFreeze] Failed to save settings:`, err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [tableKey]
  );

  // Reset settings
  const reset = useCallback(
    async (resetUniversal: boolean = false) => {
      setIsSaving(true);
      try {
        await tableFreezeApi.resetSettings(tableKey, resetUniversal);
        setSettings({
          tableKey,
          freezeColumns: 0,
          freezeColumnKey: null,
          freezeRows: 0,
          freezeHeader: true,
          tableMaxHeight: "72vh",
          isUniversal: true,
          hasCustomSetting: false,
        });
        setIsModalOpen(false);
      } catch (err) {
        console.error(`[useTableFreeze] Failed to reset settings:`, err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [tableKey]
  );

  return {
    settings,
    isLoading,
    isSaving,
    isModalOpen,
    effectiveFreezeCount,
    availableColumns,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    saveSettings: save,
    resetSettings: reset,
    getContainerStyle,
    getStickyHeaderStyle,
    getStickyCellStyle,
    isColumnFrozen,
    isLastFrozenColumn,
  };
}
