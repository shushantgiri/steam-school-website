"use client";
import SettingsShell, { Field, ImageField, TextArea } from "@/components/admin/SettingsShell";
import { Card } from "@/components/admin/ui";

/** Settings → SEO & Sharing: how the website appears in search results and when its link is shared. */
export default function SeoSettings() {
  return (
    <SettingsShell title="SEO & Sharing" lead="How the website appears on Google and when its link is shared on Facebook, Messenger or WhatsApp.">
      {(s, set) => {
        const seo = (patch: Partial<typeof s.seo>) => set("seo", { ...s.seo, ...patch });
        return (
          <>
            <Card title="Search engines">
              <div className="space-y-4">
                <Field label="Website title" value={s.seo.title} onChange={(v) => seo({ title: v })} help="Shown in the browser tab and in Google results. Keep it under 60 characters." />
                <TextArea label="Website description" value={s.seo.description} onChange={(v) => seo({ description: v })} help="One or two sentences shown under the title in Google results. Keep it under 160 characters." />
                <Field label="Keywords (optional)" value={s.seo.keywords} onChange={(v) => seo({ keywords: v })} help="Separate with commas, e.g. school in Dang, STEAM education, admissions." />
              </div>
            </Card>
            <Card title="Sharing preview">
              <div className="space-y-4">
                <p className="text-xs text-slate2">This is what people see when the website link is shared. Leave the title and description blank to reuse the ones above.</p>
                <ImageField label="Website sharing image" value={s.seo.shareImage} onChange={(v) => seo({ shareImage: v })} folder="homepage" help="Best size 1200 × 630 pixels (a wide photo of the school works well). Leave blank to use the built-in branded image." />
                <Field label="Sharing title (optional)" value={s.seo.shareTitle} onChange={(v) => seo({ shareTitle: v })} />
                <TextArea label="Sharing description (optional)" value={s.seo.shareDescription} onChange={(v) => seo({ shareDescription: v })} rows={2} />
              </div>
            </Card>
            <Card title="Browser icon">
              <ImageField label="Favicon" value={s.seo.faviconUrl} onChange={(v) => seo({ faviconUrl: v })} help="The small icon in the browser tab. Use a square PNG (at least 180 × 180). Leave blank to use the built-in icon." />
            </Card>
          </>
        );
      }}
    </SettingsShell>
  );
}
