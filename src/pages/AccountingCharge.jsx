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

  // Tabs: 'charge' | 'paid'
  const [tab, setTab] = useState("charge");

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // CHARGE tab (purchases awaiting review/charge)
  const [purchases, setPurchases] = useState([]);
  const [rqFilters, setRqFilters] = useState({
    startDate: "",
    endDate: "",
    search: "",
    // If your PurchaseStock inserts as 'pending', set this to 'pending'
    status: "completed", // ← change to 'pending' once you start using pending
  });
  const [loading, setLoading] = useState(true);

  // PAID tab (purchases with status completed by default)
  const [paidPurchases, setPaidPurchases] = useState([]);
  const [chFilters, setChFilters] = useState({
    startDate: "",
    endDate: "",
    status: "completed", // 'completed' | 'pending' | 'all'
    search: "",
  });

  const [chargeOpen, setChargeOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [taxRate, setTaxRate] = useState(0.12);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);

  // read role
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setRole(user?.user_metadata?.role || null);
    })();
  }, []);

  // derive tab from URL
  useEffect(() => {
    if (location.pathname.includes("/paid-orders")) setTab("paid");
    else setTab("charge");
  }, [location.pathname]);

  // fetch purchases for CHARGE tab
  useEffect(() => {
    if (tab !== "charge") return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        let q = supabase
          .from("purchase")
          .select(`
            id, purchase_date, status,
            distributor:distributor_id ( id, name ),
            purchase_item:purchase_item (
              item_id, quantity, unit_cost,
              item:item_id ( id, name, base_price )
            )
          `)
          .order("purchase_date", { ascending: false });

        if (rqFilters.status && rqFilters.status !== "all") {
          q = q.eq("status", rqFilters.status);
        }
        if (rqFilters.startDate) q = q.gte("purchase_date", rqFilters.startDate);
        if (rqFilters.endDate) q = q.lte("purchase_date", rqFilters.endDate);

        const { data, error } = await q;
        if (error) throw error;

        const s = rqFilters.search.trim().toLowerCase();
        const filtered = (data || []).filter((p) =>
          !s ||
          (p.id || "").toLowerCase().includes(s) ||
          (p.distributor?.name || "").toLowerCase().includes(s)
        );
        setPurchases(filtered);
      } catch (e) {
        console.error(e);
        setErr("Failed to load purchases for review.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, rqFilters]);

  // fetch purchases for PAID tab
  useEffect(() => {
    if (tab !== "paid") return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        let q = supabase
          .from("purchase")
          .select(`
            id, purchase_date, status,
            distributor:distributor_id ( id, name ),
            purchase_item:purchase_item ( item_id, quantity, unit_cost )
          `)
          .order("purchase_date", { ascending: false });

        if (chFilters.status && chFilters.status !== "all") {
          q = q.eq("status", chFilters.status);
        }
        if (chFilters.startDate) q = q.gte("purchase_date", chFilters.startDate);
        if (chFilters.endDate) q = q.lte("purchase_date", chFilters.endDate);

        const { data, error } = await q;
        if (error) throw error;

        const s = chFilters.search.trim().toLowerCase();
        const filtered = (data || []).filter((p) =>
          !s ||
          (p.id || "").toLowerCase().includes(s) ||
          (p.distributor?.name || "").toLowerCase().includes(s)
        );
        setPaidPurchases(filtered);
      } catch (e) {
        console.error(e);
        setErr("Failed to load completed/past purchases.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, chFilters]);

  // role gate (only block when we know the role)
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

  // helpers
  const purchaseSubtotal = (p) =>
    (p.purchase_item || []).reduce(
      (sum, it) => sum + Number(it.unit_cost ?? 0) * Number(it.quantity ?? 0),
      0
    );

  const previewTotals = useMemo(() => {
    if (!selectedPurchase) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = purchaseSubtotal(selectedPurchase);
    const tax = subtotal * Number(taxRate || 0);
    const total = subtotal + tax + Number(deliveryFee || 0) - Number(discount || 0);
    return { subtotal, tax, total };
  }, [selectedPurchase, taxRate, deliveryFee, discount]);

  // actions
  const openCharge = (p) => {
    setSelectedPurchase(p);
    setTaxRate(0.12);
    setDeliveryFee(0);
    setDiscount(0);
    setChargeOpen(true);
    setOk("");
    setErr("");
  };

  // eventually add a 'charged' value to purchase_status
  // const markCharged = async () => {
  //   if (!selectedPurchase) return;
  //   try {
  //     const { error } = await supabase
  //       .from("purchase")
  //       .update({ status: "completed" })
  //       .eq("id", selectedPurchase.id);
  //     if (error) throw error;
  //     setChargeOpen(false);
  //     setOk("Purchase marked as COMPLETED.");
  //     setRqFilters({ ...rqFilters }); // refresh
  //   } catch (e) {
  //     console.error(e);
  //     setErr(e.message || "Failed to update status.");
  //   }
  // };

  const gotoInvoice = (purchaseId) => navigate(`/invoice/order/${purchaseId}`);

  // UI
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={role} />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Accounting — Purchases</h1>
              <p className="text-sm text-gray-500">Review purchased stock and print receipts</p>
            </div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
            </div>
          </div>

          {err && (
            <div className="mb-4 p-4 rounded-md bg-red-50 border-l-4 border-red-500 text-red-700">
              {err}
            </div>
          )}
          {ok && (
            <div className="mb-4 p-4 rounded-md bg-green-50 border-l-4 border-green-500 text-green-700">
              {ok}
            </div>
          )}

          {/* CHARGE TAB: purchases list */}
          {tab === "charge" && (
            <section className="space-y-6">
              {/* Filters */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start</label>
                    <input
                      type="date"
                      value={rqFilters.startDate}
                      onChange={(e) =>
                        setRqFilters((f) => ({ ...f, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End</label>
                    <input
                      type="date"
                      value={rqFilters.endDate}
                      onChange={(e) =>
                        setRqFilters((f) => ({ ...f, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={rqFilters.status}
                      onChange={(e) =>
                        setRqFilters((f) => ({ ...f, status: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Search (Purchase ID / Distributor)
                    </label>
                    <input
                      type="text"
                      value={rqFilters.search}
                      onChange={(e) =>
                        setRqFilters((f) => ({ ...f, search: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                {loading ? (
                  <div className="p-6 text-gray-500">Loading…</div>
                ) : purchases.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    No purchases match your filters.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Purchase ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Distributor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Purchase Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Lines
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Subtotal
                        </th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {purchases.map((p) => {
                        const sub = purchaseSubtotal(p);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{p.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {p.distributor?.name || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {p.purchase_date
                                ? format(new Date(p.purchase_date), "MMM dd, yyyy")
                                : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-gray-600">
                              {(p.purchase_item || []).length}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-medium">
                              {php.format(sub)}
                            </td>
                            <td className="px-6 py-4 text-right space-x-3">
                              <button
                                onClick={() => openCharge(p)}
                                className="px-3 py-1.5 text-sm rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => gotoInvoice(p.id)}
                                className="px-3 py-1.5 text-sm rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50"
                              >
                                Receipt
                              </button>
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

          {/* PAID TAB: history */}
          {tab === "paid" && (
            <section className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start</label>
                    <input
                      type="date"
                      value={chFilters.startDate}
                      onChange={(e) =>
                        setChFilters((f) => ({ ...f, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End</label>
                    <input
                      type="date"
                      value={chFilters.endDate}
                      onChange={(e) =>
                        setChFilters((f) => ({ ...f, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={chFilters.status}
                      onChange={(e) =>
                        setChFilters((f) => ({ ...f, status: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Search (Purchase / Distributor)
                    </label>
                    <input
                      type="text"
                      value={chFilters.search}
                      onChange={(e) =>
                        setChFilters((f) => ({ ...f, search: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-x-auto">
                {loading ? (
                  <div className="p-6 text-gray-500">Loading…</div>
                ) : paidPurchases.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No results.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Purchase
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Distributor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Purchase Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Subtotal
                        </th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paidPurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{p.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {p.distributor?.name || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {p.purchase_date
                              ? format(new Date(p.purchase_date), "MMM dd, yyyy")
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                p.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            {php.format(purchaseSubtotal(p))}
                          </td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button
                              onClick={() => gotoInvoice(p.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View Receipt
                            </button>
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

        {/* Review modal */}
        {chargeOpen && selectedPurchase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <h3 className="text-lg font-semibold">Review — {selectedPurchase.id}</h3>
                <button
                  onClick={() => setChargeOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
                <div className="text-sm text-gray-600">
                  <div>
                    <b>Distributor:</b> {selectedPurchase.distributor?.name || "—"}
                  </div>
                  <div>
                    <b>Purchase Date:</b>{" "}
                    {selectedPurchase.purchase_date
                      ? format(new Date(selectedPurchase.purchase_date), "MMM dd, yyyy")
                      : "—"}
                  </div>
                  <div>
                    <b>Status:</b> {selectedPurchase.status || "—"}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                          Unit Cost
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {(selectedPurchase.purchase_item || []).map((it, idx) => {
                        const cost = Number(it.unit_cost ?? it.item?.base_price ?? 0);
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm">
                              {it.item?.name || it.item_id}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {it.quantity}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {php.format(cost)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium">
                              {php.format(cost * Number(it.quantity || 0))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tax Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Computed only (not stored)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Delivery Fee</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{php.format(previewTotals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{php.format(previewTotals.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{php.format(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>- {php.format(discount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{php.format(previewTotals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => setChargeOpen(false)}
                  className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => gotoInvoice(selectedPurchase.id)}
                  className="px-4 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Print Receipt
                </button>
                {/* Enable if you add a 'charged' or want to set 'completed' */}
                {/* <button onClick={markCharged} className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700">
                  Mark as Completed
                </button> */}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
