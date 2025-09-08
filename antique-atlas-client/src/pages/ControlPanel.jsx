import { useState } from "react";
import { useForm } from "react-hook-form";
import { fetchPaginatedResultsHandler, handleItemSearchRequest } from "../functions/http";
import { createSearchCriteriaPayload } from "../functions/util";
import { CATEGORY_OPTIONS, FILTER_OPTIONS, MILES_OPTIONS, NUM_ITEMS_OPTIONS } from "../utils/mappings/hibidMappings";
import { defaultFormValues, TESTING_MODE } from "../utils/settings/settings";

export function ControlPanel({ setPage, setItems, setCursors, setTotalItems, setPageCount, setSearchId }) {
  const [resultsReady, setResultsReady] = useState(TESTING_MODE ? true : false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues
  } = useForm({
    defaultValues: defaultFormValues
  });

  const onSubmit = async (data) => {
    // console.log(data)
    const payload = createSearchCriteriaPayload(data);
    try {
      const data = await handleItemSearchRequest(payload);
      setItems(data.returnItems);
      setCursors(data.cursors);
      setSearchId(data.searchId);
      setPageCount(data.pageCount);
      setResultsReady(true);
    } catch (e) {
      console.log(e);
    }
  };

  async function viewResultsHandler() {
    if (TESTING_MODE) {
      const res = await fetchPaginatedResultsHandler({
        searchId: 119,
        prev: null,
        next: null,
        direction: ''
      }, 'cursor', null);
      console.log(res)
      setItems(res.returnItems);
      setCursors(res.cursors);
      setSearchId(res.searchId);
      setPageCount(res.pageCount);
      setPage('results');
      return
    };
    setPage('results');
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-screen max-w-6xl border-4 border-zinc-900 rounded-md p-4 bg-zinc-900"
    >
      {/* Row 1: Category / Sort / Filter */}
      <div>
        <div>
          <label htmlFor="category" className="mb-[5px] block font-bold text-yellow-100">Category</label>
          <select
            id="category"
            className="w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700 text-center"
            {...register("category", { required: "Pick a category" })}
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>}
        </div>

        <div className="mt-[20px]">
          <label htmlFor="filter" className="mb-1 block font-bold text-yellow-100">Filter</label>
          <select
            id="filter"
            className="text-center w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("filter")}
          >
            {
              FILTER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)
            }
          </select>
        </div>
      </div>

      {/* Row 2: Miles / ZIP / Search */}
      <div>
        <div className="mt-[20px]">
          <label htmlFor="miles" className="mb-1 block font-bold text-yellow-100">Miles</label>
          <select
            id="miles"
            className="text-center w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("miles", {
              validate: (value) => {
                const zip = getValues("zip");
                // if one is filled (not "any" or empty), the other must be filled too
                if (value > -1 && zip.length === 0) {
                  return "Miles and ZIP must both be provided";
                }
                return true;
              },
            })}
          >
            {MILES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.miles && <p className="mt-1 text-sm text-red-400">{errors.miles.message}</p>}
        </div>

        <div className="mt-[20px]">
          <label htmlFor="zip" className="mb-1 block font-bold text-yellow-100">ZIP</label>
          <input
            id="zip"
            inputMode="numeric"
            placeholder="e.g. 60601"
            className="text-center w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("zip", {
              pattern: {
                value: /^\d{5}(-\d{4})?$/,
                message: "Enter a valid US ZIP",
              },
              validate: (value) => {
                const miles = getValues("miles");
                if (value && miles < 0) {
                  return "Miles and ZIP must both be provided";
                }
                return true;
              },
            })}
          />
          {errors.zip && <p className="mt-1 text-sm text-red-400">{errors.zip.message}</p>}
        </div>

        <div className="mt-[20px]">
          <label htmlFor="searchText" className="mb-1 block font-bold text-yellow-100">Search text</label>
          <input
            id="searchText"
            placeholder="What are you looking for?"
            className="text-center w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("searchText")}
          />
        </div>
      </div>

      {/* Row 3: Number of items / Min profit / Min bid */}
      <div>
        <div className="mt-[20px]">
          <label htmlFor="numItems" className="mb-1 block font-bold text-yellow-100">Number of items</label>
          <select
            id="numItems"
            className="text-center w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("numItems")}
          >
            {NUM_ITEMS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="mt-[20px]">
          <label htmlFor="minProfit" className="mb-1 block font-bold text-yellow-100">Minimum ROI</label>
          <input
            id="minProfit"
            inputMode="decimal"
            placeholder="e.g. 25"
            className="text-center w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("minProfit", { validate: v => (v === "" || !isNaN(Number(v))) || "Enter a number" })}
          />
          {errors.minProfit && <p className="mt-1 text-sm text-red-400">{errors.minProfit.message}</p>}
        </div>

        <div className="mt-[20px]">
          <label htmlFor="budget" className="mb-1 block font-bold text-yellow-100">Budget</label>
          <input
            id="budget"
            inputMode="decimal"
            placeholder="e.g. 10"
            className="text-center w-3/4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("budget", { validate: v => (v === "" || !isNaN(Number(v))) || "Enter a number" })}
          />
          {errors.budget && <p className="mt-1 text-sm text-red-400">{errors.budget.message}</p>}
        </div>
      </div>

      {/* Row 4: Time remaining */}
      <div className="mt-[30px] flex flex-col">
        <span className="font-bold text-yellow-100">Min time remaining on auction</span>

        <span className="text-sm text-yellow-100 font-bold mt-[20px]">Days</span>
        <label>
          <input
            inputMode="numeric"
            placeholder="1"
            className="mt-2 w-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-center outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("timeRemainingDays", {
              required: "Required",
              validate: v =>
                (!isNaN(Number(v)) && Number(v) >= 0) || "Enter a non-negative number",
            })}
          />
        </label>

        <span className="text-sm text-yellow-100 font-bold mt-[20px]">Hours</span>
        <label>
          <input
            inputMode="numeric"
            placeholder="0"
            className="mt-2 w-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-center outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
            {...register("timeRemainingHours", {
              required: "Required",
              validate: v => {
                const n = Number(v);
                return (!isNaN(n) && n >= 0 && n <= 23) || "0–23 only";
              },
            })}
          />
        </label>

      </div>

      {/* Row 5: Radios */}
      <div className="flex flex-col items-center mt-5">
        <fieldset className="w-1/2 rounded-lg border border-zinc-700 p-4">
          <legend className="table mx-auto px-2 font-bold text-yellow-100">
            Shipping offered
          </legend>
          <div className="mt-2 flex items-center justify-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="true" className="h-4 w-4 border-zinc-700 text-zinc-200 focus:ring-zinc-600" {...register("shippingOffered", { required: true })} />
              <span className="text-sm">Yes</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="false" className="h-4 w-4 border-zinc-700 text-zinc-200 focus:ring-zinc-600" {...register("shippingOffered", { required: true })} />
              <span className="text-sm">No</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="w-1/2 mt-5 rounded-lg border border-zinc-700 p-4">
          <legend className="table mx-auto px-2 font-bold text-yellow-100">
            Display items before analyzing
          </legend>
          <div className="mt-2 flex items-center justify-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="true" className="h-4 w-4 border-zinc-700 text-zinc-200 focus:ring-zinc-600" {...register("displayItemsBeforeAnalyzing", { required: true })} />
              <span className="text-sm">Yes</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="false" className="h-4 w-4 border-zinc-700 text-zinc-200 focus:ring-zinc-600" {...register("displayItemsBeforeAnalyzing", { required: true })} />
              <span className="text-sm">No</span>
            </label>
          </div>
        </fieldset>
      </div>

      {/* Actions */}
      <div className="mt-[30px] flex justify-center">
        <div className="flex justify-center w-1/2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-900 disabled:opacity-60 mr-[20px]"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={() => viewResultsHandler()}
            disabled={!resultsReady}
            className={`w-full inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 font-bold text-white disabled:opacity-60 ml-[20px] mr-[20px] ${resultsReady ? 'hover:bg-red-900' : ''}`}
          >
            View Results
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-900 disabled:opacity-60 ml-[20px]"
          >
            {isSubmitting ? "Searching..." : "Find Items"}
          </button>
        </div>
      </div>
    </form>
  );
};