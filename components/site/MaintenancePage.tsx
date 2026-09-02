import Logo, { logoLines } from "@/components/site/Logo";
import type { SiteSettings } from "@/lib/types";

/** The holding page shown to visitors while Maintenance Mode is on. */
export default function MaintenancePage({ settings }: { settings: SiteSettings }) {
  const { prefix, name } = logoLines(settings.name, settings.shortName);
  const m = settings.maintenance;
  return (
    <main className="grid min-h-svh place-items-center bg-paper px-5 text-center">
      <div className="max-w-md">
        <div className="flex justify-center">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.name} className="h-16 w-auto" />
          ) : (
            <Logo prefix={prefix} name={name} href="#" />
          )}
        </div>
        <div className="mx-auto mt-10 flex justify-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-teal-600 motion-safe:animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
        <h1 className="display mt-6 text-4xl sm:text-5xl">{m.title}</h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-slate2">{m.message}</p>
        {m.showContact && (settings.phone || settings.email) && (
          <p className="mt-8 text-sm text-charcoal">
            {settings.phone && <a href={`tel:${settings.phone}`} className="hover:underline">{settings.phone}</a>}
            {settings.phone && settings.email && <span className="mx-2 text-mist">·</span>}
            {settings.email && <a href={`mailto:${settings.email}`} className="hover:underline">{settings.email}</a>}
          </p>
        )}
      </div>
    </main>
  );
}
