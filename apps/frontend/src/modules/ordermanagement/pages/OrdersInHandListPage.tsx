import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderInHandApi, OrderInHandRecord } from "../api/orderInHandApi";

export default function OrdersInHandListPage() {
  const [orders, setOrders] = useState<OrderInHandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [buyerFilter, setBuyerFilter] = useState("");
  const [valueFilter, setValueFilter] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await orderInHandApi.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await orderInHandApi.delete(id);
      loadOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to delete order");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await orderInHandApi.update(id, { overallStatus: newStatus as 'Under Process' | 'Dispatched' });
      // Update local state to avoid full reload
      setOrders(orders.map(o => o.id === id ? { ...o, overallStatus: newStatus as any } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const getDelay = (order: OrderInHandRecord) => {
    if (!order.expectedDispatchDate) return "-";
    if (order.overallStatus === "Dispatched") return "-"; // Optionally, you could store final delay. Here we just hide it or show 0 if dispatched.
    
    const expDate = new Date(order.expectedDispatchDate);
    const today = new Date();
    const diffTime = Math.max(0, today.getTime() - expDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const filteredOrders = orders.filter(o => {
    if (buyerFilter && !o.customerName?.toLowerCase().includes(buyerFilter.toLowerCase())) return false;
    if (valueFilter && (!o.orderValue || o.orderValue < parseFloat(valueFilter))) return false;
    return true;
  });

  return (
    <div style={{ padding: 24, background: "#fff", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Orders in Hand</h1>
        <Link 
          to="/admin/order-management/new" 
          style={{ 
            background: "#4f46e5", color: "#fff", padding: "8px 16px", 
            borderRadius: 6, textDecoration: "none", fontWeight: 500 
          }}
        >
          + Add Order
        </Link>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 500 }}>Buyer Name (Customer)</label>
          <input 
            type="text" 
            placeholder="Search by buyer..."
            value={buyerFilter}
            onChange={e => setBuyerFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 500 }}>Min Order Value</label>
          <input 
            type="number" 
            placeholder="e.g. 1000"
            value={valueFilter}
            onChange={e => setValueFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 2000 }}>
          <thead style={{ background: "#f9fafb", textAlign: "left" }}>
            <tr>
              {[
                "Order ID", "Order Date", "Customer Name", "Country", "Merchant Name", "ERP Number", "Ex-Factory Date",
                "Marketplace", "PO Number", "No. of Products", "Total Qty", "Order Value",
                "Currency", "Payment Status", "Production Status", "QC Status", "Packing Status",
                "Exp. Dispatch", "Delay (Days)",
                "Status", "Priority", "Actions"
              ].map(h => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#4b5563", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={23} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={23} style={{ textAlign: "center", padding: 24 }}>No orders found.</td></tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.orderId}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.orderDate}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500 }}>{order.customerName}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.country || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.merchantName}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.erpNumber || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.exFactoryDate || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.marketplace || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.poNumber || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.noOfProducts || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.totalQty || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.orderValue || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.currency || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.paymentStatus || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    <select 
                      value={order.productionStatus || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const payload: any = { productionStatus: val };
                        if (val === "Completed") {
                          const expDate = new Date();
                          expDate.setDate(expDate.getDate() + 7);
                          payload.expectedDispatchDate = expDate.toISOString().split('T')[0];
                        }
                        try {
                          await orderInHandApi.update(order.id, payload);
                          setOrders(orders.map(o => o.id === order.id ? { ...o, ...payload } : o));
                        } catch (err) {
                          alert("Failed to update status");
                        }
                      }}
                      style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer" }}
                    >
                      <option value="">-</option>
                      <option value="Started">Started</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    <select 
                      value={order.qcStatus || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        try {
                          await orderInHandApi.update(order.id, { qcStatus: val as any });
                          setOrders(orders.map(o => o.id === order.id ? { ...o, qcStatus: val as any } : o));
                        } catch (err) {
                          alert("Failed to update status");
                        }
                      }}
                      style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer" }}
                    >
                      <option value="">-</option>
                      <option value="Started">Started</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    <select 
                      value={order.packingStatus || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        try {
                          await orderInHandApi.update(order.id, { packingStatus: val as any });
                          setOrders(orders.map(o => o.id === order.id ? { ...o, packingStatus: val as any } : o));
                        } catch (err) {
                          alert("Failed to update status");
                        }
                      }}
                      style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer" }}
                    >
                      <option value="">-</option>
                      <option value="Started">Started</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.expectedDispatchDate || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    <span style={{ color: getDelay(order) > 0 ? "#dc2626" : "inherit", fontWeight: getDelay(order) > 0 ? 600 : 400 }}>
                      {getDelay(order)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    <select 
                      value={order.overallStatus || "Under Process"}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer" }}
                    >
                      <option value="Under Process">Under Process</option>
                      <option value="Dispatched">Dispatched</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.priority || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    <Link to={`/admin/order-management/${order.id}`} style={{ marginRight: 12, color: "#2563eb", textDecoration: "none" }}>Edit</Link>
                    <button onClick={() => handleDelete(order.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
