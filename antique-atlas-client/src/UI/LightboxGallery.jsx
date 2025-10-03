import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * LightboxGallery
 *
 * Props:
 *  - images: Array<{ src: string; alt?: string }>
 *  - initialIndex?: number (which image is the featured one on page load)
 *  - className?: string (optional wrapper classes)
 *
 * Usage:
 *  <LightboxGallery
 *     images={[
 *       { src: "https://picsum.photos/id/1015/800/600", alt: "Mountain" },
 *       { src: "https://picsum.photos/id/1025/800/600", alt: "Dog" },
 *       { src: "https://picsum.photos/id/1003/800/600", alt: "Bridge" },
 *     ]}
 *  />
 */

export function LightboxGallery({ images = [], initialIndex = 0, className = "" }) {
  const [current, setCurrent] = useState(Math.min(Math.max(initialIndex, 0), Math.max(0, images.length - 1)));
  const [isOpen, setIsOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const hasImages = images && images.length > 0;

  // Derived URLs (avoid recreating arrays)
  const urls = useMemo(() => images.map((i) => ({ src: i.src, alt: i.alt || "Image" })), [images]);

  // Keyboard navigation when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, current]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const open = useCallback((idx) => {
    setCurrent(idx);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const clampIndex = useCallback(
    (idx) => {
      if (!hasImages) return 0;
      return (idx + images.length) % images.length; // wrap around
    },
    [images, hasImages]
  );

  const next = useCallback(() => setCurrent((i) => clampIndex(i + 1)), [clampIndex]);
  const prev = useCallback(() => setCurrent((i) => clampIndex(i - 1)), [clampIndex]);

  // Simple zoom toggle inside the modal
  const toggleZoom = useCallback(() => setIsZooming((z) => !z), []);

  if (!hasImages) {
    return (
      <div className={"text-center text-sm text-muted-foreground " + className}>
        No images to display.
      </div>
    );
  }

  return (
    <div className={"w-full " + className}>
      {/* Featured image */}
      <div className="relative">
        <button
          type="button"
          onClick={() => open(current)}
          className="group block w-full overflow-hidden rounded-2xl shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Open image viewer"
        >
          <img
            src={urls[current].src}
            alt={urls[current].alt}
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
          />
        </button>

        {/* Small inline controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/50 px-2 py-1 text-[11px] text-white backdrop-blur">
          <span className="rounded-full bg-white/20 px-2 py-0.5">{current + 1}</span>
          <span>/ {urls.length}</span>
        </div>
      </div>

      {/* Optional thumbnail strip */}
      {/* {urls.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {urls.map((u, idx) => (
            <button
              key={u.src + idx}
              type="button"
              onClick={() => setCurrent(idx)}
              className={
                "group relative overflow-hidden rounded-xl border " +
                (idx === current ? "border-indigo-500" : "border-transparent hover:border-white/40")
              }
              aria-label={`Show image ${idx + 1}`}
            >
              <img
                src={u.src}
                alt={u.alt}
                className="aspect-video w-full object-cover opacity-90 transition-all duration-200 group-hover:opacity-100"
                loading="lazy"
              />
              {idx === current && (
                <span className="pointer-events-none absolute inset-0 ring-2 ring-indigo-500 ring-offset-2"></span>
              )}
            </button>
          ))}
        </div>
      )} */}

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={close}
          />

          {/* Centered image container */}
          <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-6xl items-center justify-center">
            {/* Close button */}
            <button
              onClick={close}
              className="absolute -top-20 right-0 rounded-full bg-white/10 px-3 py-1 text-white shadow md:-top-14 md:right-0 md:px-4 md:py-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close viewer"
            >
              ✕ Close
            </button>

            {/* Prev arrow */}
            {urls.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow hover:bg-white/20 focus:outline-none focus:ring-2 focus:outline-offset-2 focus:ring-white/50"
                aria-label="Previous image"
              >
                ‹
              </button>
            )}

            {/* Image */}
            <div className="flex max-h-[90vh] w-3/4 items-center justify-center">
              <img
                src={urls[current].src}
                alt={urls[current].alt}
                className={
                  "max-h-[90vh] w-auto max-w-full select-none rounded-2xl shadow-2xl transition-transform duration-200 " +
                  (isZooming ? "scale-110 cursor-zoom-out" : "cursor-zoom-in")
                }
                onClick={toggleZoom}
                draggable={false}
              />
            </div>

            {/* Next arrow */}
            {urls.length > 1 && (
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow hover:bg-white/20 focus:outline-none focus:ring-2 focus:outline-offset-2 focus:ring-white/50"
                aria-label="Next image"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};