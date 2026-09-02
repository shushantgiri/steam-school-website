const tones: Record<string, string> = {
  teal: "bg-teal-50 text-teal-700 border-teal-100",
  sun: "bg-sun-100 text-[#7a5a08] border-[#f3ddaa]",
  ink: "bg-ink text-white border-ink",
  gray: "bg-ivory text-slate2 border-mist",
  red: "bg-red-50 text-red-700 border-red-100",
  outline: "bg-transparent text-ink border-ink/20",
};

export default function Badge({
  tone = "gray",
  children,
  className = "",
}: {
  tone?: keyof typeof tones | string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${tones[tone] ?? tones.gray} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): string {
  switch (status) {
    case "Published": case "Accepted": case "Active": case "Replied": return "teal";
    case "Draft": case "Read": return "gray";
    case "Scheduled": case "Reviewing": case "New": case "Unread": return "sun";
    case "Expired": case "Rejected": case "Disabled": return "red";
    case "Waitlisted": case "Archived": return "outline";
    default: return "gray";
  }
}
