// src/utils/formatMessage.jsx
// Pacer Command Center - Message Formatter
// JPG Ventures LLC
//
// IMPORTANT: Do not paste this through a word processor or rich text editor.
// The regex below must use straight quotes and literal asterisks.
// Smart quotes will kill the build.

export function formatMessage(text) {
  const lines = text.split("\n");
  const out = [];
  let k = 0;

  const parseBold = (str) =>
    str.split(/(\*\*[^*]+\*\*)/).map((chunk, j) =>
      chunk.startsWith("**") && chunk.endsWith("**")
        ? (
          <strong key={j} style={{ color: "var(--accent)", fontWeight: 600 }}>
            {chunk.slice(2, -2)}
          </strong>
        )
        : chunk
    );

  for (const line of lines) {
    if (!line.trim()) {
      out.push(<div key={k++} style={{ height: 6 }} />);
      continue;
    }

    if (/^\[(OPS|CREATIVE|CLAW)\]/.test(line.trim())) continue;

    if (/^[*-] /.test(line)) {
      out.push(
        <div key={k++} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2, fontSize: "0.7rem" }}>
            &#9658;
          </span>
          <span>{parseBold(line.replace(/^[*-] /, ""))}</span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      out.push(
        <div key={k++} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: "var(--primary)", flexShrink: 0, minWidth: 20, fontWeight: 700 }}>
            {num}.
          </span>
          <span>{parseBold(line.replace(/^\d+\. /, ""))}</span>
        </div>
      );
    } else {
      out.push(<p key={k++} style={{ marginBottom: 5 }}>{parseBold(line)}</p>);
    }
  }

  return out;
}
