"use client";
import SettingsShell, { Field, TextArea, Toggle } from "@/components/admin/SettingsShell";
import { Card } from "@/components/admin/ui";

/** Settings → Maintenance Mode: hide the public website behind a holding page. */
export default function MaintenanceSettings() {
  return (
    <SettingsShell title="Website Maintenance Mode" lead="Turn this on while you make big changes. Visitors see only the holding page; signed-in staff can still see and manage the whole website." saveLabel="Save">
      {(s, set) => {
        const m = (patch: Partial<typeof s.maintenance>) => set("maintenance", { ...s.maintenance, ...patch });
        return (
          <>
            <Toggle label="Website Maintenance Mode" checked={s.maintenance.enabled} onChange={(v) => m({ enabled: v })}
              help={s.maintenance.enabled ? "ON — visitors currently see the holding page. Click Save to apply changes." : "OFF — the website is open to everyone."} />
            {s.maintenance.enabled && (
              <p className="rounded-xl2 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Remember to turn this off and Save when you're done — the public website stays hidden until then.
              </p>
            )}
            <Card title="Holding page">
              <div className="space-y-4">
                <Field label="Title" value={s.maintenance.title} onChange={(v) => m({ title: v })} />
                <TextArea label="Message" value={s.maintenance.message} onChange={(v) => m({ message: v })} rows={2} />
                <Toggle label="Show phone and email" checked={s.maintenance.showContact} onChange={(v) => m({ showContact: v })} help="Uses the contact details from General Settings." />
                <p className="text-xs text-slate2">The school logo from General Settings is shown at the top of the page.</p>
              </div>
            </Card>
          </>
        );
      }}
    </SettingsShell>
  );
}
