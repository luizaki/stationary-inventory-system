import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const php = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const deriveInvoiceNo = (orderId, orderDate) => {
  const d = orderDate ? new Date(orderDate) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `INV-${y}${m}${day}-${String(orderId || "").replace(/-/g, "").slice(0, 6).toUpperCase()}`;
};

export default function AccountingReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [taxRate, setTaxRate] = useState(0.12);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        const { data: header, error: hErr } = await supabase
          .from("order")
          .select(`
            id, order_date, status,
            customer:customer_id ( id, name, contact_info )
          `)
          .eq("id", id)
          .single();
        if (hErr) throw hErr;
        setOrder(header);

        const { data: items, error: iErr } = await supabase
          .from("order_item")
          .select(`id, quantity, unit_price, item:item_id ( id, name )`)
          .eq("order_id", id)
          .order("id");
        if (iErr) throw iErr;

        setLines(items || []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const subtotal = useMemo(
    () => (lines || []).reduce((s, ln) => s + Number(ln.unit_price || 0) * Number(ln.quantity || 0), 0),
    [lines]
  );
  const tax = useMemo(() => subtotal * Number(taxRate || 0), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax + Number(deliveryFee || 0) - Number(discount || 0), [subtotal, tax, deliveryFee, discount]);

  if (loading) return <div className="p-6">Loading invoice…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!order) return <div className="p-6">Order not found.</div>;

  const invNo = deriveInvoiceNo(order.id, order.order_date);

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white">
      <div className="max-w-3xl mx-auto bg-white shadow print:shadow-none print:border print:border-gray-200">
        <div className="p-4 border-b flex items-center justify-between print:hidden">
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50">Back</button>
          <div className="flex gap-2">
            <input type="number" step="0.01" min="0" value={taxRate}
              onChange={(e)=>setTaxRate(Number(e.target.value))} className="w-24 px-2 py-1 border rounded" title="Tax rate (e.g., 0.12)" />
            <input type="number" step="0.01" min="0" value={deliveryFee}
              onChange={(e)=>setDeliveryFee(e.target.value)} className="w-24 px-2 py-1 border rounded" title="Delivery fee" />
            <input type="number" step="0.01" min="0" value={discount}
              onChange={(e)=>setDiscount(e.target.value)} className="w-24 px-2 py-1 border rounded" title="Discount" />
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded text-white bg-green-600 hover:bg-green-700">
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">INVOICE</h1>
              <p className="text-sm text-gray-500">Invoice No: <b>{invNo}</b></p>
              <p className="text-sm text-gray-500">Status: {order.status.toUpperCase()}</p>
            </div>
            <div className="text-right text-sm">
              <div><b>Date:</b> {order.order_date ? new Date(order.order_date).toLocaleDateString() : "—"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm mb-8">
            <div>
              <div className="font-medium mb-1">Billed To</div>
              <div className="text-gray-700">{order.customer?.name || "—"}</div>
              <div className="text-gray-500 whitespace-pre-line">{order.customer?.contact_info || ""}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Order</div>
              <div><b>Order ID:</b> {order.id}</div>
              <div><b>Order Date:</b> {order.order_date ? new Date(order.order_date).toLocaleDateString() : "—"}</div>
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold border">Item</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold border">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold border">Unit Price</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold border">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((ln) => (
                  <tr key={ln.id} className="border-t">
                    <td className="px-3 py-2 text-sm border">{ln.item?.name || ln.item_id}</td>
                    <td className="px-3 py-2 text-sm text-right border">{ln.quantity}</td>
                    <td className="px-3 py-2 text-sm text-right border">{php.format(ln.unit_price)}</td>
                    <td className="px-3 py-2 text-sm text-right border">{php.format(Number(ln.unit_price) * Number(ln.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{php.format(subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax ({(Number(taxRate) * 100).toFixed(0)}%)</span><span>{php.format(tax)}</span></div>
              <div className="flex justify-between"><span>Delivery Fee</span><span>{php.format(deliveryFee)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>- {php.format(discount)}</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{php.format(total)}</span></div>
            </div>
          </div>

          <p className="mt-8 text-xs text-gray-500">This invoice is computed from existing order items (no extra data stored).</p>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
