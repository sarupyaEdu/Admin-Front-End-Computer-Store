import { useEffect, useState } from "react";
import {
  adminListTickets,
  adminUpdateTicketStatus,
  adminAddTicketMessage,
} from "../api/support";

const STATUSES = ["open", "pending", "closed"];

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [activeId, setActiveId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  const fetchTickets = async () => {
    setErr("");
    setNotice("");
    setLoading(true);
    try {
      const res = await adminListTickets();
      setTickets(res.data.tickets || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const changeStatus = async (id, status) => {
    setErr("");
    setNotice("");
    setBusyId(id);
    try {
      await adminUpdateTicketStatus(id, { status });
      setNotice("Ticket status updated");
      await fetchTickets();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const sendReply = async (id) => {
    if (!replyText.trim()) return;
    setErr("");
    setNotice("");
    setBusyId(id);
    try {
      await adminAddTicketMessage(id, { text: replyText });
      setReplyText("");
      setNotice("Reply sent");
      await fetchTickets();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to send reply");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Support</h2>
            <p className="text-gray-600 text-sm">Admin support ticket inbox</p>
          </div>

          <button
            onClick={fetchTickets}
            disabled={loading || busyId !== null}
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
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
          <h3 className="font-semibold">Tickets ({tickets.length})</h3>
        </div>

        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : tickets.length === 0 ? (
          <div className="p-4 text-gray-600">No tickets yet.</div>
        ) : (
          <div className="divide-y">
            {tickets.map((t) => (
              <div key={t._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{t.subject}</div>
                    <div className="text-sm text-gray-600">
                      Customer: {t.userId?.name || "—"} (
                      {t.userId?.email || "—"})
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <select
                    className="border rounded-lg p-2 text-sm"
                    value={t.status}
                    disabled={busyId === t._id}
                    onChange={(e) => changeStatus(t._id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 text-sm">
                  {t.messages?.map((m, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg ${
                        m.senderRole === "admin" ? "bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      <b>{m.senderRole}:</b> {m.text}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    className="flex-1 border rounded-lg p-2 text-sm"
                    placeholder="Reply to customer..."
                    value={activeId === t._id ? replyText : ""}
                    onFocus={() => setActiveId(t._id)}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={busyId === t._id}
                  />
                  <button
                    onClick={() => sendReply(t._id)}
                    disabled={busyId === t._id}
                    className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
