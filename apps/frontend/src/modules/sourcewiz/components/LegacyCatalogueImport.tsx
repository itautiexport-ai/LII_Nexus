import React, { useEffect, useState } from "react";
import { catalogueError, catalogueProductsApi } from "../api/catalogueProductsApi";

const LEGACY_KEYS = ["lii_product_catalogue_items", "lii_product_catalog_items"];
type LegacyEntry = { key: string; legacyId: string; product: any };

// Read both stores independently. Never filter mock IDs, clear, or rewrite them.
export function readLegacyCatalogue(backupStorage?: Record<string, string | null>) {
  const raw: Record<string, string | null> = {};
  const entries: LegacyEntry[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const key of LEGACY_KEYS) {
    raw[key] = backupStorage ? backupStorage[key] ?? null : localStorage.getItem(key);
    if (!raw[key]) continue;
    try {
      const values = JSON.parse(raw[key]!);
      if (!Array.isArray(values)) throw new Error("Expected a product array");
      values.forEach((product, index) => {
        const signature = JSON.stringify(product);
        if (seen.has(signature)) return;
        seen.add(signature);
        entries.push({ key, legacyId: `${key}:${index}:${String(product?.id || "no-id")}`, product });
      });
    } catch { errors.push(`Cannot read ${key}. Download the backup before recovery.`); }
  }
  return { raw, entries, errors };
}

export default function LegacyCatalogueImport({ onImported }: { onImported: () => Promise<void> }) {
  const [snapshot, setSnapshot] = useState(() => readLegacyCatalogue());
  const [busy, setBusy] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<string[]>(snapshot.errors);
  const [acknowledged, setAcknowledged] = useState(false);

  const loadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Backup file is too large (maximum 20 MB).");
      const backup = JSON.parse(await file.text());
      if (backup.format !== "lii-catalogue-browser-backup-v1" || !backup.rawStorage ||
          LEGACY_KEYS.some((key) => backup.rawStorage[key] != null && typeof backup.rawStorage[key] !== "string")) {
        throw new Error("Choose a LII catalogue browser backup JSON file.");
      }
      const restored = readLegacyCatalogue(backup.rawStorage);
      setSnapshot(restored);
      setIssues(restored.errors);
      setBackedUp(true);
      setAcknowledged(false);
      setMessage("Backup loaded for review. Confirm sharing before importing; original browser storage is unchanged.");
    } catch (error) { setIssues([catalogueError(error)]); }
  };

  useEffect(() => {
    const confirmLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    if (busy) window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [busy]);

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ format: "lii-catalogue-browser-backup-v1", origin: location.origin,
      savedAt: new Date().toISOString(), rawStorage: snapshot.raw }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lii-catalogue-browser-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackedUp(true);
  };

  const importProducts = async () => {
    if (!backedUp || !acknowledged || busy) return;
    setBusy(true);
    const failures: string[] = [...snapshot.errors];
    let imported = 0;
    const uploaded = new Map<string, string>();
    try {
      for (let index = 0; index < snapshot.entries.length; index++) {
        const { legacyId, product: original } = snapshot.entries[index];
        setMessage(`Importing ${index + 1} of ${snapshot.entries.length}…`);
        try {
          if (!original || typeof original !== "object") throw new Error("Invalid legacy product");
          const missing: string[] = [];
          const persistImage = async (url: string): Promise<string> => {
            if (!url) return "";
            if (!url.startsWith("blob:") && !url.startsWith("data:")) return url;
            if (uploaded.has(url)) return uploaded.get(url)!;
            let image: Blob;
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error("Image unavailable");
              image = await response.blob();
            } catch {
              missing.push(url);
              return "";
            }
            // A server upload error should leave this product retryable,
            // rather than import it permanently without an available image.
            const permanent = await catalogueProductsApi.upload(image);
            uploaded.set(url, permanent);
            return permanent;
          };
          const images = [];
          for (const img of original.images || []) {
            const url = await persistImage(img.url || img.previewUrl || "");
            images.push({ ...img, id: String(img.id || images.length), label: String(img.label || "Product image"), url, previewUrl: url });
          }
          const cover = await persistImage(original.image || "");
          const result = await catalogueProductsApi.importLegacy(legacyId, {
            ...original, image: cover || images.find((img) => img.url)?.url || "", images,
            legacyImageReferences: [...new Set(missing)],
          });
          imported++;
          if (!result.alreadyImported && missing.length) failures.push(`${original.name}: imported details; ${new Set(missing).size} old image(s) unavailable. Re-upload original files.`);
        } catch (error) { failures.push(`${original?.name || legacyId}: ${catalogueError(error)}`); }
      }
      await onImported();
      setMessage(`${imported}/${snapshot.entries.length} products saved or already imported. Browser originals remain untouched.`);
    } catch (error) { failures.push(catalogueError(error)); }
    finally { setIssues(failures); setBusy(false); }
  };

  if (!Object.values(snapshot.raw).some(Boolean)) return <details style={{ marginBottom: 16 }}>
    <summary>Recover products from a browser backup</summary>
    <input type="file" accept="application/json,.json" onChange={loadBackup} disabled={busy} />
    {issues.map((issue, index) => <p role="alert" key={index}>{issue}</p>)}
  </details>;
  return <section style={{ padding: 16, marginBottom: 16, border: "1px solid #f59e0b", borderRadius: 8, background: "#fffbeb" }}>
    <strong>Existing browser catalogue: {snapshot.entries.length} product(s)</strong>
    <p style={{ margin: "8px 0" }}>Download a backup, then import into the shared catalogue so Admin and other users can see these products. Old temporary images may need their original files uploaded again. No browser records will be removed.</p>
    <button type="button" disabled={busy} onClick={downloadBackup}>Download browser backup</button>{" "}
    <label style={{ display: "block", marginTop: 8 }}>Or load a previously downloaded backup: <input type="file" accept="application/json,.json" disabled={busy} onChange={loadBackup} /></label>
    <label style={{ display: "inline-block", margin: 8 }}><input type="checkbox" checked={acknowledged} disabled={busy} onChange={(e) => setAcknowledged(e.target.checked)} /> I saved the backup and want to share these products.</label>
    <button type="button" disabled={!backedUp || !acknowledged || busy} onClick={importProducts}>{busy ? "Importing…" : "Import browser products"}</button>
    {message && <p role="status">{message}</p>}
    {issues.length > 0 && <ul role="alert">{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
  </section>;
}
