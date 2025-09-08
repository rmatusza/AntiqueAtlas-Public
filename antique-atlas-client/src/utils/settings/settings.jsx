const MIN_PREDICTED_ITEM_VALUE = 1000;
const MAXIMUM_MIN_BID_AMOUNT = 2000
const MIN_AUCTION_TIME_REMAINING_MILLISECONDS = 24 * 60 * 60 * 1000;
export const defaultFormValues = {
    category: 700001,
    shippingOffered: "true",
    filter: "ALL",
    miles: -1,
    searchText: "",
    zip: "",
    displayItemsBeforeAnalyzing: "true",
    numItems: 1,
    minProfit: "",
    budget: "",
    timeRemainingDays: "1",
    timeRemainingHours: "0",
}

export const TESTING_MODE = false;