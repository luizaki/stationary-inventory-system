import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import { format } from "date-fns";

const php = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export default function AccountingCharge() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(null);

  const [tab, setTab] = useState("charge"); // 'charge' | 'paid'
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Charge Requests
  const [orders, setOrders] = useState([]);
  const [rqFilters, setRqFilters] = useState({ startDate: "", endDate: "", search: "" });
  const [loading, setLoading] = useState(true);

  // Charged / Completed Requests
  const [charges, setCharges] = useState([]);
  const [chFilters, setChFilters] = useState({ startDate: "", endDate: "", status: "charged", search: "" });

  const [chargeOpen, setChargeOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [taxRate, setTaxRate] = useState(0.12);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [charging, setCharging] = useState(false);

  // Read role
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setRole(user?.user_metadata?.role || null);
    })();
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/paid-orders")) setTab("paid");
    else setTab("charge");
  }, [location.pathname]);

  useEffect(() => {
    if (tab !== "charge") return;
    (async () => {
      setLoading(true); setErr("");
      try {
        let q = supabase
          .from("order")
          .select(`
            id, order_date, status,
            customer:customer_id ( id, name ),
            order_item:order_item (
              item_id, quantity, unit_price,
              item:item_id ( id, name, base_price )
            )
          `)
          .eq("status", "approved")
          .order("order_date", { ascending: false });

        if (rqFilters.startDate) q = q.gte("order_date", rqFilters.startDate);
        if (rqFilters.endDate)   q = q.lte("order_date", rqFilters.endDate);

        const { data, error } = await q;
        if (error) throw error;

        const s = rqFilters.search.trim().toLowerCase();
        const filtered = (data || []).filter(o =>
          !s ||
          (o.id || "").toLowerCase().includes(s) ||
          (o.customer?.name || "").toLowerCase().includes(s)
        );
        setOrders(filtered);
      } catch (e) {
        console.error(e); setErr("Failed to load orders for charging.");
      } finally { setLoading(false); }
    })();
  }, [tab, rqFilters]);

  useEffect(() => {
    if (tab !== "paid") return;
    (async () => {
      setLoading(true); setErr("");
      try {
        let q = supabase
          .from("order")
          .select(`
            id, order_date, status,
            customer:customer_id ( id, name ),
            order_item:order_item ( item_id, quantity, unit_price )
          `)
          .in("status", ["charged", "completed"])
          .order("order_date", { ascending: false });

        if (chFilters.status !== "all") q = q.eq("status", chFilters.status);
        if (chFilters.startDate) q = q.gte("order_date", chFilters.startDate);
        if (chFilters.endDate)   q = q.lte("order_date", chFilters.endDate);

        const { data, error } = await q;
        if (error) throw error;

        const s = chFilters.search.trim().toLowerCase();
        const filtered = (data || []).filter(o =>
          !s ||
          (o.id || "").toLowerCase().includes(s) ||
          (o.customer?.name || "").toLowerCase().includes(s)
        );
        setCharges(filtered);
      } catch (e) {
        console.error(e); setErr("Failed to load charged/completed orders.");
      } finally { setLoading(false); }
    })();
  }, [tab, chFilters]);

  if (role && role.toLowerCase() !== "accounting") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role={role} />
        <main className="flex-1 p-8">
          <h1 className="text-xl font-semibold">Unauthorized</h1>
          <p className="text-gray-600 mt-2">This page is for the Accounting role.</p>
        </main>
      </div>
    );
  }

  // Helpers
  const orderSubtotal = (o) =>
    (o.order_item || []).reduce((sum, it) => sum + Number(it.unit_price ?? 0) * Number(it.quantity ?? 0), 0);

  const previewTotals = useMemo(() => {
    if (!selectedOrder) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = orderSubtotal(selectedOrder);
    const tax = subtotal * Number(taxRate || 0);
    const total = subtotal + tax + Number(deliveryFee || 0) - Number(discount || 0);
    return { subtotal, tax, total };
  }, [selectedOrder, taxRate, deliveryFee, discount]);

  // Actions
  const openCharge = (order) => {
    setSelectedOrder(order);
    setTaxRate(0.12);
    setDeliveryFee(0);
    setDiscount(0);
    setChargeOpen(true);
    setOk(""); setErr("");
  };

  const markCharged = async () => {
    if (!selectedOrder) return;
    setCharging(true); setErr(""); setOk("");
    try {
      const { error } = await supabase.from("order").update({ status: "charged" }).eq("id", selectedOrder.id);
      if (error) throw error;
      setChargeOpen(false);
      setOk("Order marked as CHARGED.");
      setRqFilters({ ...rqFilters }); // refresh
    } catch (e) {
      console.error(e); setErr(e.message || "Failed to mark as charged.");
    } finally { setCharging(false); }
  };

  const markCompleted = async (orderId) => {
    try {
      const { error } = await supabase.from("order").update({ status: "completed" }).eq("id", orderId);
      if (error) throw error;
      setOk("Order marked as COMPLETED.");
      setChFilters({ ...chFilters }); // refresh
    } catch (e) {
      console.error(e); setErr(e.message || "Failed to mark as completed.");
    }
  };

  const gotoInvoice = (orderId) => navigate(`/invoice/order/${orderId}`);

  // UI
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={role} />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Accounting</h1>
              <p className="text-sm text-gray-500">Charge approved orders and track charged/completed</p>
            </div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => navigate("/charge-requests")}
                className={`px-4 py-2 text-sm font-medium border rounded-l-md ${tab==="charge" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                Charge Requests
              </button>
              <button
                onClick={() => navigate("/paid-orders")}
                className={`px-4 py-2 text-sm font-medium border rounded-r-md ${tab==="paid" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                Paid Requests
              </button>
            </div>
          </div>

          {err && <div className="mb-4 p-4 rounded-md bg-red-50 border-l-4 border-red-500 text-red-700">{err}</div>}
          {ok &&  <div className="mb-4 p-4 rounded-md bg-green-50 border-l-4 border-green-500 text-green-700">{ok}</div>}

          {/* CHARGE TAB */}
          {tab === "charge" && (
            <section className="space-y-6">
              {/* Filters */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start</label>
                    <input
                      type="date"
                      value={rqFilters.startDate}
                      onChange={(e)=>setRqFilters(f=>({...f, startDate:e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End</label>
                    <input
                      type="date"
                      value={rqFilters.endDate}
                      onChange={(e)=>setRqFilters(f=>({...f, endDate:e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Search (Order ID / Customer)</label>
                    <input
                      type="text"
                      value={rqFilters.search}
                      onChange={(e)=>setRqFilters(f=>({...f, search:e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                {loading ? (
                  <div className="p-6 text-gray-500">Loading…</div>
                ) : orders.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No approved orders awaiting charge.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order Date</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Items</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {orders.map((o) => {
                        const sub = orderSubtotal(o);
                        return (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{o.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{o.customer?.name || "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{o.order_date ? format(new Date(o.order_date), "MMM dd, yyyy") : "—"}</td>
                            <td className="px-6 py-4 text-sm text-right text-gray-600">{(o.order_item || []).length}</td>
                            <td className="px-6 py-4 text-sm text-right font-medium">{php.format(sub)}</td>
                            <td className="px-6 py-4 text-right space-x-3">
                              <button onClick={()=>openCharge(o)} className="px-3 py-1.5 text-sm rounded-md text-white bg-green-600 hover:bg-green-700">Charge</button>
                              <button onClick={()=>gotoInvoice(o.id)} className="px-3 py-1.5 text-sm rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50">Invoice</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* PAID TAB */}
          {tab === "paid" && (
            <section className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start</label>
                    <input
                      type="date"
                      value={chFilters.startDate}
                      onChange={(e)=>setChFilters(f=>({...f, startDate:e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End</label>
                    <input
                      type="date"
                      value={chFilters.endDate}
                      onChange={(e)=>setChFilters(f=>({...f, endDate:e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={chFilters.status}
                      onChange={(e)=>setChFilters(f=>({...f, status:e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="charged">Charged</option>
                      <option value="completed">Completed</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Search (Order / Customer)</label>
                    <input
                      type="text"
                      value={chFilters.search}
                      onChange={(e)=>setChFilters(f=>({...f, search:e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-x-auto">
                {loading ? (
                  <div className="p-6 text-gray-500">Loading…</div>
                ) : charges.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No results.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {charges.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{o.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{o.customer?.name || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{o.order_date ? format(new Date(o.order_date), "MMM dd, yyyy") : "—"}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${o.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            {php.format(orderSubtotal(o))}
                          </td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button onClick={() => gotoInvoice(o.id)} className="text-blue-600 hover:text-blue-800">View</button>
                            {o.status === "charged" && (
                              <button onClick={() => markCompleted(o.id)} className="text-green-600 hover:text-green-800">Mark Completed</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Charge preview modal */}
        {chargeOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <h3 className="text-lg font-semibold">Charge — {selectedOrder.id}</h3>
                <button onClick={()=>setChargeOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
                <div className="text-sm text-gray-600">
                  <div><b>Customer:</b> {selectedOrder.customer?.name || "—"}</div>
                  <div><b>Order Date:</b> {selectedOrder.order_date ? format(new Date(selectedOrder.order_date), "MMM dd, yyyy") : "—"}</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {(selectedOrder.order_item || []).map((it, idx) => {
                        const price = Number(it.unit_price ?? it.item?.base_price ?? 0);
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm">{it.item?.name || it.item_id}</td>
                            <td className="px-4 py-2 text-sm text-right">{it.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right">{php.format(price)}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium">{php.format(price * Number(it.quantity || 0))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tax Rate</label>
                    <input type="number" step="0.01" min="0" value={taxRate}
                      onChange={(e)=>setTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"/>
                    <p className="text-xs text-gray-500 mt-1">Computed only (not stored)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Delivery Fee</label>
                    <input type="number" step="0.01" min="0" value={deliveryFee}
                      onChange={(e)=>setDeliveryFee(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Amount</label>
                    <input type="number" step="0.01" min="0" value={discount}
                      onChange={(e)=>setDiscount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"/>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{php.format(previewTotals.subtotal)}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>{php.format(previewTotals.tax)}</span></div>
                    <div className="flex justify-between"><span>Delivery Fee</span><span>{php.format(deliveryFee)}</span></div>
                    <div className="flex justify-between"><span>Discount</span><span>- {php.format(discount)}</span></div>
                    <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{php.format(previewTotals.total)}</span></div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button onClick={()=>setChargeOpen(false)} className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50">Cancel</button>
                <button onClick={()=>gotoInvoice(selectedOrder.id)} className="px-4 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50">
                  Preview Invoice
                </button>
                <button onClick={markCharged} disabled={charging}
                  className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                  {charging ? "Saving…" : "Mark as Charged"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}