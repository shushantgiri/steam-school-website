"use client";
import { useEffect, useState } from "react";
import { ButtonLink, Button } from "@/components/ui/Button";

const DEFAULTS = { serverTitle: "Something Went Wrong", serverText: "We're having a little trouble right now. Please try again later." };

/** Friendly page for unexpected errors — wording from Admin → Settings → Error Pages. */
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  const [text, setText] = useState(DEFAULTS);
  useEffect(() => {
    fetch("/api/settings/public", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s?.errorPages && setText({ serverTitle: s.errorPages.serverTitle, serverText: s.errorPages.serverText }))
      .catch(() => undefined);
  }, []);
  return (
    <div className="grid min-h-svh place-items-center bg-paper px-5 text-center">
      <div>
        <p className="eyebrow justify-center">Oops</p>
        <h1 className="display mt-4 text-4xl sm:text-5xl">{text.serverTitle}</h1>
        <p className="mx-auto mt-4 max-w-md text-slate2">{text.serverText}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>
          <ButtonLink href="/" variant="outline">Back to Home</ButtonLink>
        </div>
      </div>
    </div>
  );
}
