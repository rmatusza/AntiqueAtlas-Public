import { useMemo, useState } from "react";

const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

function usePageRange(currentPage, pageCount, siblingCount) {
    return useMemo(() => {
        const totalNumbers = siblingCount * 2 + 5; // first, last, currentPage, 2*siblings, and 2 ellipses
        if (pageCount <= totalNumbers) {
            return Array.from({ length: pageCount }, (_, i) => i + 1);
        }

        const left = Math.max(2, currentPage - siblingCount);
        const right = Math.min(pageCount - 1, currentPage + siblingCount);

        const showLeftEllipsis = left > 2;
        const showRightEllipsis = right < pageCount - 1;

        const range = [1];

        if (showLeftEllipsis) {
            range.push("ellipsis");
        } else {
            for (let i = 2; i < left; i++) range.push(i);
        }

        for (let i = left; i <= right; i++) range.push(i);

        if (showRightEllipsis) {
            range.push("ellipsis");
        } else {
            for (let i = right + 1; i < pageCount; i++) range.push(i);
        }

        range.push(pageCount);
        return range;
    }, [currentPage, pageCount, siblingCount]);
};

export function PageBrowser({
    pageCount,
    handlePageChange,
    siblingCount = 1,
    className = "",
}) {

    const [currentPage, setCurrentPage] = useState(1);
    const page = clamp(currentPage, 1, Math.max(1, pageCount));
    const pages = usePageRange(page, pageCount, siblingCount);
    // const goTo = (p) => () => handlePageChange(clamp(p, 1, pageCount));

    function goTo(p, fetchType) {
        let direction = p > currentPage ? 'next' : 'prev';
        const pageNum = clamp(p, 1, pageCount);
        setCurrentPage(pageNum);
        handlePageChange(direction, fetchType, pageNum);
    }

    const Btn = ({ children, onClick, disabled, isCurrent }) => (
        <button
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            disabled={disabled}
            onClick={onClick}
            className={
                `inline-flex items-center justify-center select-none h-10 min-w-10 px-3 rounded-xl border` +
                `text-sm transition ` +
                `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ` +
                (disabled
                    ? `cursor-not-allowed opacity-50 border-gray-300 bg-white text-gray-400`
                    : isCurrent
                        ? `border-gray-900 bg-blue-500 text-white hover:bg-blue-900`
                        : `border-gray-300 bg-red-500 text-white hover:bg-red-900 active:bg-red-500`)
            }
        >
            {children}
        </button>
    );

    const IconChevronLeft = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M15.53 4.47a.75.75 0 0 1 0 1.06L9.06 12l6.47 6.47a.75.75 0 1 1-1.06 1.06l-7-7a.75.75 0 0 1 0-1.06l7-7a.75.75 0 0 1 1.06 0z" clipRule="evenodd" />
        </svg>
    );

    const IconChevronRight = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M8.47 19.53a.75.75 0 0 1 0-1.06L14.94 12 8.47 5.53a.75.75 0 1 1 1.06-1.06l7 7a.75.75 0 0 1 0 1.06l-7 7a.75.75 0 0 1-1.06 0z" clipRule="evenodd" />
        </svg>
    );

    return (
        <nav role="navigation" aria-label="Pagination" className={`flex items-center gap-2 ${className}`}>
            <Btn onClick={() => goTo(page - 1, 'cursor')} disabled={page <= 1}>
                <IconChevronLeft />
                <span className="ml-2 hidden sm:inline">Prev</span>
            </Btn>

            {/* Page list */}
            <ul className="flex items-center gap-2" aria-label="Page list">
                {
                    pages
                    &&
                    pages.map((p, idx) => (
                        <li key={`${p}-${idx}`}>
                            {p === "ellipsis" ? (
                                <span className="px-2 text-gray-500 select-none">…</span>
                            ) : (
                                <Btn label={`Go to page ${p}`} onClick={() => goTo(p)} isCurrent={p === page}>
                                    {p}
                                </Btn>
                            )}
                        </li>
                    ))
                }
            </ul>

            <Btn onClick={() => goTo(page + 1, 'cursor')} disabled={page >= pageCount}>
                <span className="mr-2 hidden sm:inline">Next</span>
                <IconChevronRight />
            </Btn>
        </nav>
    );
}