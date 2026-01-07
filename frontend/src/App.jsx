import { useMemo, useState } from "react";

const API = "http://localhost:8080/api";

function formatNum(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(n);
}

function pct(n) {
  return `${(n * 100).toFixed(0)}%`;
}

export default function App() {
  const [playerId, setPlayerId] = useState("");
  const [balance, setBalance] = useState(null);
  const [bet, setBet] = useState(10);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // {type:'success'|'error'|'info', msg:string}
  const [history, setHistory] = useState([]); // newest first
  const [stats, setStats] = useState({ spins: 0, wins: 0 });

  const canSpin = useMemo(() => {
    const b = Number(bet);
    return !!playerId && Number.isFinite(b) && b >= 1 && (balance ?? 0) >= b && !busy;
  }, [playerId, bet, balance, busy]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  };

  async function safeJson(res) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return { error: text || "Unexpected response" };
    }
  }

  async function createPlayer() {
    setBusy(true);
    try {
      const res = await fetch(`${API}/player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialBalance: 1000 }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to create player");

      setPlayerId(data.playerId);
      setBalance(data.balance);
      setHistory([]);
      setStats({ spins: 0, wins: 0 });
      showToast("success", "Player created (1000 coins).");
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshBalance() {
    if (!playerId) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/balance/${playerId}`);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to fetch balance");
      setBalance(data.balance);
      showToast("info", "Balance refreshed.");
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function spin() {
    if (!canSpin) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, bet: Number(bet) }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Spin failed");

      setBalance(data.newBalance);

      const won = (data.win || 0) > 0;
      setStats((s) => ({
        spins: s.spins + 1,
        wins: s.wins + (won ? 1 : 0),
      }));

      setHistory((h) => {
        const entry = {
          ts: new Date().toISOString(),
          bet: data.bet,
          win: data.win,
          newBalance: data.newBalance,
        };
        return [entry, ...h].slice(0, 10);
      });

      showToast(won ? "success" : "info", won ? `You won ${data.win}!` : "No win this time.");
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyPlayerId() {
    if (!playerId) return;
    try {
      await navigator.clipboard.writeText(playerId);
      showToast("success", "Player ID copied.");
    } catch {
      showToast("error", "Could not copy. Select and copy manually.");
    }
  }

  const winRate = stats.spins ? stats.wins / stats.spins : 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Event-Driven Spin Game</div>
          <div style={styles.subtitle}>
            Java 17 + Spring Boot + Kafka events + H2 • React UI
          </div>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.primaryBtn} onClick={createPlayer} disabled={busy}>
            {busy ? "Working…" : "Create Player"}
          </button>
          <button style={styles.btn} onClick={refreshBalance} disabled={!playerId || busy}>
            Refresh
          </button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === "success"
              ? styles.toastSuccess
              : toast.type === "error"
              ? styles.toastError
              : styles.toastInfo),
          }}
        >
          <b style={{ marginRight: 8 }}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "i"}
          </b>
          <span>{toast.msg}</span>
        </div>
      )}

      <div style={styles.grid}>
        {/* Left: Player + Spin */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Player</div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <div style={styles.label}>Player ID</div>
              <div style={styles.monoBox}>
                <span style={styles.monoText}>{playerId || "Create a player to start."}</span>
              </div>
            </div>
            <button style={styles.btn} onClick={copyPlayerId} disabled={!playerId || busy}>
              Copy
            </button>
          </div>

          <div style={styles.statsRow}>
            <Stat label="Balance" value={formatNum(balance)} />
            <Stat label="Spins" value={formatNum(stats.spins)} />
            <Stat label="Win rate" value={stats.spins ? pct(winRate) : "—"} />
          </div>

          <div style={styles.divider} />

          <div style={styles.cardTitle}>Spin</div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <div style={styles.label}>Bet amount</div>
              <input
                style={styles.input}
                type="number"
                min={1}
                step={1}
                value={bet}
                disabled={!playerId || busy}
                onChange={(e) => setBet(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") spin();
                }}
              />
              <div style={styles.hint}>
                Tip: Try bets like 10 / 25 / 50. Press Enter to spin.
              </div>
            </div>

            <button style={styles.spinBtn} onClick={spin} disabled={!canSpin}>
              {busy ? "Spinning…" : "Spin"}
            </button>
          </div>

          {!playerId && (
            <div style={styles.emptyNote}>
              Create a player first. The app will start with 1000 demo coins.
            </div>
          )}

          {playerId && balance !== null && Number(bet) > (balance ?? 0) && (
            <div style={styles.warn}>
              Your bet is higher than your balance. Reduce the bet or refresh balance.
            </div>
          )}
        </div>

        {/* Right: History */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Recent Spins</div>
          {history.length === 0 ? (
            <div style={styles.emptyState}>No spins yet. Click “Spin” to generate events.</div>
          ) : (
            <div style={styles.table}>
              <div style={{ ...styles.trRow, ...styles.trHead }}>
                <div>Time</div>
                <div style={{ textAlign: "right" }}>Bet</div>
                <div style={{ textAlign: "right" }}>Win</div>
                <div style={{ textAlign: "right" }}>Balance</div>
              </div>
              {history.map((h, idx) => (
                <div key={idx} style={styles.trRow}>
                  <div style={styles.small}>
                    {new Date(h.ts).toLocaleTimeString()}
                  </div>
                  <div style={{ textAlign: "right" }}>{formatNum(h.bet)}</div>
                  <div
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: h.win > 0 ? "#0a7a3d" : "#444",
                    }}
                  >
                    {formatNum(h.win)}
                  </div>
                  <div style={{ textAlign: "right" }}>{formatNum(h.newBalance)}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, ...styles.small }}>
            Backend publishes <code>SPIN_COMPLETED</code> to <code>spin-events</code>. Kafka consumer logs
            the event, proving end-to-end flow.
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <span style={styles.small}>
          Upcoming Improvements -: Adding Prometheus + Grafana, and show metrics from <code>/actuator/metrics</code>.
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1920,
    margin: "28px auto",
    padding: "0 16px 40px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    color: "#111",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: 800, letterSpacing: -0.2 },
  subtitle: { marginTop: 4, color: "#555", fontSize: 13 },
  headerActions: { display: "flex", gap: 10, alignItems: "center" },

  toast: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    margin: "10px 0 18px",
    boxShadow: "0 1px 10px rgba(0,0,0,0.05)",
  },
  toastSuccess: { background: "#ecfdf3", borderColor: "#b7f0cd" },
  toastError: { background: "#fff1f2", borderColor: "#fecdd3" },
  toastInfo: { background: "#eff6ff", borderColor: "#bfdbfe" },

  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 14,
  },

  card: {
    background: "#fff",
    border: "1px solid #e6e6e6",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 1px 18px rgba(0,0,0,0.04)",
  },
  cardTitle: { fontWeight: 800, marginBottom: 10 },

  row: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  label: { fontSize: 12, color: "#666", marginBottom: 6 },
  hint: { fontSize: 12, color: "#666", marginTop: 8 },

  monoBox: {
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    padding: "10px 12px",
    background: "#fafafa",
    minHeight: 42,
    display: "flex",
    alignItems: "center",
  },
  monoText: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 },

  input: {
    width: "80%",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },

  btn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryBtn: {
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 800,
  },
  spinBtn: {
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 900,
    minWidth: 120,
    height: 44,
    alignSelf: "end",
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 12,
  },
  stat: {
    border: "1px solid #eaeaea",
    borderRadius: 14,
    padding: 12,
    background: "#fcfcfc",
  },
  statLabel: { fontSize: 12, color: "#666" },
  statValue: { marginTop: 6, fontSize: 18, fontWeight: 900 },

  divider: { height: 1, background: "#eee", margin: "14px 0" },

  table: { display: "grid", gap: 6, marginTop: 8 },
  trRow: {
    display: "grid",
    gridTemplateColumns: "1fr 0.6fr 0.6fr 0.8fr",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid #eee",
    background: "#fff",
  },
  trHead: {
    background: "#fafafa",
    fontWeight: 800,
    color: "#333",
    borderColor: "#e8e8e8",
  },

  emptyState: { color: "#666", fontSize: 13, padding: "12px 0" },
  emptyNote: { marginTop: 12, color: "#666", fontSize: 13 },
  warn: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ffe4a3",
    background: "#fff7e6",
    color: "#7a5200",
    fontSize: 13,
    fontWeight: 700,
  },

  small: { fontSize: 12, color: "#666" },
  footer: { marginTop: 14, display: "flex", justifyContent: "space-between" },
};