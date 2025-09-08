export const createHibidBulkSearchQueryVariablesObject = (category, miles, pageLength, pageNumber, searchText=null, zip=null, sortOrder=null) => {
  return {
    "auctionId": null,
    "category": category,    
    "countAsView": true,
    "countryName": null,
    "filter": "ALL",
    "hideGoogle": false,
    "isArchive": false,
    "miles": miles,
    "pageLength": pageLength,
    "pageNumber": pageNumber,
    "searchText": searchText,
    "shippingOffered": false,
    "sortOrder": sortOrder || 'NO_ORDER',
    "status": "OPEN",
    "zip": zip || '',
  };
};