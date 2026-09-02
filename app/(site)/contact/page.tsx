import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from "lucide-react";
import { PageHero, Section } from "@/components/site/Section";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/site/ContactForm";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const rows = [
    { icon: MapPin, label: "Address", value: settings.address },
    { icon: Phone, label: "Phone", value: settings.phone },
    { icon: Mail, label: "Email", value: settings.email },
    { icon: Clock, label: "Opening hours", value: settings.hours },
  ];
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>Say <span className="mark">namaste</span></>}
        lead="Questions about admission, transport or anything else — call, write or visit us. We reply within one school day."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
          <Reveal>
            <ul className="space-y-6">
              {rows.map((r) => (
                <li key={r.label} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><r.icon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate2">{r.label}</p>
                    <p className="mt-1 text-[15px] font-medium text-ink">{r.value}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3">
              {[[Facebook, settings.social.facebook, "Facebook"], [Instagram, settings.social.instagram, "Instagram"], [Youtube, settings.social.youtube, "YouTube"]].map(([Icon, href, label]: any) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-mist bg-white text-ink transition-colors hover:border-teal-600 hover:text-teal-700">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="mt-8 overflow-hidden rounded-xl2 border border-mist">
              <iframe
                title={`Map to ${settings.name}, ${settings.location}`}
                src={settings.mapEmbed}
                className="h-64 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <ContactForm />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
