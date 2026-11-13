export function Loading({ text = "Loading…" }) {
  return <p style={{ color: "#8A8FA3", padding: "40px 0" }}>{text}</p>;
}

export function ErrorNote({ error, onRetry }) {
  return (
    <div style={{ padding: "40px 0" }}>
      <p style={{ color: "#E6435A", marginBottom: 14 }}>{error}</p>
      {onRetry && <button className="btn btn-ghost" onClick={onRetry}>Try again</button>}
    </div>
  );
}
