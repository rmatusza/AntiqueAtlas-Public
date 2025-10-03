# Notes
- need to keep track of item ids so that we don't accidentally process the same item twice
- need to keep track of where program left off - ex. page 10 item 5
- create a buffer of 25 items at a time
  - process all 25 items, and then continue

# Strategy

## Collect Item Data
- first use the graphql variables object to filter items
  - the most important variables here are:
   "category": 700001,    
    "pageLength": 25,
    "pageNumber": 1,
    "shippingOffered": true,
    "sortOrder": "NO_ORDER",
    "status": "OPEN",
    "filter": "ONLINE",
- once the "buffer" is full of items, they will go through the next stage of filtering according to user specified parameters
  - for the first version we'll impose the following criteria:
    - min bid is 2000 - `NOTE:` min bid means the `minimum amount that you must bid on the item` NOT the smallest bid that has been made so far
    - at least 24 hours remaining on auction

## Restructure data
- once data has been filtered, it needs to be restructured so that it can be easily processed in the later steps
- create a new object for each item with the following fields ( some fields may not be available ):
  `title`
  `description`
  `dimensions`
  `maker`
  `condition`
  `image urls`
  item url
  current bid
  next min bid
  buyer's premium
  shipping costs
  time left 

## Display initial results to user
- send the restructured data back to user 
- user can view the item info and all images
- user can select one, multiple, or all images to be submitted for further processing

## AI processing
- functionality is delivered through a python microservice that is utilized by the express backend
- filtered items are sent by express server to python ai microservice - PAM - where the following will happen:
  - image is analyzed by BLIP-2 in order to generate an accurate description of the item - it looks at the item and generates notes on all its details
  - BLIP-2 is basically the eyes and the LLM is the brain ( i think )
  - BLIP-2 data are then passed to LLM ( not sure which LLM to use just yet ) to estimate item value
- ai microservice sends back blip-2 description and llm valuation data to express server which uses the enhanced item description provided by PAM to do a final filtering step and then return the refined results to the client 
- final results should include a brief synopsis of findings and relevant data as well as a link to the item on hibid

## Final results
- after express server receives data from ai microservice a final round of filtering is performed
- items are discarded if the results of the ai analysis do not fit within the defined criteria
- remaining items are sent to client application and displayed

## Questions
