import { formatDateString } from '../functions/util.jsx';
import { LightboxGallery } from '../UI/LightboxGallery.jsx';

export function Item({
  bidCloseDateTime,
  bidCount,
  title,
  minBid,
  timeLeft,
  highBid,
  imageUrls,
  itemURL,
  description
}) {
  return (
    <article
      //   className={
      //     "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md "
      //   }
      //   onClick={onCardClick}
      //   role={onCardClick ? "button" : undefined}
      //   tabIndex={onCardClick ? 0 : undefined}
      className='bg-white mb-[30px] border rounded-md'
    >
      <div className="min-w-0 overflow-x-auto mt-[20px]">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 whitespace-nowrap">
            {title}
          </h3>
        )}
      </div>

      {/* Media */}
      <div className="p-3 sm:p-4">
        <LightboxGallery images={imageUrls} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 pt-0">
        {/* Heading row */}
        <div className="flex items-start justify-around gap-3">
          <div className="min-w-0 overflow-x-auto">
            {itemURL && (
              <a href={itemURL} target="_blank" rel="noopener noreferrer" className='font-semibold text-lg'>Hibid Link</a>
            )}
          </div>
          {minBid !== undefined && minBid !== null && (
            <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-1 text-center text-sm font-semibold text-slate-900">
              <p>Min Bid:</p>
              <p>
                {typeof minBid === "number" ? `$${minBid.toLocaleString()}` : minBid}
              </p>
            </div>
          )}
          {highBid !== undefined && highBid !== null && (
            <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-1 text-center text-sm font-semibold text-slate-900">
              <p>High Bid:</p>
              <p>
                {typeof highBid === "number" ? `$${highBid.toLocaleString()}` : highBid}
              </p>
            </div>
          )}
          {bidCount !== undefined && bidCount !== null && (
            <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-1 text-center text-sm font-semibold text-slate-900">
              <p>Bid Count:</p>
              <p>
                {typeof bidCount === "number" ? `${bidCount.toLocaleString()}` : bidCount}
              </p>
            </div>
          )}
          {bidCloseDateTime !== undefined && bidCloseDateTime !== null && (
            <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-1 text-center text-sm font-semibold text-slate-900">
              <p>Auction Deadline:</p>
              <p>
                {formatDateString(bidCloseDateTime)}
              </p>
            </div>
          )}
          {timeLeft !== undefined && timeLeft !== null && (
            <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-1 text-center text-sm font-semibold text-slate-900">
              <p>Time Remaining:</p>
              <p>
                {typeof timeLeft === "number" ? `$${timeLeft.toLocaleString()}` : timeLeft}
              </p>
            </div>
          )}
        </div>

        {/* {badges?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <span
                key={`${b.label}-${i}`}
                className={badgeToneClass(b.tone)}
              >
                {b.label}
              </span>
            ))}
          </div>
        )} */}

        {/* {attributes?.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {attributes.map((attr, i) => (
              <div key={`${attr.label}-${i}`} className="min-w-0">
                <dt className="truncate text-slate-500">{attr.label}</dt>
                <dd className="truncate font-medium text-slate-900">{attr.value}</dd>
              </div>
            ))}
          </dl>
        )} */}

        {description && (
          <p className="line-clamp-3 text-sm leading-6 text-slate-700">{description}</p>
        )}

        {/* {actions?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {actions.map((a, i) => (
              a.href ? (
                <a
                  key={`${a.label}-${i}`}
                  href={a.href}
                  className={buttonClass(a.variant)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {a.label}
                </a>
              ) : (
                <button
                  key={`${a.label}-${i}`}
                  type="button"
                  className={buttonClass(a.variant)}
                  onClick={(e) => {
                    e.stopPropagation();
                    a.onClick?.();
                  }}
                >
                  {a.label}
                </button>
              )
            ))}
          </div>
        )} */}

        {/* {footer && <div className="pt-2 text-sm text-slate-500">{footer}</div>} */}
      </div>
    </article>
  );
}

function badgeToneClass(tone = "slate") {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
  switch (tone) {
    case "indigo":
      return `${base} border-indigo-200 bg-indigo-50 text-indigo-700`;
    case "green":
      return `${base} border-green-200 bg-green-50 text-green-700`;
    case "rose":
      return `${base} border-rose-200 bg-rose-50 text-rose-700`;
    case "amber":
      return `${base} border-amber-200 bg-amber-50 text-amber-800`;
    default:
      return `${base} border-slate-200 bg-slate-50 text-slate-700`;
  }
}

function buttonClass(variant = "primary") {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  if (variant === "ghost") {
    return `${base} border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-300`;
  }
  return `${base} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-400`;
}