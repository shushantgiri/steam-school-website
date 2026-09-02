import { ButtonLink } from "@/components/ui/Button";
import { getSettings } from "@/lib/data";

/** 404 — wording is managed in Admin → Settings → Error Pages. */
export default async function NotFound() {
  const { errorPages } = await getSettings();
  return (
    <div className="grid min-h-svh place-items-center bg-paper px-5 text-center">
      <div>
        <p className="eyebrow justify-center">Error 404</p>
        <h1 className="display mt-4 text-4xl sm:text-5xl">{errorPages.notFoundTitle}</h1>
        <p className="mx-auto mt-4 max-w-md text-slate2">{errorPages.notFoundText}</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Back to Home</ButtonLink>
          <ButtonLink href="/contact" variant="outline">Contact Us</ButtonLink>
        </div>
      </div>
    </div>
  );
}
