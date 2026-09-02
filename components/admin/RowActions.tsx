"use client";
import { useState } from "react";
import { MoreHorizontal, Pencil, Eye, Trash2 } from "lucide-react";

const iconCls = "grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-ink";

export default function RowActions({
  onDelete,
  onEdit,
  previewHref,
  label,
}: {
  onDelete?: () => void;
  onEdit?: () => void;
  /** Public URL for this row — opens the live page in a new tab. */
  previewHref?: string;
  label: string;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="inline-flex items-center gap-1">
      {confirm ? (
        <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-2 py-1">
          <span className="text-xs font-medium text-red-700">Delete?</span>
          <button onClick={() => { onDelete?.(); setConfirm(false); }} className="text-xs font-semibold text-red-700 underline">Yes</button>
          <button onClick={() => setConfirm(false)} className="text-xs text-slate2">No</button>
        </div>
      ) : (
        <>
          {previewHref ? (
            <a href={previewHref} target="_blank" rel="noreferrer" aria-label={`Preview ${label}`} className={iconCls}>
              <Eye className="h-4 w-4" />
            </a>
          ) : (
            <button aria-label={`Preview ${label}`} className={iconCls}><Eye className="h-4 w-4" /></button>
          )}
          <button aria-label={`Edit ${label}`} onClick={onEdit} className={iconCls}><Pencil className="h-4 w-4" /></button>
          <button aria-label={`Delete ${label}`} onClick={() => setConfirm(true)} className="grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </>
      )}
    </div>
  );
}
export { MoreHorizontal };
