import { getSettings } from "@/lib/data";

/**
 * Floating WhatsApp button — the contact channel most Nepali families
 * actually use. The number comes from School Information in the CMS;
 * remove the phone there and the button disappears.
 */
export default async function WhatsAppFloat() {
  const settings = await getSettings();
  const phone = (settings.phone ?? "").replace(/[^\d]/g, "");
  if (phone.length < 8) return null;
  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent("Namaste! I have a question about The School of STEAM Education.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with the school on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden>
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4.2 28l6.3-2c1.7.9 3.6 1.4 5.5 1.4 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.6c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1.2 1.2-3.6-.3-.4a9.6 9.6 0 0 1-1.9-5.8C6 9.4 10.5 5 16 5s10 4.4 10 9.9-4.5 9.7-10 9.7zm5.5-7.3c-.3-.2-1.8-.9-2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 8.9 8.9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.5c0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.5-.3z" />
      </svg>
    </a>
  );
}
