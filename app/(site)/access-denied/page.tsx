import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Access Denied", robots: { index: false } };

/** 403 — shown when someone opens a page they are not allowed to see. */
export default async function AccessDeniedPage() {
  const { errorPages } = await getSettings();
  return (
    <div className="grid min-h-[70svh] place-items-center px-5 pt-20 text-center">
      <div>
        <p className="eyebrow justify-center">Error 403</p>
        <h1 className="display mt-4 text-4xl sm:text-5xl">{errorPages.forbiddenTitle}</h1>
        <p className="mx-auto mt-4 max-w-md text-slate2">{errorPages.forbiddenText}</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Back to Home</ButtonLink>
          <ButtonLink href="/admin/login" variant="outline">Sign In</ButtonLink>
        </div>
      </div>
    </div>
  );
}
