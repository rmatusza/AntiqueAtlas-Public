import { processItems } from '../functions/database-operations.js';
import { analyzeItems } from '../functions/ai-service-requests.js';
import { fetchAntiquesAndCollectibles, fetchItemById, fetchItemImageData } from '../functions/hibid-requests.js';
import { createHibidVariablesObject_categorySearch, prepareFullHibidResponseData } from '../functions/utility.js';
import { createHibidVariablesObject_singleItemSearch } from '../functions/utility.js';
import express from 'express';

export const hibidRouter = express.Router();

hibidRouter.post('/search-for-items', async (req, res) => {
  const displayItemsBeforeAnalyzing = req.query.displayItemsBeforeAnalyzing;
  const formattedItems = [];
  try {

    // using the user provided search criteria, create hibid defined graph ql variables object that is required to fetch items from their server
    const [requestVariables, userCriteria] = await createHibidVariablesObject_categorySearch(req.body);

    // fetch items from hibid server using the variables object in previous step
    const items = await fetchAntiquesAndCollectibles(requestVariables);
    
    // loop through returned items and fetch all images urls for each item from hibid server and add updated items ( which now contain item url and an array of image urls ) 
    // to formatted items array
    for (const item of items) {

      const imageUrls = [];
      const variables = createHibidVariablesObject_singleItemSearch(item.id);

      const imageData = await fetchItemImageData(variables);
      imageData.forEach(image => {
        imageUrls.push(image.fullSizeLocation);
      });

      item.imageUrls = imageUrls;

      formattedItems.push(prepareFullHibidResponseData(item));
    }

    // process the formatted items: 
    // - in short, this method discards items that do not meet the user specified criteria - comes from provided form data in the client app
    const [paginatedValidItems, allValidItems] = await processItems(formattedItems, req.body);
    
    // - if user chooses to skip the intermediate step, all valid items are sent to the next step which is the AI image analysis which 
    //   generates a highly detailed description of the item - condition, time period, identity, maker / artist, etc.
    // - if user chooses to NOT skip the intermediate step, then all valid items thus far will be returned to the client app so that user can 
    //   look at and choose which items to send to the next step in the process
    if (displayItemsBeforeAnalyzing == 'false') {
      // const analyzedItems = await analyzeItems(allValidItems);
      // res.json(analyzedItems);
    } else {
      res.json(paginatedValidItems);
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

hibidRouter.get('/fetch-item-by-id', async (req, res) => {
  const itemId = req.query.itemId;
  const variables = createHibidVariablesObject_singleItemSearch(itemId);

  try {
    const item = await fetchItemById(variables);
    const formattedItem = prepareFullHibidResponseData(item)
    res.json(formattedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});