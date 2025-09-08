export function createSearchCriteriaPayload(data) {
  // console.log(data)
  return {
    ...data,
    pageLength: Number(data.numItems),
    minProfit: data.minProfit === "" ? null : Number(data.minProfit),
    budget: data.budget === "" ? null : Number(data.budget),
    timeRemainingDays: Number(data.timeRemainingDays),
    timeRemainingHours: Number(data.timeRemainingHours),
    miles: Number(data.miles),
    shippingOffered: Boolean(data.shippingOffered),
    displayItemsBeforeAnalyzing: Boolean(data.displayItemsBeforeAnalyzing),

  };
};

export function formatDateString(dateString) {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short"
  });
  return formatter.format(date);
}