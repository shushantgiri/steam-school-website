"use client";
import SettingsShell, { Field, ImageField, TextArea } from "@/components/admin/SettingsShell";
import { Card } from "@/components/admin/ui";

/** Settings → General: the basic school information used across the website. */
export default function GeneralSettings() {
  return (
    <SettingsShell title="General Settings" lead="Basic information about the school, shown in the header, footer, contact page and documents.">
      {(s, set) => (
        <>
          <Card title="School identity">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="School name" value={s.name} onChange={(v) => set("name", v)} />
                <Field label="Short name" value={s.shortName} onChange={(v) => set("shortName", v)} help="Used where space is tight." />
              </div>
              <Field label="Tagline" value={s.tagline} onChange={(v) => set("tagline", v)} />
              <ImageField label="School logo" value={s.logoUrl} onChange={(v) => set("logoUrl", v)} help="Shown in the website header and footer, on the maintenance page and printed on marksheets. A square image works best." />
            </div>
          </Card>
          <Card title="Contact information">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone number" value={s.phone} onChange={(v) => set("phone", v)} />
                <Field label="Email address" value={s.email} onChange={(v) => set("email", v)} type="email" />
              </div>
              <Field label="Location (short)" value={s.location} onChange={(v) => set("location", v)} help="e.g. Deukhuri, Dang" />
              <TextArea label="Full address" value={s.address} onChange={(v) => set("address", v)} rows={2} />
              <TextArea label="Google Maps embed link" value={s.mapEmbed} onChange={(v) => set("mapEmbed", v)} rows={2} help="Optional. In Google Maps choose Share → Embed a map and paste the link inside src=&quot;…&quot;." />
            </div>
          </Card>
        </>
      )}
    </SettingsShell>
  );
}
