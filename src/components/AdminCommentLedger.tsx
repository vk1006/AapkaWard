import { accentPanelClass, mutedTextClass } from "@/components/ui";

export interface AdminCommentEntry {
  id: string;
  body: string;
  createdAt: string | Date;
}

export function AdminCommentLedger({
  label,
  teamLabel,
  comments,
}: {
  label: string;
  teamLabel: string;
  comments: AdminCommentEntry[];
}) {
  if (comments.length === 0) return null;

  return (
    <div className={`mt-3 ${accentPanelClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
        {label}
      </p>
      <ol className="mt-2 space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="border-t border-orange-200/70 pt-3 first:border-t-0 first:pt-0 dark:border-stone-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                {teamLabel}
              </span>
              <time
                dateTime={new Date(comment.createdAt).toISOString()}
                className={`text-xs ${mutedTextClass}`}
              >
                {formatCommentDate(comment.createdAt)}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-stone-200">
              {comment.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatCommentDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
