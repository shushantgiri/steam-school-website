"use client";
import SettingsShell, { Field, TextArea } from "@/components/admin/SettingsShell";
import { Card } from "@/components/admin/ui";

/** Settings → Error Pages: friendly wording visitors see when something goes wrong. */
export default function ErrorPageSettings() {
  return (
    <SettingsShell title="Error Pages" lead="The friendly messages visitors see when a page is missing or something goes wrong. Keep the language simple.">
      {(s, set) => {
        const e = (patch: Partial<typeof s.errorPages>) => set("errorPages", { ...s.errorPages, ...patch });
        return (
          <>
            <Card title="Page Not Found">
              <div className="space-y-4">
                <p className="text-xs text-slate2">Shown when someone opens a link that doesn't exist.</p>
                <Field label="Title" value={s.errorPages.notFoundTitle} onChange={(v) => e({ notFoundTitle: v })} />
                <TextArea label="Message" value={s.errorPages.notFoundText} onChange={(v) => e({ notFoundText: v })} rows={2} />
              </div>
            </Card>
            <Card title="Access Denied">
              <div className="space-y-4">
                <p className="text-xs text-slate2">Shown when someone tries to open a page they are not allowed to see.</p>
                <Field label="Title" value={s.errorPages.forbiddenTitle} onChange={(v) => e({ forbiddenTitle: v })} />
                <TextArea label="Message" value={s.errorPages.forbiddenText} onChange={(v) => e({ forbiddenText: v })} rows={2} />
              </div>
            </Card>
            <Card title="Something Went Wrong">
              <div className="space-y-4">
                <p className="text-xs text-slate2">Shown if the website hits an unexpected problem.</p>
                <Field label="Title" value={s.errorPages.serverTitle} onChange={(v) => e({ serverTitle: v })} />
                <TextArea label="Message" value={s.errorPages.serverText} onChange={(v) => e({ serverText: v })} rows={2} />
              </div>
            </Card>
          </>
        );
      }}
    </SettingsShell>
  );
}
