import { createHash } from 'crypto';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


export async function createHibidVariablesObject_categorySearch(requestParameters) {
  const config = JSON.parse(
    await readFile(new URL('../settings/hibidQuerySettings.json', import.meta.url), 'utf-8')
  );

  const { minBid, minProfit, timeRemainingDays, timeRemainingHours } = requestParameters

  const {
    category,
    shippingOffered,
    filter,
    miles,
    searchText,
    zip,
    pageLength
  } = requestParameters

  const userCriteria = {
    minBid,
    minProfit,
    timeRemainingDays,
    timeRemainingHours
  }

  const hibidParameters = {
    category,
    shippingOffered,
    filter,
    miles,
    searchText,
    zip,
    pageLength,
    ...config
  }

  return [hibidParameters, userCriteria];
};

export const createHibidVariablesObject_singleItemSearch = (lotId, countAsView = true) => {
  return {
    countAsView,
    lotId
  }
}

// creates a url that mimics typing in a search term and pressing enter
export const createSearchTermURL = (description) => {
  const descriptionWords = description.split(' ');
  let queryParam = '';
  for (let i = 0; i < descriptionWords.length; i++) {
    let word = descriptionWords[i];
    if (i === descriptionWords.length - 1) {
      queryParam += word;
    }
    else {
      queryParam += word + '%20';
    }
  }

  return `https://hibid.com/lots?q=${queryParam}&status=OPEN`
};

// creates a url for a specific item - url you'd get if you clicked on an item - lot = id and itemName = lead after sluggifying via regex
// https://hibid.com/lot/255310167/--hard-cover-childrens-books?ref=lot-list
export const createHibidItemURL = (desc, lot) => {
  if (!desc || !lot) {
    return null;
  }

  const itemName = desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '-')  // Replace non-alphanumeric (except space) with '-'
    .replace(/\s/g, '-');          // Replace spaces with '-'

  return `https://hibid.com/lot/${lot}/${itemName}?ref=lot-list`;
};

export const prepareFullHibidResponseData = (fullData) => {
  const itemURL = createHibidItemURL(fullData?.lead, fullData?.id);
  return {
    image_urls: fullData?.imageUrls || [],
    hibid_id: fullData?.id,
    item_url: itemURL || '',
    lead: fullData?.lead,
    title: fullData.featuredPicture.description,
    description: fullData?.description,
    pictureCount: fullData?.pictureCount,
    shippingType: fullData?.auction.shippingType,
    id: fullData?.itemId,
    biddingIncrements: fullData?.auction.biddingIncrements,
    bidOpenDateTime: fullData?.auction.bidOpenDateTime,
    bidCloseDateTime: fullData?.auction.bidCloseDateTime,
    buyerPremium: fullData?.auction.buyerPremium,
    bidCount: fullData?.lotState.bidCount,
    buyNowPrice: fullData?.lotState.buyNow,
    highBid: fullData?.lotState.highBid,
    auctionClosed: fullData?.lotState.isClosed,
    minBid: fullData?.lotState.minBid,
    auctionStatus: fullData?.lotState.status,
    timeLeft: fullData?.lotState.timeLeft,
  };
};

export const saveItemImagesToFs = async (items) => {
  let index = 1;
  for (const item of items) {
    for (const url of item.imageUrls) {
      const imgBuffer = await fetchImageAsBuffer(url);
      await saveImageToFs(imgBuffer, item.title, `Image_${index}`);
      index++;
    }
  }
};

export const saveImageToFs = (fileBuffer, title, originalName) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return new Promise((resolve, reject) => {
    // const folderName = new Date().toISOString().slice(0, 10); // e.g. "2025-07-24"
    const folderName = title;
    const uploadDir = path.join(__dirname, '../images', folderName);

    // Create the directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) return reject(err);

      // const ext = path.extname(originalName);
      // const fileName = `img_${Date.now()}${ext}`;
      const fileName = `${originalName}.jpg`;
      const filePath = path.join(uploadDir, fileName);

      // Write the file
      fs.writeFile(filePath, fileBuffer, (err) => {
        if (err) return reject(err);
        resolve(filePath);
      });
    });
  });
};

export const fetchImageAsBuffer = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    console.log('FAILED TO FETCH IMAGE')
    throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export function formatItemReferencesForDb(items) {
  const formattedItemData = [];
  items.forEach(i => {
    formattedItemData.push({
      hibid_id: i.hibid_id,
      item_url: i.item_url,
      lead: i.lead,
      image_urls: JSON.stringify(i.image_urls),
    })
  });
  const cols = ['hibid_id', 'item_url', 'lead', 'image_urls'];
  const rows = formattedItemData.map(obj => cols.map(c => obj[c] ?? null));
  return rows;
}

// converts formatted hibid data into a form that is compatible with the db table it will be stored in
export function formatItemsForDb(items, searchId) {
  const preparedItems = [];
  items.forEach(i => {
    preparedItems.push({
      search_id: searchId,
      item_analysis: i.itemAnalysis ? JSON.stringify(i.itemAnalysis) : null,
      value_analysis: i.valueAnalysis ? JSON.stringify(i.valueAnalysis) : null,
      hibid_id: i.hibid_id
    });
  });
  const cols = ['search_id', 'item_analysis', 'hibid_id', 'value_analysis'];
  const rows = preparedItems.map(obj => cols.map(c => obj[c] ?? null));
  return rows;
};

export function formatFilteredDataForDb(items, hash) {
  const preparedItems = [];
  items.forEach(i => {
    preparedItems.push({
      hibid_id: i.hibid_id,
      search_profile_hash: hash
    });
  });
  const cols = ['hibid_id', 'search_profile_hash'];
  const rows = preparedItems.map(obj => cols.map(c => obj[c] ?? null));
  return rows;
}

export function filterFetchedItems(items, filteredIds, criteria) {
  const validItems = [];
  const invalidItems = [];

  items.forEach(item => {
    if (item.minBid <= (criteria.budget || 100000000000000)) {
      validItems.push(item);
    }
    else {
      invalidItems.push(item);
    }
  });

  return [validItems, invalidItems];
};

// prepares an object based on the formatted hibid data containing the essential search criteria fields to later be hashed into a unique string
export function createUnhashedSearchProfile(searchParams) {
  return {
    miles: searchParams.miles,
    zip: searchParams.zip,
    minProfit: searchParams.minProfit,
    budget: searchParams.budget,
    timeRemainingDays: searchParams.timeRemainingDays,
    timeRemainingHours: searchParams.timeRemainingHours,
  }
};

/**
 * Canonicalize and hash the search parameters.
 * @param {object} o
 * @returns {string} hex-encoded SHA-256
 */
export function hashSearchProfile(o) {
  const v = "v1"; // schema/version tag—bump if rules change

  // 1) Canonicalize fields ---------------------------------------------------
  // miles: integer; -1 may be a sentinel (we'll confirm below)
  const miles = canonInt(o.miles);

  // zip: keep as string; trim; uppercase; remove spaces; (zero-pad optional—see questions)
  const zip = canonZip(o.zip);

  // money fields: canonical decimal strings or "∅" for null
  const minProfit = canonMoney(o.minProfit);
  const budget = canonMoney(o.budget);

  // duration: prefer ISO-8601-like tag to avoid ambiguity: P{d}DT{h}H
  const days = canonInt(o.timeRemainingDays);
  const hours = canonInt(o.timeRemainingHours);
  const duration = `P${days}DT${hours}H`;

  // 2) Build ordered, type-tagged payload -----------------------------------
  // Include field names (and types) so position errors can’t collide
  const payload = [
    `v=${v}`,
    `miles:i=${miles}`,
    `zip:s=${zip}`,
    `minProfit:m=${minProfit}`,
    `budget:m=${budget}`,
    `timeRemaining:d=${duration}`,
  ].join("|");

  // 3) Hash ------------------------------------------------------------------
  return createHash("sha256").update(payload, "utf8").digest("hex");
};

// ----------------- helpers -----------------

function canonInt(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return "∅";
  // force integer representation (no plus sign)
  return String(parseInt(x, 10));
};

function canonZip(z) {
  if (z === null || z === undefined) return "∅";
  let s = String(z).trim().toUpperCase().replace(/\s+/g, "");
  // don’t pad by default—see questions; keep empty as "∅"
  return s === "" ? "∅" : s;
};

/**
 * Canonical money: fixed 2 decimals by default; "∅" for null/undefined.
 * If you need more precision, we can switch to integer cents.
 */
function canonMoney(x) {
  if (x === null || x === undefined || x === "") return "∅";
  const n = Number(x);
  if (!Number.isFinite(n)) return "∅";
  return n.toFixed(2); // fixed precision so 5 == 5.00
};

export function createPaginatedResponse(items, dbResult, itemLimit, searchId) {
  const firstInsertedItemId = dbResult.insertId || null;
  const lastInsertedItemId = dbResult.insertId ? dbResult.insertId + dbResult.affectedRows - 1 : null;

  const paginatedItems = items.slice(0, itemLimit);

  const availableFullPages = Math.floor(items.length / itemLimit);
  const finalPageItemCount = items.length % itemLimit;

  const results = {
    returnItems: paginatedItems,
    cursors: {
      next: firstInsertedItemId + itemLimit - 1,
      prev: firstInsertedItemId,
    },
    totalItems: items.length,
    pageCount: availableFullPages + (finalPageItemCount > 0 ? 1 : 0),
    searchId
  };

  return results;
}