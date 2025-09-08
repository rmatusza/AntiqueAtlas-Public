export const HIBID_ITEM_CATEGORIES =
{
    none: null,
    antiquesAndCollectibles: 700001
};

export const HIBID_SORT_ORDER =
{
    highToLow: 'BID_AMOUNT_HIGH_TO_LOW',
    lowToHigh: 'BID_AMOUNT_LOW_TO_HIGH',
    timeLeft: 'TIME_LEFT',
    bestMatch: 'NO_ORDER',
    none: 'NO_ORDER'
};

export const HIBID_FILTERS =
{
    all: 'ALL',
    onlineOnly: 'ONLINE',
    biddable: 'BIDDABLE',
    liveWebcast: 'WEBCAST',
    absentee: 'ABSENTEE',
    listing: 'LISTING'
};

export const CATEGORY_OPTIONS = [
    { value: 700001, label: "Antiques & Collectibles" },
    { value: "art", label: "Art" },
    { value: "books", label: "Books" },
    { value: "electronics", label: "Electronics" },
    { value: "fashion", label: "Fashion" },
];

export const FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "ONLINE", label: "Online Only Lots" },
    { value: "BIDDABLE", label: "Biddable Lots" },
    { value: "WEBCAST", label: "Live Webcase Lots" },
    { value: "ABSENTEE", label: "Absentee Lots" },
    { value: "LISTING", label: "Listing Only Lots" },
];
export const MILES_OPTIONS = [
    { value: -1, label: "Any" },
    { value: 25, label: "25 miles" },
    { value: 50, label: "50 miles" },
    { value: 100, label: "100 miles" },
    { value: 250, label: "250 miles" },
    { value: 500, label: "500 miles" },
];

export const NUM_ITEMS_OPTIONS = [1, 10, 20, 50, 100];