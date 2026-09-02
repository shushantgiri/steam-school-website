import type { CSSProperties } from "react";
import type { MarksheetView } from "@/lib/marksheet";

/**
 * A4 grade sheet in a classic academic style: centred crest and serif school
 * name over a double rule, a form-style student block, an alternating-row
 * marks table, a result band with a grade seal, faint crest watermark,
 * dotted signature lines and a quiet footer. Metric sizing so print equals
 * screen; mirrored by lib/marksheet-pdf.tsx.
 */
const NAVY = "#12294a";
const TEAL = "#0f766e";
const RED = "#b91c1c";
const RULE = "#cfd6df";
const SOFT = "#f4f6f9";
const INK = "#1f2937";
const MUTED = "#6b7280";
const SERIF = "Georgia, 'Times New Roman', Times, serif";

export default function MarksheetSheet({ m }: { m: MarksheetView }) {
  const st = m.summary.status;
  const statusColor = st === "PASS" ? TEAL : st === "FAIL" ? RED : "#92400e";
  const info: Array<[string, string]> = [
    ["Student's Name", m.student.name], ["Roll No.", m.student.rollNumber],
    ["Class", m.exam.klass], ["Section", m.exam.section],
    ["Academic Year", `${m.exam.academicYear} BS`], ["Examination", m.exam.examination],
    ["Date of Birth", m.student.dobAd ? `${m.student.dobBs}  ·  ${m.student.dobAd}` : m.student.dobBs],
    ...(m.attendance ? ([["Attendance", m.attendance]] as Array<[string, string]>) : []),
  ];
  const sigs = m.signatures;
  const showTeacher = sigs.mode === "both";
  const showPrincipal = sigs.mode !== "none";
  const meta = [m.school.established && `Estd. ${m.school.established}`, m.school.registrationNo && `Reg. No. ${m.school.registrationNo}`].filter(Boolean).join("   ·   ");

  return (
    <div className="marksheet" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", background: "#fff", color: INK, fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif", position: "relative", boxSizing: "border-box", padding: "13mm 15mm 12mm", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Frame */}
      <div style={{ position: "absolute", inset: "6mm", border: `1.1pt solid ${NAVY}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "7.3mm", border: `0.4pt solid ${NAVY}`, pointerEvents: "none" }} />
      {/* Watermark */}
      {m.school.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.school.logoUrl} alt="" aria-hidden style={{ position: "absolute", left: "50%", top: "50%", width: "110mm", height: "110mm", transform: "translate(-50%, -50%)", objectFit: "contain", opacity: 0.045, pointerEvents: "none" }} />
      )}

      <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header — crest left, identity beside it */}
        <div style={{ display: "flex", alignItems: "center", gap: "6mm", paddingTop: "1mm" }}>
          {m.school.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.school.logoUrl} alt="" style={{ width: "25mm", height: "25mm", objectFit: "contain", flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontFamily: SERIF, fontSize: "20pt", fontWeight: 700, color: NAVY, letterSpacing: "0.03em", textTransform: "uppercase", lineHeight: 1.1 }}>{m.school.name}</div>
            {m.school.headerNote && <div style={{ fontSize: "8.2pt", color: TEAL, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "1.4mm" }}>{m.school.headerNote}</div>}
            <div style={{ fontSize: "8.2pt", color: MUTED, marginTop: "1.4mm", lineHeight: 1.5 }}>{m.school.address}{m.school.contact && <><br />{m.school.contact}</>}</div>
            {meta && <div style={{ fontSize: "7pt", color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "1mm" }}>{meta}</div>}
          </div>
        </div>

        {/* Double rule */}
        <div style={{ marginTop: "4.5mm", borderTop: `1.2pt solid ${NAVY}`, borderBottom: `0.4pt solid ${NAVY}`, height: "1.1mm" }} />

        {/* Title row — title centred, sheet number at the right */}
        <div style={{ marginTop: "5mm", display: "grid", gridTemplateColumns: "38mm 1fr 38mm", alignItems: "center" }}>
          <span />
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "4mm" }}>
              <span style={{ width: "14mm", height: "0.5pt", background: NAVY, display: "inline-block" }} />
              <span style={{ fontFamily: SERIF, fontSize: "16pt", fontWeight: 700, letterSpacing: "0.3em", color: NAVY }}>GRADE SHEET</span>
              <span style={{ width: "14mm", height: "0.5pt", background: NAVY, display: "inline-block" }} />
            </div>
            <div style={{ fontSize: "9pt", color: MUTED, marginTop: "1.5mm" }}>{m.exam.title}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7pt", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Sheet No.<br /><span style={{ fontFamily: "'Courier New', monospace", fontSize: "8.5pt", color: INK, letterSpacing: 0, textTransform: "none" }}>{m.serial}</span>
          </div>
        </div>

        {/* Student block — form style */}
        <div style={{ marginTop: "6mm", display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "12mm", rowGap: "0", fontSize: "9pt" }}>
          {info.map(([k, v]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "31mm 1fr", alignItems: "baseline", padding: "2mm 0", borderBottom: `0.4pt dotted ${RULE}` }}>
              <span style={{ color: MUTED, fontSize: "7.8pt", letterSpacing: "0.04em" }}>{k}</span>
              <span style={{ fontWeight: k.startsWith("Student") ? 700 : 500, fontSize: k.startsWith("Student") ? "10.5pt" : "9pt", color: INK }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Marks table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "7mm", fontSize: "9.5pt" }}>
          <thead>
            <tr>
              {["S.N.", "Subject", "Full Marks", "Pass Marks", "Marks Obtained", "Grade", "Grade Point"].map((h, i) => (
                <th key={h} style={{ padding: "3mm 2.5mm", textAlign: i === 1 ? "left" : "center", fontSize: "7.4pt", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: NAVY }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.rows.map((r, i) => (
              <tr key={r.sn} style={{ background: i % 2 ? SOFT : "#fff" }}>
                <td style={cell("center", 400, MUTED)}>{r.sn}</td>
                <td style={cell("left", 600)}>{r.subject}</td>
                <td style={cell("center")}>{r.fullMarks}</td>
                <td style={cell("center")}>{r.passMarks}</td>
                <td style={cell("center", 700, r.failed ? RED : INK)}>{r.obtained}</td>
                <td style={cell("center", 700, r.failed ? RED : NAVY)}>{r.grade}</td>
                <td style={cell("center")}>{r.point}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={{ ...cell("right", 700), borderTop: `1pt solid ${NAVY}`, borderBottom: `1pt solid ${NAVY}` }}>Total</td>
              <td style={{ ...cell("center", 700), borderTop: `1pt solid ${NAVY}`, borderBottom: `1pt solid ${NAVY}` }}>{m.summary.totalMarks}</td>
              <td style={{ ...cell("center", 400, MUTED), borderTop: `1pt solid ${NAVY}`, borderBottom: `1pt solid ${NAVY}` }}>—</td>
              <td style={{ ...cell("center", 700), borderTop: `1pt solid ${NAVY}`, borderBottom: `1pt solid ${NAVY}` }}>{m.summary.obtained}</td>
              <td style={{ ...cell("center", 700, NAVY), borderTop: `1pt solid ${NAVY}`, borderBottom: `1pt solid ${NAVY}` }}>{m.summary.grade}</td>
              <td style={{ ...cell("center", 700), borderTop: `1pt solid ${NAVY}`, borderBottom: `1pt solid ${NAVY}` }}>{m.summary.gpa}</td>
            </tr>
          </tbody>
        </table>

        {/* Result band with grade seal */}
        <div style={{ marginTop: "7mm", display: "grid", gridTemplateColumns: "24mm 1fr", gap: "6mm", alignItems: "center" }}>
          <div style={{ width: "24mm", height: "24mm", borderRadius: "50%", border: `1.6pt solid ${NAVY}`, display: "grid", placeItems: "center", background: "#fff", boxShadow: `0 0 0 1.5mm #fff, 0 0 0 1.9mm ${RULE}` }}>
            <div style={{ textAlign: "center", lineHeight: 1 }}>
              <div style={{ fontFamily: SERIF, fontSize: "17pt", fontWeight: 700, color: NAVY }}>{m.summary.grade}</div>
              <div style={{ fontSize: "6pt", letterSpacing: "0.1em", color: MUTED, marginTop: "1mm", textTransform: "uppercase" }}>Grade</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: `0.5pt solid ${RULE}`, borderRadius: "1.5mm", overflow: "hidden", background: SOFT }}>
            {[
              ["Total Marks", String(m.summary.totalMarks), INK],
              ["Marks Obtained", m.summary.obtained, INK],
              ["Grade Point", m.summary.gpa, NAVY],
              ["Result", st, statusColor],
            ].map(([k, v, color], i) => (
              <div key={String(k)} style={{ padding: "3.4mm 2mm", textAlign: "center", borderLeft: i ? `0.5pt solid ${RULE}` : "none" }}>
                <div style={{ fontSize: "6.6pt", letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}>{String(k)}</div>
                <div style={{ fontSize: i === 3 ? "11.5pt" : "13pt", fontWeight: 800, color: String(color), marginTop: "1.2mm", letterSpacing: i === 3 ? "0.1em" : 0 }}>{String(v)}</div>
                {i === 2 && <div style={{ fontSize: "6.8pt", color: MUTED, marginTop: "0.2mm" }}>{m.summary.gradeLabel}</div>}
              </div>
            ))}
          </div>
        </div>

        {m.remarks && (
          <div style={{ marginTop: "5mm", display: "grid", gridTemplateColumns: "31mm 1fr", alignItems: "baseline", padding: "2mm 0", borderTop: `0.4pt solid ${RULE}`, borderBottom: `0.4pt solid ${RULE}`, fontSize: "9pt" }}>
            <span style={{ color: MUTED, fontSize: "7.8pt", letterSpacing: "0.04em" }}>Remarks</span>
            <span style={{ fontWeight: 500 }}>{m.remarks}</span>
          </div>
        )}

        {/* Grading key — one even row */}
        <div style={{ marginTop: "4mm", display: "grid", gridTemplateColumns: "24mm repeat(8, 1fr)", alignItems: "center", fontSize: "7pt", color: MUTED }}>
          <span style={{ fontWeight: 700, color: NAVY, letterSpacing: "0.12em", textTransform: "uppercase" }}>Grading</span>
          {m.gradeScale.map((g) => (
            <span key={g.grade} style={{ textAlign: "center", borderLeft: `0.4pt solid ${RULE}`, padding: "0.8mm 0", lineHeight: 1.35 }}>
              <span style={{ display: "block", fontWeight: 700, color: INK, fontSize: "7.6pt" }}>{g.grade} <span style={{ fontWeight: 400, color: MUTED }}>· {g.point}</span></span>
              <span style={{ display: "block" }}>{g.range}%</span>
            </span>
          ))}
        </div>
        <div style={{ marginTop: "1.2mm", fontSize: "6.8pt", color: MUTED }}>AB — Absent. A student passes on securing the pass marks in every subject.</div>

        {/* Signatures */}
        {showPrincipal && (
          <div style={{ display: "grid", gridTemplateColumns: showTeacher ? "1fr 1fr" : "1fr", justifyItems: showTeacher ? "stretch" : "end", gap: "20mm", marginTop: "auto", paddingTop: "10mm" }}>
            {showTeacher && <SignatureBlock title="Class Teacher" name={sigs.classTeacher.name} image={sigs.classTeacher.image} />}
            <SignatureBlock title="Principal" name={sigs.principal.name} image={sigs.principal.image} />
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: showPrincipal ? "7mm" : "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "6mm", fontSize: "7.5pt", color: MUTED, borderTop: `0.5pt solid ${NAVY}`, paddingTop: "2.4mm" }}>
          <div><span style={{ fontWeight: 600, color: INK }}>Date of Issue:</span> {m.issued.bs}{m.issued.ad && `  ·  ${m.issued.ad}`}</div>
          {m.footerNote && <div style={{ textAlign: "right", maxWidth: "100mm" }}>{m.footerNote}</div>}
        </div>
      </div>
    </div>
  );
}

function SignatureBlock({ title, name, image }: { title: string; name: string; image: string }) {
  return (
    <div style={{ width: "58mm", textAlign: "center" }}>
      <div style={{ height: "15mm", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" style={{ maxHeight: "15mm", maxWidth: "50mm", objectFit: "contain" }} />
        )}
      </div>
      <div style={{ borderTop: `0.6pt dotted ${INK}`, marginTop: "1.5mm", paddingTop: "1.6mm", fontSize: "8.5pt", fontWeight: 700, color: NAVY, letterSpacing: "0.04em" }}>{title}</div>
      {name && <div style={{ fontSize: "8.5pt", color: MUTED, marginTop: "0.3mm" }}>{name}</div>}
    </div>
  );
}

function cell(align: "left" | "center" | "right", weight = 400, color: string = INK): CSSProperties {
  return { padding: "2.4mm 2.5mm", textAlign: align, fontWeight: weight, color, borderBottom: `0.4pt solid ${RULE}` };
}