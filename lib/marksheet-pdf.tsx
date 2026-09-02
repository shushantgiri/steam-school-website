import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { MarksheetView } from "./marksheet";

/**
 * The downloadable grade sheet — classic academic composition mirroring
 * components/results/MarksheetSheet.tsx. Serif (Times) for the school name
 * and title, Helvetica for everything else; vector rules, no decoration.
 */
const NAVY = "#12294a", TEAL = "#0f766e", RED = "#b91c1c", AMBER = "#92400e";
const RULE = "#cfd6df", SOFT = "#f4f6f9", INK = "#1f2937", MUTED = "#6b7280";
const B = "Helvetica-Bold", SERIF = "Times-Bold";

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 30, paddingHorizontal: 42, fontFamily: "Helvetica", fontSize: 9.5, color: INK },
  frameOuter: { position: "absolute", top: 17, left: 17, right: 17, bottom: 17, borderWidth: 1.1, borderColor: NAVY },
  frameInner: { position: "absolute", top: 20.7, left: 20.7, right: 20.7, bottom: 20.7, borderWidth: 0.4, borderColor: NAVY },
  watermark: { position: "absolute", left: 141.5, top: 265, width: 312, height: 312, opacity: 0.045 },
  sheetNo: { position: "absolute", right: 42, top: 38, alignItems: "flex-end" },
  school: { fontFamily: SERIF, fontSize: 18.5, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 7, textAlign: "center" },
  note: { fontSize: 8.5, fontFamily: B, color: TEAL, letterSpacing: 1.6, textTransform: "uppercase", marginTop: 5, textAlign: "center" },
  address: { fontSize: 8.2, color: MUTED, marginTop: 5, lineHeight: 1.5, textAlign: "center" },
  meta: { fontSize: 7, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginTop: 3, textAlign: "center" },
  doubleRule: { marginTop: 10, borderTopWidth: 1.2, borderBottomWidth: 0.4, borderColor: NAVY, height: 4 },
  titleRow: { marginTop: 11, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  titleLine: { width: 40, height: 0.5, backgroundColor: NAVY },
  title: { fontFamily: SERIF, fontSize: 16, letterSpacing: 4.5, color: NAVY, marginHorizontal: 12 },
  info: { marginTop: 12, flexDirection: "row", flexWrap: "wrap" },
  infoRow: { width: "50%", flexDirection: "row", alignItems: "baseline", paddingVertical: 5, paddingRight: 18, borderBottomWidth: 0.4, borderBottomColor: RULE, borderStyle: "dotted" },
  k: { width: 88, fontSize: 7.8, color: MUTED, letterSpacing: 0.3 },
  v: { flex: 1, fontSize: 9 },
  th: { paddingVertical: 7, paddingHorizontal: 7, color: "#fff", fontSize: 7.4, fontFamily: B, letterSpacing: 1.2, textTransform: "uppercase", textAlign: "center" },
  td: { paddingVertical: 6.2, paddingHorizontal: 7, textAlign: "center", borderBottomWidth: 0.4, borderBottomColor: RULE },
  band: { marginTop: 14, flexDirection: "row", alignItems: "center" },
  seal: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.6, borderColor: NAVY, alignItems: "center", justifyContent: "center", marginRight: 18 },
  sealRing: { position: "absolute", width: 78, height: 78, borderRadius: 39, borderWidth: 0.6, borderColor: RULE, left: -6.5, top: -6.5 },
  cells: { flex: 1, flexDirection: "row", borderWidth: 0.5, borderColor: RULE, borderRadius: 4, backgroundColor: SOFT, overflow: "hidden" },
  cellBox: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, alignItems: "center", borderLeftWidth: 0.5, borderLeftColor: RULE },
  cellK: { fontSize: 6.6, letterSpacing: 1.1, textTransform: "uppercase", color: MUTED },
  cellV: { fontSize: 13, fontFamily: B, marginTop: 3 },
  scale: { marginTop: 11, flexDirection: "row", flexWrap: "wrap", fontSize: 7, color: MUTED },
  sigs: { marginTop: 22, flexDirection: "row", justifyContent: "space-between" },
  sig: { width: 165, alignItems: "center" },
  sigImg: { height: 36, justifyContent: "flex-end", alignItems: "center" },
  sigLine: { width: "100%", borderTopWidth: 0.6, borderTopColor: INK, borderStyle: "dotted", marginTop: 4, paddingTop: 5, alignItems: "center" },
  footer: { position: "absolute", left: 42, right: 42, bottom: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 0.5, borderTopColor: NAVY, paddingTop: 7, fontSize: 7.5, color: MUTED },
});

const COLS = [
  { label: "S.N.", w: "8%" }, { label: "Subject", w: "36%", left: true }, { label: "Full\nMarks", w: "11%" },
  { label: "Pass\nMarks", w: "11%" }, { label: "Marks\nObtained", w: "13%" }, { label: "Grade", w: "10%" }, { label: "Grade\nPoint", w: "11%" },
];

function Signature({ title, name, image }: { title: string; name: string; image: string }) {
  return (
    <View style={s.sig}>
      <View style={s.sigImg}>{image ? <Image src={image} style={{ maxHeight: 42, maxWidth: 140, objectFit: "contain" }} /> : null}</View>
      <View style={s.sigLine}>
        <Text style={{ fontSize: 8.5, fontFamily: B, color: NAVY, letterSpacing: 0.4 }}>{title}</Text>
        {!!name && <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 1.5 }}>{name}</Text>}
      </View>
    </View>
  );
}

function Marksheet({ m }: { m: MarksheetView }) {
  const st = m.summary.status;
  const statusColor = st === "PASS" ? TEAL : st === "FAIL" ? RED : AMBER;
  const info: Array<[string, string]> = [
    ["Student's Name", m.student.name], ["Roll No.", m.student.rollNumber], ["Class", m.exam.klass], ["Section", m.exam.section],
    ["Academic Year", `${m.exam.academicYear} BS`], ["Examination", m.exam.examination],
    ["Date of Birth", m.student.dobAd ? `${m.student.dobBs}  ·  ${m.student.dobAd}` : m.student.dobBs],
    ...(m.attendance ? ([["Attendance", m.attendance]] as Array<[string, string]>) : []),
  ];
  const meta = [m.school.established && `Estd. ${m.school.established}`, m.school.registrationNo && `Reg. No. ${m.school.registrationNo}`].filter(Boolean).join("   ·   ");
  const showTeacher = m.signatures.mode === "both";
  const showPrincipal = m.signatures.mode !== "none";

  return (
    <Document title={`Grade Sheet - ${m.student.name}`} author={m.school.name} subject={`${m.exam.examination} ${m.exam.academicYear}`}>
      <Page size="A4" style={s.page}>
        <View style={s.frameOuter} fixed /><View style={s.frameInner} fixed />
        {!!m.school.logoUrl && <Image src={m.school.logoUrl} style={s.watermark} fixed />}
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 2 }}>
          {!!m.school.logoUrl && <Image src={m.school.logoUrl} style={{ width: 70, height: 70, objectFit: "contain", marginRight: 16 }} />}
          <View style={{ flex: 1 }}>
            <Text style={[s.school, { textAlign: "left", marginTop: 0 }]}>{m.school.name}</Text>
            {!!m.school.headerNote && <Text style={[s.note, { textAlign: "left" }]}>{m.school.headerNote}</Text>}
            <Text style={[s.address, { textAlign: "left" }]}>{m.school.address}{m.school.contact ? `\n${m.school.contact}` : ""}</Text>
            {!!meta && <Text style={[s.meta, { textAlign: "left" }]}>{meta}</Text>}
          </View>
        </View>

        <View style={s.doubleRule} />

        <View style={{ marginTop: 11, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 110 }} />
          <View style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={s.titleLine} /><Text style={s.title}>GRADE SHEET</Text><View style={s.titleLine} />
            </View>
            <Text style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>{m.exam.title}</Text>
          </View>
          <View style={{ width: 110, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 6.8, color: MUTED, letterSpacing: 1, textTransform: "uppercase" }}>Sheet No.</Text>
            <Text style={{ fontSize: 8.5, fontFamily: "Courier", marginTop: 2 }}>{m.serial}</Text>
          </View>
        </View>

        <View style={s.info}>
          {info.map(([k, v]) => (
            <View key={k} style={s.infoRow}>
              <Text style={s.k}>{k}</Text>
              <Text style={[s.v, k.startsWith("Student") ? { fontFamily: B, fontSize: 10.5 } : {}]}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", backgroundColor: NAVY }}>
            {COLS.map((c) => <Text key={c.label} style={[s.th, { width: c.w, textAlign: c.left ? "left" : "center" }]}>{c.label}</Text>)}
          </View>
          {m.rows.map((r, i) => (
            <View key={r.sn} style={{ flexDirection: "row", backgroundColor: i % 2 ? SOFT : "#fff" }}>
              <Text style={[s.td, { width: COLS[0].w, color: MUTED }]}>{r.sn}</Text>
              <Text style={[s.td, { width: COLS[1].w, textAlign: "left", fontFamily: B }]}>{r.subject}</Text>
              <Text style={[s.td, { width: COLS[2].w }]}>{r.fullMarks}</Text>
              <Text style={[s.td, { width: COLS[3].w }]}>{r.passMarks}</Text>
              <Text style={[s.td, { width: COLS[4].w, fontFamily: B, color: r.failed ? RED : INK }]}>{r.obtained}</Text>
              <Text style={[s.td, { width: COLS[5].w, fontFamily: B, color: r.failed ? RED : NAVY }]}>{r.grade}</Text>
              <Text style={[s.td, { width: COLS[6].w }]}>{r.point}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: NAVY }}>
            <Text style={[s.td, { width: "44%", textAlign: "right", fontFamily: B, borderBottomWidth: 0 }]}>Total</Text>
            <Text style={[s.td, { width: COLS[2].w, fontFamily: B, borderBottomWidth: 0 }]}>{m.summary.totalMarks}</Text>
            <Text style={[s.td, { width: COLS[3].w, color: MUTED, borderBottomWidth: 0 }]}>—</Text>
            <Text style={[s.td, { width: COLS[4].w, fontFamily: B, borderBottomWidth: 0 }]}>{m.summary.obtained}</Text>
            <Text style={[s.td, { width: COLS[5].w, fontFamily: B, color: NAVY, borderBottomWidth: 0 }]}>{m.summary.grade}</Text>
            <Text style={[s.td, { width: COLS[6].w, fontFamily: B, borderBottomWidth: 0 }]}>{m.summary.gpa}</Text>
          </View>
        </View>

        <View style={s.band}>
          <View style={s.seal}>
            <View style={s.sealRing} />
            <Text style={{ fontFamily: SERIF, fontSize: 18, color: NAVY }}>{m.summary.grade}</Text>
            <Text style={{ fontSize: 6, letterSpacing: 1, color: MUTED, marginTop: 2, textTransform: "uppercase" }}>Grade</Text>
          </View>
          <View style={s.cells}>
            {([
              ["Total Marks", String(m.summary.totalMarks), INK, ""],
              ["Marks Obtained", m.summary.obtained, INK, ""],
              ["Grade Point", m.summary.gpa, NAVY, m.summary.gradeLabel],
              ["Result", st, statusColor, ""],
            ] as Array<[string, string, string, string]>).map(([k, v, color, sub], i) => (
              <View key={k} style={[s.cellBox, i === 0 ? { borderLeftWidth: 0 } : {}]}>
                <Text style={s.cellK}>{k}</Text>
                <Text style={[s.cellV, { color, fontSize: i === 3 ? 11.5 : 13, letterSpacing: i === 3 ? 1.2 : 0 }]}>{v}</Text>
                {!!sub && <Text style={{ fontSize: 6.8, color: MUTED, marginTop: 1 }}>{sub}</Text>}
              </View>
            ))}
          </View>
        </View>

        {!!m.remarks && (
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 13, paddingVertical: 5, borderTopWidth: 0.4, borderBottomWidth: 0.4, borderColor: RULE }}>
            <Text style={{ fontSize: 7.8, color: MUTED, width: 88 }}>Remarks</Text>
            <Text style={{ fontSize: 9, flex: 1 }}>{m.remarks}</Text>
          </View>
        )}

        <View style={{ marginTop: 11, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ width: 68, fontSize: 7, fontFamily: B, color: NAVY, letterSpacing: 1.2 }}>GRADING</Text>
          {m.gradeScale.map((g) => (
            <View key={g.grade} style={{ flex: 1, alignItems: "center", borderLeftWidth: 0.4, borderLeftColor: RULE, paddingVertical: 2 }}>
              <Text style={{ fontSize: 7.6, fontFamily: B, color: INK }}>{g.grade} <Text style={{ fontFamily: "Helvetica", color: MUTED }}>· {g.point}</Text></Text>
              <Text style={{ fontSize: 6.8, color: MUTED, marginTop: 1 }}>{g.range}%</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 6.8, color: MUTED, marginTop: 3 }}>AB — Absent. A student passes on securing the pass marks in every subject.</Text>

        {showPrincipal && (
          <View style={[s.sigs, showTeacher ? {} : { justifyContent: "flex-end" }]}>
            {showTeacher && <Signature title="Class Teacher" name={m.signatures.classTeacher.name} image={m.signatures.classTeacher.image} />}
            <Signature title="Principal" name={m.signatures.principal.name} image={m.signatures.principal.image} />
          </View>
        )}

        <View style={s.footer} fixed>
          <Text><Text style={{ fontFamily: B, color: INK }}>Date of Issue: </Text>{m.issued.bs}{m.issued.ad ? `  ·  ${m.issued.ad}` : ""}</Text>
          {!!m.footerNote && <Text style={{ maxWidth: 320, textAlign: "right" }}>{m.footerNote}</Text>}
        </View>
      </Page>
    </Document>
  );
}

export async function renderMarksheetPdf(m: MarksheetView): Promise<Buffer> {
  return renderToBuffer(<Marksheet m={m} />);
}