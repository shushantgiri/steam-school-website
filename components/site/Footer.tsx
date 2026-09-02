import Link from "next/link";
import Logo, { logoLines } from "./Logo";
import { Facebook, Instagram, Youtube } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

const cols = [
  { title: "School", links: [["About Us", "/about"], ["Teachers & Staff", "/teachers"], ["Academics", "/academics"], ["Student Life", "/student-life"], ["Gallery", "/gallery"]] },
  { title: "Information", links: [["News", "/news"], ["Notices", "/news#notices"], ["Events", "/events"], ["Examination Results", "/results"], ["Academic Calendar", "/calendar"]] },
  { title: "Admissions", links: [["Admission Process", "/admissions"], ["Apply Online", "/admissions/apply"], ["Frequently Asked Questions", "/admissions#faqs"], ["Contact Us", "/contact"]] },
];

export default function Footer({ settings }: { settings: SiteSettings }) {
  const { prefix, name } = logoLines(settings.name, settings.shortName);
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo dark prefix={prefix} name={name} src={settings.logoUrl} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">{settings.tagline}</p>
            <p className="mt-6 text-sm text-white/60">{settings.address}</p>
            <p className="mt-2 text-sm text-white/60">{settings.phone} · {settings.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{c.title}</h3>
                <ul className="mt-4 space-y-3">
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-white/80 transition-colors hover:text-teal-200">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Connect</h3>
              <ul className="mt-4 space-y-3">
                {[
                  ["Facebook", settings.social.facebook, Facebook],
                  ["Instagram", settings.social.instagram, Instagram],
                  ["YouTube", settings.social.youtube, Youtube],
                ].map(([label, href, Icon]: any) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-teal-200">
                      <Icon className="h-4 w-4" /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.name}, {settings.location}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Terms</Link>
            <Link href="/admin/login" className="hover:text-white">Staff Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
