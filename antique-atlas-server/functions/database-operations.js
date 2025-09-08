import { pool } from '../db/dbConfig.js';
import { createSearchId, findItemsByProfileHash, getItemCountBySearchId, getPaginatedItemsByCursor, getPaginatedItemsByPageNumber, saveFilteredItems, saveItemReferences, saveItems } from '../db/mysqlQueries.js';
import { createHibidVariablesObject_singleItemSearch, createPaginatedResponse, createUnhashedSearchProfile, filterFetchedItems, hashSearchProfile } from './utility.js';
import { prepareFullHibidResponseData } from './utility.js';
import { fetchItemById } from './hibid-requests.js';
import { readFile } from 'fs/promises';


export async function processItems(items, searchParams) {
    const config = JSON.parse(
        await readFile(new URL('../settings/resultSettings.json', import.meta.url), 'utf-8')
    );
    // X 1. create a new search id
    // X 2. hash search profile
    // X 3. fetch all filtered item ids for that search profile
    // X 4. fetch items from hibid
    /// TODO 5. filter out all fetched items whose id is found within the items from the filtered table
    /// TODO 6. filter remaining items
    // X 7. add search id to each item
    // X 8. save all unprocessed items
    // x 9. save any new filtered items to filtered items table
    /// TODO 10. paginate valid unfiltered items
    // console.log(items)
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        // console.log(items)
        // take the user submitted search criteria and extract the fields that will be used to create the search profile hash 
        const essentialCritera = createUnhashedSearchProfile(searchParams);

        // hash the search profile using the essential criteria
        const searchProfileHash = hashSearchProfile(essentialCritera);

        // save all items that were returned from hibid fetch - hibid id in other tables can reference complete records in this table so as to avoid saving duplicate info - saved once here and reference elsewhere
        await saveItemReferences(items, conn);

        // create search id to group search results as a set
        const searchId = await createSearchId(conn);

        // use the search profile hash to fetch all previously discarded items of that hash
        const filteredIds = await findItemsByProfileHash(conn, searchProfileHash);

        /// TODO IN PROGRESS- filter items by comparing to filtered ids
        /// TODO IN PROGRESS- filter items
        // using the search criteria and known invalid items, sort the new items into valid items ( meets criteria ) or invalid items ( violates criteria or has already been discarded in the past for the same search criteria )
        const [validItems, invalidItems] = filterFetchedItems(items, filteredIds, essentialCritera);
        let dbResult;

        if (invalidItems.length > 0) {
            // save the newly discarded items so that they can be avoided in the future
            await saveFilteredItems(invalidItems, conn, searchProfileHash);
        }
        if (validItems.length > 0) {
            // save the items that satisfy the criteria so they can be displayed and / or moved to the next step in the process
            dbResult = await saveItems(validItems, conn, searchId);
        }

        await conn.commit();

        const paginatedValidItems = createPaginatedResponse(validItems, dbResult, config.resultsPerPage, searchId);
        return [paginatedValidItems, validItems];
    }
    catch (err) {
        console.log(err)
        if (conn) {
            try {
                await conn.rollback(); // ROLLBACK
            } catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr);
            }
        }
        console.log('CONNECTION OBJECT IS NULL');
    } finally {
        if (conn) {
            conn.release(); // always release the connection back to the pool
        }
    }
};

export async function fetchItemCount(searchId) {
    let conn;
    try {
        conn = await pool.getConnection();
        return await getItemCountBySearchId(searchId, conn);

    }
    catch (e) {
        console.log(e)
    }
    finally {
        if (conn) {
            conn.release(); // always release the connection back to the pool
        }
    }
};

export async function fetchPaginatedItems(searchId, prev, next, direction, fetchType, pageNum) {
    const config = JSON.parse(
        await readFile(new URL('../settings/resultSettings.json', import.meta.url), 'utf-8')
    );

    let conn;
    try {
        conn = await pool.getConnection();
        
        let itemData;
        let resObj;

        if(fetchType === 'cursor') {
            const [data, paginationData] = await getPaginatedItemsByCursor(searchId, conn, prev, next, config.resultsPerPage, direction);
            itemData = data;
            resObj = paginationData;
        }
        else {
            const [data, paginationData] = await getPaginatedItemsByPageNumber(searchId, pageNum, config.resultsPerPage, conn, null);
            itemData = data;
            resObj = paginationData;
        }
        
        const variablesArr = []
        const formattedData = [];

        itemData.forEach(item => {
            const variables = createHibidVariablesObject_singleItemSearch(item.hibid_id);
            variablesArr.push(variables);
        });

        let i = 0;
        for(const variables of variablesArr) {
            const fullItem = await fetchItemById(variables);
            const formattedItem = prepareFullHibidResponseData(fullItem);
            const image_urls = itemData[i].image_urls;
            const item_url = itemData[i].item_url;
            formattedData.push({...formattedItem, image_urls, item_url});
            i++;
        };

        resObj.returnItems = formattedData;
        return resObj;
    }
    catch (e) {
        console.log(e)
    }
    finally {
        if (conn) {
            conn.release(); // always release the connection back to the pool
        }
    }
};