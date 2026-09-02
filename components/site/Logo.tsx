import Link from "next/link";

export default function Logo({
  dark = false,
  href = "/",
  /** Small line above the name — usually "The School of". */
  prefix = "The School of",
  name = "STEAM Education",
  /** Uploaded logo image (Settings → General, or Media Library → School logo). */
  src = "",
}: {
  dark?: boolean;
  href?: string;
  prefix?: string;
  name?: string;
  src?: string;
}) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3">
      {src ? (
        <span
          aria-hidden
          className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg ${dark ? "bg-white p-0.5" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-contain" />
        </span>
      ) : (
        <span
          aria-hidden
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${
            dark ? "bg-white text-ink" : "bg-ink text-white"
          }`}
        >
          {name.trim().charAt(0).toUpperCase() || "S"}<span className="text-sun-400">.</span>
        </span>
      )}
      <span className={`min-w-0 leading-tight ${dark ? "text-white" : "text-ink"}`}>
        {prefix && <span className="block text-[13px] font-semibold sm:text-sm">{prefix}</span>}
        <span className="block text-[13px] font-bold tracking-wide sm:text-sm">{name}</span>
      </span>
    </Link>
  );
}

/**
 * Splits the school name into the two logo lines, always keeping the FULL
 * name visible. "The School of STEAM Education Deukhuri, Dang" becomes
 * prefix "The School of" + name "STEAM Education Deukhuri, Dang"; a name
 * without that opening simply renders whole on the main line (wrapping is
 * allowed, nothing is cut off).
 */
export function logoLines(fullName: string, _shortName?: string) {
  const full = fullName.trim();
  const opener = "the school of ";
  if (full.toLowerCase().startsWith(opener)) {
    return { prefix: full.slice(0, opener.length).trim(), name: full.slice(opener.length).trim() };
  }
  return { prefix: "", name: full };
}
