export async function analyzeItems(items) {
  // const itemInfoObject = {
  //   title: item.title,
  //   description: item.description,
  //   imageUrls: item.imageUrls
  // }
  let analyzedItems;
  try {
    analyzedItems = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
  } catch (e) {
    throw new Error("REQUEST FAILED");
  }

  let responseData;
  try {
    responseData = await analyzedItems.json();
  } catch (e) {
    throw new Error("CAN'T PARSE RESPONSE");
  }

  if (!analyzedItems.ok) {
    throw new Error("BAD RESPONSE");
  }

  return responseData;
};