export async function handleItemSearchRequest(data) {
  // console.log(data)
  const res = await fetch(`http://localhost:8080/hibid/search-for-items?displayDataBeforeAnalyzing=${data.displayItemsBeforeAnalyzing}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return await res.json();
};

export async function fetchPaginatedResultsHandler(data, fetchType, pageNum) {
  const res = await fetch(`http://localhost:8080/db/fetch-paginated-items?fetchType=${fetchType}&pageNum=${pageNum}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return await res.json();
};