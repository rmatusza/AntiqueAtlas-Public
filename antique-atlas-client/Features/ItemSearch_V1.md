## 1. Problem Statement
server should be able to take user provided search criteria and fetch relevant items from hibid servers, and handle filtering of items, saving of items to database, sending items to chatgpt api to be normalized, and then sent to regression service for price prediction

49m4/edit?tab=t.0

## 2. Feature Definition
when user submits a search, the portion of the search parameters that are hibid compatiblie are used to fetch items from hibid servers. fetched items are then sorted against other user criteria in search request along with previously filtered items. filtered out items are saved to filtered items table. remaining items are saved to database unprocessed items table and then sent to ai server for analysis. analyzed items are saved to db processed items table

## 4. Server Functional Requirements

### Request Handlers
- `/search-for-items?displayItemsBeforeAnalyzing=boolean`
  - **Type:** POST
  - **Purpose:** handle the client request for fetching items from Hibid server
  - **Inputs:** 
    - **Body:** form inputs - makes up part of the graphql variables object with the other part coming from the server config file
    - **Request Parameters:** analyzeFetchedData - if true combines the item fetching and item analysis into a single step
  - **Output:**
    - **Option 1:** if user did not choose to display items before analyzing, will return only the analyzed items which contains all the original item data from hibid + the results of the analysis
    - **Option 2:** if user chose to display items before analyzing, will return only the fetched hibid items 
- `/analyze-items`
  - **Type:** POST
  - **Purpose:** handle the client request for analyzing items
  - **Inputs:** 
    - **Body:** list of item data
  - **Output:** list of analyzed item data

## 5. Database Requirements

- Table: `searches`
  - Fields:
    - search_id
    - timestamp - **NEED TO ADD**
- Table: `search_profiles`
  - Fields:
    - search_profile_id
    - search_profile_hash
- Table: `filtered_items`
  - Fields:
    - id
    - hibid_id
    - search_profile_hash
- Table: `unprocessed_items`
  - Fields:
    - unprocessed_item_id 
    - search_id 
    - image_urls  
    - hibid_id 
    - item_url  
    - lead 
- Table: `processed_items`
  - Fields:
    - processed_item_id 
    - search_id 
    - image_analysis 
    - value_analysis 
    - image_urls  
    - hibid_id 
    - item_url 
    - lead 

## 6. Acceptance Criteria

- `Search for items request handler functionality`
  - server needs to create a new search record for each request - used to group items together as a single set of search results 
  - server needs to generate a search criteria hash for each request - used to avoid reprocessing items that we know violate the search criteria
  - server needs to first fetch all filtered, processed, and unprocessed item ids according to search profile hash
  - server needs to fetch items from hibid using the user defined search variables
  - server needs to perform **round 1 filtering** - uses the filtered, processed, and unprocessed item ids to discard items if an id match is found
    - if item has already been processed before save a reference to it for the final filtering round
  - if an item is filtered out it needs to be written to the db along with the search profile hash
  - if analysis does not take place in the same step:
    - save round 1 filtered items to db
    - perform pagination and return paginated results to user - new unprocessed results and previous unprocessed results with matching hash
  - server needs to send a request to the ai service for analysis - **see the /analyze-items method**
  - server needs to perform **round 2 filtering**
  - items that don't meet criteria are filtered out and saved to the filtered items table
  - potential hit items are written to the processed_items table
  - perform pagination and return paginated results to user - new processed items and previous processed items with matching hash

## 7. Tasks

- `database:`
  - create schema
  - crete tables
- `server:`
  - install dependencies:
    - dotenv
    - mysql2
  - create database schema
  - create database tables
  - prepare dotenv file
  - connect to database
  - implement the search for items request handler functionality detailed in AC
- `implement pagination`

## 8. Design Notes

- will need to increase allowed request time
- need to think about how you want to implement pagination - could group results by search number and paginate just that set or could simply return all processed results and paginate the entire table
- need to figure out which form inputs are needed b/c not sure what some of them actually do - also some of the inputs are irrelevant based on other choices - like if you're looking for online with shipping then miles and zip code don't really matter
  - also means that based on certain selections, some fields have to be enforced for it to be logical - if shipping not offered then miles and zip are needed
- need to think about the ui for the results page, how to structure it and what kind of user controls to add and the styling for it
- issues to avoid:
  - saving duplicate items in the db
  - re-filtering/analyzing items
- remove the searches table - instead find the current highest search id in items table, increment by 1 and then use that for all items
- on control panel page use view results to get to results page but block it while a search is underway
- will need to do the following on the results page:
  - add checkboxes to items to select them
  - be able to delete selected or delete all
  - be able to pull up previous searches - means need to add timestamps to items when saving to db
  - probably should set up a drawer component to house the actions for that page.
- figure out how to delete unused models - when at gabes downloaded about 20gb of stuff
- figure out which models i can use given the specs of my computer, also without pushing my computer too hard
- figure out the necessity of "self-start" for the sticky link

## V1 Item Search limitations
- doesn't search items indefinitely - searches a set number of items
- value analysis functionality doesn't yet exist so that part can't be done - can only generate list of item properties from chatgpt api 