"use client";
import { useState } from "react";
import { ImagePlus, Link2, MapPin, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/admin/Feedback";
import PhotoPickerDialog from "@/components/admin/PhotoPickerDialog";

/**
 * A photo slot inside any editor (News, Events, Teachers, Homepage, About…).
 * Shows the current photo and exactly where it appears; "Change Photo" opens
 * the shared Media Library dialog (select an existing photo or upload a new
 * one → preview → Use This Photo). One photo system, many easy entry points.
 */

export type ImagePickerProps = {
  label?: string;
  /** Current photo URL ("" = none / default). */
  value: string;
  onChange: (url: string) => void;
  /** Storage folder for new uploads. */
  folder: string;
  /** Plain-language location, e.g. "Homepage → Hero Section". */
  location: string;
  /** e.g. "1600 × 900 px". */
  recommended?: string;
  /** Preview shape — staff photos look best square. */
  shape?: "wide" | "square";
  emptyText?: string;
  removeLabel?: string;
  successMessage?: string;
};

export default function ImagePicker({
  label = "Photo",
  value,
  onChange,
  folder,
  location,
  recommended,
  shape = "wide",
  emptyText = "No photo yet",
  removeLabel = "Remove photo",
  successMessage = "Photo updated.",
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const frame =
    shape === "square"
      ? "relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-mist bg-ivory"
      : "relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-mist bg-ivory";

  return (
    <div className="text-sm">
      <span className="font-medium text-ink">{label}</span>

      {/* Where this photo appears — never a guess. */}
      <p className="mt-1 flex items-center gap-1.5 text-xs text-teal-800">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <span className="text-slate2">Appears on the website at:</span>{" "}
          <strong className="font-semibold">{location}</strong>
        </span>
      </p>

      <div className="mt-2 flex flex-wrap items-start gap-3">
        <div className={frame}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center px-2 text-center text-[11px] text-slate2">{emptyText}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
              {value ? <RefreshCw className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
              {value ? "Change Photo" : "Add Photo"}
            </Button>
            {value && (
              <Button
                type="button" size="sm" variant="ghost"
                className="!text-red-600 hover:!bg-red-50"
                onClick={() => { onChange(""); toast("Photo removed.", "info"); }}
              >
                <Trash2 className="h-4 w-4" /> {removeLabel}
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate2">
            {recommended && <>Best size: {recommended} · </>}JPG, PNG or WebP · smaller than 10 MB
          </p>
          <button
            type="button"
            onClick={() => setShowLink((s) => !s)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate2 underline underline-offset-2 hover:text-ink"
          >
            <Link2 className="h-3 w-3" /> {showLink ? "Hide link box" : "Or paste an image link"}
          </button>
          {showLink && (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://…"
              className="mt-1.5 h-10 w-full rounded-lg border border-mist bg-white px-3 text-xs focus:border-teal-600"
            />
          )}
        </div>
      </div>

      {open && (
        <PhotoPickerDialog
          location={location}
          folder={folder}
          recommended={recommended}
          onClose={() => setOpen(false)}
          onSelect={(url) => { onChange(url); toast(successMessage); }}
        />
      )}
    </div>
  );
}
