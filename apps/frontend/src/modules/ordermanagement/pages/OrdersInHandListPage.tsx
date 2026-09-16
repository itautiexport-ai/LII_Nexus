import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderInHandApi, OrderInHandRecord } from "../api/orderInHandApi";
import { useTableFreeze } from "../../../shared/hooks/useTableFreeze";
import { TableFreezeButton } from "../../../shared/components/TableFreezeButton";
import { TableFreezeModal } from "../../../shared/components/TableFreezeModal";

const ORDER_COLUMNS = [
  { key: "orderId", label: "Order ID", width: 120 },
  { key: "orderDate", label: "Order Date", width: 110 },
  { key: "customerName", label: "Customer Name", width: 160 },
  { key: "country", label: "Country", width: 100 },
  { key: "merchantName", label: "Merchant Name", width: 130 },
  { key: "erpNumber", label: "ERP Number", width: 120 },
  { key: "exFactoryDate", label: "Ex-Factory Date", width: 120 },
  { key: "poNumber", label: "PO Number", width: 110 },
  { key: "noOfProducts", label: "No. of Products", width: 110 },
  { key: "totalQty", label: "Total Qty", width: 100 },
  { key: "totalCbm", label: "Total CBM", width: 100 },
  { key: "orderValue", label: "Order Value", width: 110 },
  { key: "currency", label: "Currency", width: 90 },
  { key: "paymentStatus", label: "Payment Status", width: 120 },
  { key: "productionStatus", label: "Production Status", width: 140 },
  { key: "qcStatus", label: "QC Status", width: 130 },
  { key: "packingStatus", label: "Packing Status", width: 130 },
  { key: "expDispatch", label: "Exp. Dispatch", width: 120 },
  { key: "delay", label: "Delay (Days)", width: 100 },
  { key: "status", label: "Status", width: 130 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "actions", label: "Actions", width: 110 },
];

export default function OrdersInHandListPage() {
  const [orders, setOrders] = useState<OrderInHandRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [buyerFilter, setBuyerFilter] = useState("");
  const [valueFilter, setValueFilter] = useState("");

  const {
    settings: freezeSettings,
    isModalOpen: isFreezeModalOpen,
    effectiveFreezeCount,
    openModal: openFreezeModal,
    closeModal: closeFreezeModal,
    saveSettings: saveFreezeSettings,
    resetSettings: resetFreezeSettings,
    isSaving: isFreezeSaving,
    getContainerStyle,
    getStickyHeaderStyle,
    getStickyCellStyle,
  } = useTableFreeze({
    tableKey: "orders_in_hand_list",
    availableColumns: ORDER_COLUMNS,
    defaultSettings: {
      freezeColumns: 0,
      freezeHeader: true,
      tableMaxHeight: "72vh",
    },
  });

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
    if (!order.expectedDispatchDate || !order.exFactoryDate) return 0;

    const expDate = new Date(order.expectedDispatchDate);
    const exFactory = new Date(order.exFactoryDate);
    const diffTime = expDate.getTime() - exFactory.getTime();
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TableFreezeButton
            onClick={openFreezeModal}
            effectiveFreezeCount={effectiveFreezeCount}
            isHeaderFrozen={freezeSettings.freezeHeader}
          />
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

      <div style={getContainerStyle({ border: "1px solid #e5e7eb", borderRadius: "8px" })}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 2000 }}>
          <thead style={{ textAlign: "left" }}>
            <tr>
              {ORDER_COLUMNS.map((col, idx) => (
                <th
                  key={col.key}
                  style={getStickyHeaderStyle(idx, {
                    customStyle: {
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#4b5563",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                    },
                  })}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={ORDER_COLUMNS.length} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={ORDER_COLUMNS.length} style={{ textAlign: "center", padding: 24 }}>No orders found.</td></tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={getStickyCellStyle(0, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.orderId}</td>
                  <td style={getStickyCellStyle(1, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.orderDate}</td>
                  <td style={getStickyCellStyle(2, { customStyle: { padding: "12px 16px", fontSize: 14, fontWeight: 500, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.customerName}</td>
                  <td style={getStickyCellStyle(3, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.country || "-"}</td>
                  <td style={getStickyCellStyle(4, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.merchantName}</td>
                  <td style={getStickyCellStyle(5, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.erpNumber || "-"}</td>
                  <td style={getStickyCellStyle(6, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.exFactoryDate || "-"}</td>
                  <td style={getStickyCellStyle(7, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.poNumber || "-"}</td>
                  <td style={getStickyCellStyle(8, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.noOfProducts || "-"}</td>
                  <td style={getStickyCellStyle(9, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.totalQty || "-"}</td>
                  <td style={getStickyCellStyle(10, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.totalCbm || "-"}</td>
                  <td style={getStickyCellStyle(11, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.orderValue || "-"}</td>
                  <td style={getStickyCellStyle(12, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.currency || "-"}</td>
                  <td style={getStickyCellStyle(13, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.paymentStatus || "-"}</td>
                  <td style={getStickyCellStyle(14, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>
                    <select
                      value={order.productionStatus || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const payload: any = { productionStatus: val };
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
                  <td style={getStickyCellStyle(15, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>
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
                  <td style={getStickyCellStyle(16, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>
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
                  <td style={getStickyCellStyle(17, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.expectedDispatchDate || "-"}</td>
                  <td style={getStickyCellStyle(18, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>
                    <span style={{ color: getDelay(order) > 0 ? "#dc2626" : "inherit", fontWeight: getDelay(order) > 0 ? 600 : 400 }}>
                      {getDelay(order)}
                    </span>
                  </td>
                  <td style={getStickyCellStyle(19, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>
                    <select
                      value={order.overallStatus || "Under Process"}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer" }}
                    >
                      <option value="Under Process">Under Process</option>
                      <option value="Dispatched">Dispatched</option>
                    </select>
                  </td>
                  <td style={getStickyCellStyle(20, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>{order.priority || "-"}</td>
                  <td style={getStickyCellStyle(21, { customStyle: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" } })}>
                    <Link to={`/admin/order-management/${order.id}`} style={{ marginRight: 12, color: "#2563eb", textDecoration: "none" }}>Edit</Link>
                    <button onClick={() => handleDelete(order.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TableFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={closeFreezeModal}
        settings={freezeSettings}
        availableColumns={ORDER_COLUMNS}
        onSave={saveFreezeSettings}
        onReset={resetFreezeSettings}
        isSaving={isFreezeSaving}
      />
    </div>
  );
}
