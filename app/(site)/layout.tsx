import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";
import AnnouncementPopup from "@/components/site/AnnouncementPopup";
import MaintenancePage from "@/components/site/MaintenancePage";
import { callerEmail } from "@/lib/roles";
import { getPopupPost, getSettings } from "@/lib/data";
import { getNavigation, publicNavigation } from "@/lib/navigation";

/**
 * Every public page reads its content from /data at request time, so an edit
 * saved in /admin is live on the next refresh.
 */
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, navigation, popup] = await Promise.all([getSettings(), getNavigation(), getPopupPost()]);

  // Maintenance Mode: visitors see only the holding page; signed-in staff
  // still see the real site so they can check their work.
  if (settings.maintenance.enabled && !(await callerEmail())) {
    return <MaintenancePage settings={settings} />;
  }
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Header settings={settings} nav={publicNavigation(navigation)} />
      <main id="content">{children}</main>
      <WhatsAppFloat />
      {popup && <AnnouncementPopup post={popup} />}
      <Footer settings={settings} />
    </>
  );
}
