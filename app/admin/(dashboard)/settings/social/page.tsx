"use client";
import SettingsShell, { Field } from "@/components/admin/SettingsShell";
import { Card } from "@/components/admin/ui";

/** Settings → Social Media: links shown in the footer and contact page. */
export default function SocialSettings() {
  return (
    <SettingsShell title="Social Media" lead="Links to the school's social media pages. Leave a field blank to hide that icon.">
      {(s, set) => {
        const social = (patch: Partial<typeof s.social>) => set("social", { ...s.social, ...patch });
        return (
          <Card title="Profiles">
            <div className="space-y-4">
              <Field label="Facebook page" value={s.social.facebook} onChange={(v) => social({ facebook: v })} help="e.g. https://facebook.com/yourschool" />
              <Field label="Instagram" value={s.social.instagram} onChange={(v) => social({ instagram: v })} />
              <Field label="YouTube channel" value={s.social.youtube} onChange={(v) => social({ youtube: v })} />
            </div>
          </Card>
        );
      }}
    </SettingsShell>
  );
}
