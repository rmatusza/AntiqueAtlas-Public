import { Item } from "../components/Item"
import { fetchPaginatedResultsHandler } from "../functions/http";
import { PageBrowser } from "../UI/PageBrowser";

export function Results({ items, setPage, setItems, setCursors, cursors, totalItems, pageCount, searchId }) {
  async function handlePageChange(direction, fetchType, pageNum) {
    const res = await fetchPaginatedResultsHandler({
      searchId,
      prev: cursors.prev,
      next: cursors.next,
      direction
    }, fetchType, pageNum);
    
    setItems(res.returnItems);
    setCursors(res.cursors);
  }

  return (
    <div className="flex gap-6 w-full bg-repeat">
      {/* Make sure none of the ancestors above this have overflow set */}
      <div className="sticky top-5 self-start z-10">
        <p className="text-lg font-bold p-4 mr-[20px] underline cursor-pointer text-red-500 hover:text-red-600" onClick={() => setPage('controlPanel')}>
          Home Page
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        {items.map((item) => {
          const image_urls = typeof item.image_urls === 'string' ? JSON.parse(item.image_urls) : item.image_urls
          const imageSet = image_urls.map((url) => ({ src: url, alt: "" }));
          return (
            <Item
              key={item.image_urls}
              bidCloseDateTime={item.bidCloseDateTime}
              bidCount={item.bidCount}
              title={item.title}
              minBid={item.minBid}
              timeLeft={item.timeLeft}
              highBid={item.highBid}
              imageUrls={imageSet}
              itemURL={item.item_url}
              description={item.description}
            />
          );
        })}
        <div className="flex justify-center">
          <PageBrowser handlePageChange={handlePageChange} pageCount={pageCount} />
        </div>
      </div>
    </div>
  )
};