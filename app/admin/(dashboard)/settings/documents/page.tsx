"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SettingsShell, { Field, ImageField, Toggle } from "@/components/admin/SettingsShell";
import { Card } from "@/components/admin/ui";

/** Settings → Marksheets: branding, signatures and appearance of every marksheet. */
export default function MarksheetSettings() {
  return (
    <SettingsShell title="Marksheet Settings" lead="Everything printed on marksheets: school identity, signatures and layout. Changes apply to every marksheet generated from now on.">
      {(s, set) => {
        const ms = (patch: Partial<typeof s.marksheet>) => set("marksheet", { ...s.marksheet, ...patch });
        return (
          <>
            <Card title="School branding">
              <div className="space-y-4">
                <ImageField label="School logo" value={s.logoUrl} onChange={(v) => set("logoUrl", v)} help="Printed in the marksheet header (also used on the maintenance page). Leave blank to use the built-in school crest." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="School name" value={s.name} onChange={(v) => set("name", v)} />
                  <Field label="Phone number" value={s.phone} onChange={(v) => set("phone", v)} />
                </div>
                <Field label="Address" value={s.address} onChange={(v) => set("address", v)} help="These are the same values as General Settings — editing here updates them everywhere." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Established (e.g. 2065 BS)" value={s.establishedYear} onChange={(v) => set("establishedYear", v)} />
                  <Field label="Registration / affiliation number" value={s.registrationNo} onChange={(v) => set("registrationNo", v)} />
                </div>
              </div>
            </Card>

            <Card title="Signatures">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Principal's name" value={s.principalName} onChange={(v) => set("principalName", v)} help="Printed below the Principal's signature line, e.g. Mr. Ram Sharma" />
                  <Field label="Class Teacher's name" value={s.marksheet.classTeacherName} onChange={(v) => ms({ classTeacherName: v })} help="Printed below the Class Teacher's signature line." />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImageField label="Principal's signature" value={s.marksheet.principalSignature} onChange={(v) => ms({ principalSignature: v })} folder="signatures" help="A clear photo or scan of the signature on white paper. PNG with a transparent background looks best." />
                  <ImageField label="Class Teacher's signature" value={s.marksheet.classTeacherSignature} onChange={(v) => ms({ classTeacherSignature: v })} folder="signatures" />
                </div>
                <label className="block text-sm">
                  <span className="font-medium text-ink">Which signatures to print</span>
                  <select value={s.marksheet.signatures} onChange={(e) => ms({ signatures: e.target.value as typeof s.marksheet.signatures })}
                    className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600 sm:max-w-xs">
                    <option value="both">Class Teacher and Principal</option>
                    <option value="principal">Principal only</option>
                    <option value="none">No signature lines</option>
                  </select>
                </label>
              </div>
            </Card>

            <Card title="Appearance">
              <div className="space-y-4">
                <Toggle label="Show the school logo" checked={s.marksheet.showLogo} onChange={(v) => ms({ showLogo: v })} />
                <Field label="Header line (under the school name)" value={s.marksheet.headerNote} onChange={(v) => ms({ headerNote: v })} help="e.g. an affiliation or motto. Leave blank to use the school motto." />
                <Field label="School motto" value={s.motto} onChange={(v) => set("motto", v)} />
                <Field label="Footer note" value={s.marksheet.footerNote} onChange={(v) => ms({ footerNote: v })} help="Small line at the bottom of the sheet. Leave blank for none." />
              </div>
            </Card>

            <p className="text-sm text-slate2">
              To preview, open any student's marksheet from <Link href="/admin/results" className="font-medium text-teal-700 hover:underline">Examination Results <ArrowRight className="inline h-3.5 w-3.5" /></Link> after saving.
            </p>
          </>
        );
      }}
    </SettingsShell>
  );
}
