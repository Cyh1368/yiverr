import { categoryMeta } from "@/lib/constants";
import { cx } from "@/lib/format";

export function CategoryArt({
  category,
  className,
  emojiClassName = "text-5xl",
}: {
  category: string;
  className?: string;
  emojiClassName?: string;
}) {
  const meta = categoryMeta(category);
  return (
    <div
      className={cx("flex items-center justify-center", className)}
      style={{ background: `linear-gradient(145deg, ${meta.from}, ${meta.to})` }}
    >
      <span className={emojiClassName} aria-hidden>
        {meta.emoji}
      </span>
    </div>
  );
}

export function CollegeBadge({ college }: { college: string }) {
  if (!college) return null;
  const short = college.replace(/ College$/, "");
  return (
    <span className="inline-flex items-center rounded-full bg-yale-soft px-2 py-0.5 text-xs font-medium text-yale">
      {short}
    </span>
  );
}
