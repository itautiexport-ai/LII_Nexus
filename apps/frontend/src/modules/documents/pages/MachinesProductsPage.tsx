import { FormEvent, useEffect, useState } from "react";
import { documentApi, MachineRecord, ProductRecord } from "../api/documentApi";

export default function MachinesProductsPage() {
  const [machines, setMachines] = useState<MachineRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [machineForm, setMachineForm] = useState({ name: "", code: "" });
  const [productForm, setProductForm] = useState({ name: "", sku: "" });
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  async function load() {
    setMachines(await documentApi.listMachines());
    setProducts(await documentApi.listProducts());
  }
  useEffect(() => { load(); }, []);

  async function handleAddMachine(e: FormEvent) {
    e.preventDefault();
    const payloadCode = machineForm.code.trim() || undefined;
    if (editingMachineId) {
      await documentApi.updateMachine(editingMachineId, machineForm.name, payloadCode);
      setEditingMachineId(null);
    } else {
      await documentApi.createMachine(machineForm.name, payloadCode);
    }
    setMachineForm({ name: "", code: "" });
    await load();
  }

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();
    const payloadSku = productForm.sku.trim() || undefined;
    if (editingProductId) {
      await documentApi.updateProduct(editingProductId, productForm.name, payloadSku);
      setEditingProductId(null);
    } else {
      await documentApi.createProduct(productForm.name, payloadSku);
    }
    setProductForm({ name: "", sku: "" });
    await load();
  }

  function editMachine(m: MachineRecord) {
    setMachineForm({ name: m.name, code: m.code || "" });
    setEditingMachineId(m.id);
  }

  function editProduct(p: ProductRecord) {
    setProductForm({ name: p.name, sku: p.sku || "" });
    setEditingProductId(p.id);
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Machines & Products</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>Minimal reference lists so documents (manuals, drawings) have real machines and products to attach to.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Machines</h3>
          <form onSubmit={handleAddMachine} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input required placeholder="Name" value={machineForm.name} onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })} style={{ padding: 6, flex: 1 }} />
            <input placeholder="Code" value={machineForm.code} onChange={(e) => setMachineForm({ ...machineForm, code: e.target.value })} style={{ padding: 6, width: 100 }} />
            <button type="submit">{editingMachineId ? "Update" : "+ Add"}</button>
            {editingMachineId && <button type="button" onClick={() => { setEditingMachineId(null); setMachineForm({ name: "", code: "" }); }}>Cancel</button>}
          </form>
          {machines.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span>{m.name} {m.code && <span style={{ color: "#999" }}>({m.code})</span>}</span>
              <button onClick={() => editMachine(m)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer" }}>Edit</button>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Products</h3>
          <form onSubmit={handleAddProduct} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input required placeholder="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} style={{ padding: 6, flex: 1 }} />
            <input placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} style={{ padding: 6, width: 100 }} />
            <button type="submit">{editingProductId ? "Update" : "+ Add"}</button>
            {editingProductId && <button type="button" onClick={() => { setEditingProductId(null); setProductForm({ name: "", sku: "" }); }}>Cancel</button>}
          </form>
          {products.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span>{p.name} {p.sku && <span style={{ color: "#999" }}>({p.sku})</span>}</span>
              <button onClick={() => editProduct(p)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer" }}>Edit</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
