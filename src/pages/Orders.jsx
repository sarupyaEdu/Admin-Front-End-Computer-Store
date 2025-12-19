import { useEffect, useMemo, useState } from "react";
import {
  adminListOrders,
  adminUpdateOrderStatus,
  adminRefundOrder,
  adminDecideRR,
  adminCompleteRR,
} from "../api/orders";
import { useNavigate } from "react-router-dom";

const STATUSES = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const FINAL_STATUSES = ["CANCELLED", "RETURNED", "REPLACED"];

const isFinal = (o) => FINAL_STATUSES.includes(o.status);

export default function Orders() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  // per-order loading (so buttons show "Working..." only for that order)
  const [busyId, setBusyId] = useState(null);

  const fetchAll = async () => {
    setErr("");
    setNotice("");
    setLoading(true);
    try {
      const res = await adminListOrders();
      setItems(res.data.orders || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const changeStatus = async (orderId, status) => {
    setErr("");
    setNotice("");
    setBusyId(orderId);
    try {
      await adminUpdateOrderStatus(orderId, {
        status,
        note: `Set to ${status}`,
      });
      setNotice("Order status updated");
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const handleRefund = async (orderId) => {
    setErr("");
    setNotice("");
    setBusyId(orderId);
    try {
      await adminRefundOrder(orderId);
      setNotice("Refund processed");
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to refund");
    } finally {
      setBusyId(null);
    }
  };

  const handleRRDecision = async (orderId, action) => {
    setErr("");
    setNotice("");
    setBusyId(orderId);
    try {
      await adminDecideRR(orderId, {
        action, // "APPROVE" | "REJECT"
        adminNote:
          action === "APPROVE" ? "Approved by admin" : "Rejected by admin",
      });
      setNotice(`RR ${action === "APPROVE" ? "approved" : "rejected"}`);
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to decide RR");
    } finally {
      setBusyId(null);
    }
  };

  const handleRRComplete = async (orderId) => {
    setErr("");
    setNotice("");
    setBusyId(orderId);
    try {
      await adminCompleteRR(orderId, {
        adminNote: "Completed by admin",
      });
      setNotice("RR completed");
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to complete RR");
    } finally {
      setBusyId(null);
    }
  };

  const rrBadge = (o) => {
    const rr = o.returnRequest;
    if (!rr || rr.status === "NONE") return null;

    const txt = `${rr.type} • ${rr.status}`;
    const cls =
      rr.status === "REQUESTED"
        ? "bg-yellow-50 text-yellow-800 border-yellow-200"
        : rr.status === "APPROVED"
        ? "bg-blue-50 text-blue-800 border-blue-200"
        : rr.status === "REJECTED"
        ? "bg-red-50 text-red-800 border-red-200"
        : "bg-green-50 text-green-800 border-green-200";

    return (
      <span
        className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-lg border ${cls}`}
      >
        {txt}
      </span>
    );
  };

  const canShowRR = (o) =>
    o.returnRequest &&
    o.returnRequest.status &&
    o.returnRequest.status !== "NONE";

  const canApproveReject = (o) => o.returnRequest?.status === "REQUESTED";

  const canCompleteRR = (o) => o.returnRequest?.status === "APPROVED";

  const canRefund = (o) => {
    // ❌ Never refund replacement orders
    if (o.isReplacement) return false;
    if (o.payment?.method === "REPLACEMENT") return false;

    const paid = o.payment?.status === "PAID";
    const refundableStatus = ["CANCELLED", "RETURNED"].includes(o.status);

    return paid && refundableStatus;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders</h2>
        <button
          onClick={fetchAll}
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {(err || notice) && (
        <div
          className={`rounded-xl p-3 ${
            err ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {err || notice}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">All Orders</h3>
          <p className="text-sm text-gray-500">Total: {items.length}</p>
        </div>

        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-600">No orders yet.</div>
        ) : (
          <div className="divide-y">
            {items.map((o) => (
              <div id={`order-${o._id}`} key={o._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      Order #{o._id.slice(-6).toUpperCase()}
                      {o.isReplacement && (
                        <span className="text-xs px-2 py-1 rounded-lg border bg-purple-50 text-purple-700">
                          Replacement
                        </span>
                      )}
                      {rrBadge(o)}
                    </div>

                    <div className="text-sm text-gray-600">
                      Customer: {o.userId?.name || "—"} (
                      {o.userId?.email || "—"})
                    </div>

                    <div className="text-sm text-gray-600">
                      Total: ₹{o.totalAmount} • Payment: {o.payment?.method} (
                      {o.payment?.status})
                    </div>

                    {o.isReplacement && o.parentOrderId && (
                      <div className="text-xs text-gray-500">
                        Parent Order:{" "}
                        {String(o.parentOrderId).slice(-6).toUpperCase()}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Placed: {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <div className="text-sm font-medium">Status</div>

                    {isFinal(o) ? (
                      <div className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-700 text-sm">
                        {o.status}
                      </div>
                    ) : (
                      <select
                        className="border rounded-lg p-2"
                        value={o.status}
                        disabled={busyId === o._id}
                        onChange={(e) => changeStatus(o._id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Refund */}
                      <button
                        onClick={() => handleRefund(o._id)}
                        disabled={busyId === o._id || !canRefund(o)}
                        className={`px-3 py-2 rounded-lg border text-sm ${
                          canRefund(o)
                            ? "bg-white hover:bg-gray-50"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                        title="Refund is allowed only when order is CANCELLED/RETURNED and payment is PAID"
                      >
                        {busyId === o._id ? "Working..." : "Refund"}
                      </button>

                      {o.isReplacement && o.parentOrderId && (
                        <button
                          onClick={() => {
                            const id = String(o.parentOrderId);
                            const el = document.getElementById(`order-${id}`);
                            if (el)
                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }}
                          className="px-3 py-2 rounded-lg border text-sm bg-purple-50 text-purple-700 hover:bg-purple-100"
                        >
                          View Parent Order
                        </button>
                      )}

                      {/* RR approve/reject */}
                      {canShowRR(o) && (
                        <>
                          <button
                            onClick={() => handleRRDecision(o._id, "APPROVE")}
                            disabled={busyId === o._id || !canApproveReject(o)}
                            className={`px-3 py-2 rounded-lg border text-sm ${
                              canApproveReject(o)
                                ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => handleRRDecision(o._id, "REJECT")}
                            disabled={busyId === o._id || !canApproveReject(o)}
                            className={`px-3 py-2 rounded-lg border text-sm ${
                              canApproveReject(o)
                                ? "bg-white hover:bg-gray-50"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => handleRRComplete(o._id)}
                            disabled={busyId === o._id || !canCompleteRR(o)}
                            className={`px-3 py-2 rounded-lg border text-sm ${
                              canCompleteRR(o)
                                ? "bg-green-600 text-white hover:bg-green-700 border-green-600"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            title="Completes RETURN (restock + refunds parent if replacement) or REPLACEMENT (creates replacement order)"
                          >
                            Complete RR
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">Items</div>
                  <ul className="list-disc ml-5">
                    {o.items?.map((it, idx) => (
                      <li key={idx}>
                        {it.titleSnapshot} — ₹{it.priceSnapshot} × {it.qty}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* RR Details */}
                {canShowRR(o) && (
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-1">Return/Replacement</div>
                    <div className="text-gray-600">
                      Type: <b>{o.returnRequest.type}</b> • Status:{" "}
                      <b>{o.returnRequest.status}</b>
                    </div>
                    {o.returnRequest.reason && (
                      <div className="text-gray-600">
                        Reason: {o.returnRequest.reason}
                      </div>
                    )}
                    {o.returnRequest.note && (
                      <div className="text-gray-600">
                        Customer note: {o.returnRequest.note}
                      </div>
                    )}
                    {o.returnRequest.adminNote && (
                      <div className="text-gray-600">
                        Admin note: {o.returnRequest.adminNote}
                      </div>
                    )}
                  </div>
                )}

                {/* Address */}
                {o.shippingAddress?.addressLine1 && (
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-1">Shipping</div>
                    <div className="text-gray-600">
                      {o.shippingAddress.name} • {o.shippingAddress.phone}
                    </div>
                    <div className="text-gray-600">
                      {o.shippingAddress.addressLine1}, {o.shippingAddress.city}
                      , {o.shippingAddress.state} - {o.shippingAddress.pincode}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
