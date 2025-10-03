import { formatFilteredDataForDb, formatItemReferencesForDb, formatItemsForDb } from "../functions/utility.js";

export async function createSearchId(conn) {
    const now = new Date();
    const [result] = await conn.query(
        'INSERT INTO searches (`timestamp`) VALUES (?)',
        [now]
    );
    const searchId = result.insertId;
    return searchId;
};

export async function saveItemReferences(items, conn) {
    const formattedItemData = formatItemReferencesForDb(items);
    await conn.query(`INSERT IGNORE INTO items (hibid_id, item_url, \`lead\`, image_urls) VALUES ?`, [formattedItemData]);
}

export async function findItemsByProfileHash(conn, hash) {
    const [itemIds] = await conn.query('SELECT hibid_id FROM filtered_items WHERE search_profile_hash = ?', [hash]);
    return itemIds;
};

export async function saveItems(items, conn, searchId) {
    const preparedItems = formatItemsForDb(items, searchId);
    const [dbResult] = await conn.query('INSERT IGNORE INTO processed_items (search_id, item_analysis, hibid_id, value_analysis) VALUES ?', [preparedItems]);
    return dbResult;
};

export async function saveFilteredItems(items, conn, profileHash) {
    const preparedItems = formatFilteredDataForDb(items, profileHash);
    await conn.query('INSERT IGNORE INTO filtered_items (hibid_id, search_profile_hash) VALUES ?', [preparedItems]);
};

export async function getItemCountBySearchId(searchId, conn) {
    const [result] = await conn.query('SELECT COUNT(*) AS item_count FROM processed_items WHERE search_id = ?', [searchId]);
    return result[0].item_count;
};

async function countRemaining(conn, searchId, cursor, direction) {
    if (direction === 'next') {
        const [rows] = await conn.query(
            `SELECT COUNT(*) AS c
       FROM processed_items
       WHERE search_id = ? AND processed_item_id > ?`,
            [searchId, cursor ?? 0] // if null, treat as 0 so ">" returns from start
        );
        return rows[0].c;
    }
    if (direction === 'prev') {
        const [rows] = await conn.query(
            `SELECT COUNT(*) AS c
       FROM processed_items
       WHERE search_id = ? AND processed_item_id < ?`,
            [searchId, cursor ?? Number.MAX_SAFE_INTEGER] // if null, treat as +∞ so "<" returns none
        );
        return rows[0].c;
    }
    // initial page (no cursor): remaining = total for this search
    const [rows] = await conn.query(
        `SELECT COUNT(*) AS c FROM processed_items WHERE search_id = ?`,
        [searchId]
    );
    return rows[0].c;
}

/**
 * Pure cursor pagination:
 * - Pass `currPrev` = first id of current page (ASC)
 * - Pass `currNext` = last  id of current page (ASC)
 * - direction: '', 'next', or 'prev'
 * - Returns only the remaining rows on the last page (e.g., 7 when 13/page and 20 total).
 */
export async function getPaginatedItemsByCursor(
    searchId,
    conn,
    currPrev = null,  // first id of CURRENT page (ASC)
    currNext = null,   // last id  of CURRENT page (ASC)
    itemLimit,
    direction = '',   // '', 'next', 'prev'
) {
    // 1) How many remain for this direction?
    //    (This lets us shrink LIMIT on the last page without using page numbers.)
    const remaining = await countRemaining(
        conn,
        searchId,
        direction === 'next' ? currNext
            : direction === 'prev' ? currPrev
                : null,
        direction || 'next' // initial treat as 'next' from start
    );

    if (remaining === 0) {
        // Nothing left in that direction
        // Still return totalItems so UI can compute total pages if needed
        const [t] = await conn.query(
            `SELECT COUNT(*) AS c FROM processed_items WHERE search_id = ?`,
            [searchId]
        );
        return [
            [],
            {
                totalItems: t[0].c,
                cursors: { prev: currPrev, next: currNext },
                pages:
                    Math.floor(t[0].c / itemLimit) + (t[0].c % itemLimit > 0 ? 1 : 0),
                searchId,
            },
        ];
    }

    const limit = Math.min(itemLimit, remaining);

    // 2) Build the SELECT for the requested direction (exclusive cursors).
    let sql, params;

    if (direction === 'next' && currNext != null) {
        sql = `
      SELECT pi.processed_item_id, pi.hibid_id, i.item_url, i.image_urls
      FROM processed_items pi
      JOIN items i ON i.hibid_id = pi.hibid_id
      WHERE pi.search_id = ?
        AND pi.processed_item_id > ?
      ORDER BY pi.processed_item_id ASC
      LIMIT ?`;
        params = [searchId, currNext, limit];

    } else if (direction === 'prev' && currPrev != null) {
        sql = `
      SELECT pi.processed_item_id, pi.hibid_id, i.item_url, i.image_urls
      FROM processed_items pi
      JOIN items i ON i.hibid_id = pi.hibid_id
      WHERE pi.search_id = ?
        AND pi.processed_item_id < ?
      ORDER BY pi.processed_item_id DESC
      LIMIT ?`;
        params = [searchId, currPrev, limit];

    } else {
        // initial page (from the beginning)
        sql = `
      SELECT pi.processed_item_id, pi.hibid_id, i.item_url, i.image_urls
      FROM processed_items pi
      JOIN items i ON i.hibid_id = pi.hibid_id
      WHERE pi.search_id = ?
      ORDER BY pi.processed_item_id ASC
      LIMIT ?`;
        params = [searchId, limit];
    }

    const [rows] = await conn.query(sql, params);

    // If prev, we selected DESC; flip back to ASC for client display
    const returnItems = direction === 'prev' ? rows.slice().reverse() : rows;

    // 3) Derive cursors from actual results (never by arithmetic!)
    let newPrev = currPrev;
    let newNext = currNext;

    if (returnItems.length > 0) {
        newPrev = returnItems[0].processed_item_id;
        newNext = returnItems[returnItems.length - 1].processed_item_id;
    }

    // 4) Compute total for UI
    const [t] = await conn.query(
        `SELECT COUNT(*) AS c FROM processed_items WHERE search_id = ?`,
        [searchId]
    );
    const totalItems = t[0].c;
    const totalPages =
        Math.floor(totalItems / itemLimit) + (totalItems % itemLimit > 0 ? 1 : 0);

    return [returnItems, {
        totalItems,
        pageCount: totalPages,
        cursors: { prev: newPrev, next: newNext },
        searchId,
    }]
};

export async function getPaginatedItemsByPageNumber(searchId, page, itemLimit, conn, pageIndexCache ) {
    const offset = (page - 1) * itemLimit;

    // try cached startId
    // const startId = await pageIndexCache.get(`${searchId}:${itemLimit}:${page}`);
    const startId = null


    let rows;
    if (startId) {
        const [r] = await conn.query(
            `SELECT pi.processed_item_id, pi.hibid_id, i.item_url, i.image_urls
       FROM processed_items pi
       JOIN items i ON i.hibid_id = pi.hibid_id
       WHERE pi.search_id = ? AND pi.processed_item_id >= ?
       ORDER BY pi.processed_item_id ASC
       LIMIT ?`,
            [searchId, startId, itemLimit]
        );
        rows = r;
    } else {
        // fallback to OFFSET if index not built yet
        const [r] = await conn.query(
            `SELECT pi.processed_item_id, pi.hibid_id, i.item_url, i.image_urls
       FROM processed_items pi
       JOIN items i ON i.hibid_id = pi.hibid_id
       WHERE pi.search_id = ?
       ORDER BY pi.processed_item_id ASC
       LIMIT ? OFFSET ?`,
            [searchId, itemLimit, offset]
        );
        rows = r;
    }

    // derive cursors from actual data
    const firstId = rows[0]?.processed_item_id ?? null;
    const lastId = rows[rows.length - 1]?.processed_item_id ?? null;
    const [t] = await conn.query(
        `SELECT COUNT(*) AS c FROM processed_items WHERE search_id = ?`,
        [searchId]
    );
    const totalItems = t[0].c;
    const totalPages =
        Math.floor(totalItems / itemLimit) + (totalItems % itemLimit > 0 ? 1 : 0);
    return [rows, {
        totalItems,
        pageCount: totalPages,
        cursors: { prev: firstId, next: lastId },
        searchId
    }]
};