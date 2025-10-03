## 1. Problem Statement
user should be able to customize search and result parameters before starting a round of search/analysis

## 2. Feature Definition
when user runs the application, they are presented with a control panel that allows them to specify how they want the search and analysis to take place and to establish criteria for fetching and filtering out items. the control panel is a form containing dropdowns, radio buttons, and text boxes. when a search is started a loading spinner will be presented. when process is complete a button will appear that can be clicked which will navigate the user to the results page

## 3. Functional Requirements

### Components
- Modal
- Popup Message

### Pages
- Control Panel

### Functions
- `/search-for-items?displayItemsBeforeAnalyzing=boolean`
  - **Type:** HTTP - POST
  - **Purpose:** to send an http request to the server in order to retrieve all items that meet the user specified criteria 
  - **Called by / From:** Control Panel Page
  - **Inputs:** 
    1. form data
    2. request parameter - analyzeFetchedData - if true combines the item fetching and item analysis into a single step
  - **Output:** list of item objects

### Form Inputs
- category - need to find the other category codes
  - dropdown
  - default value = antiques and collectibles
- shipping offered
  - radio button
  - default value = true
- sort order
  - drop down
  - default value = none
- filter - `this is the lot type on hibid`
  - drop down
  - default value = online
- miles 
  - dropdown
  - default value = any
- search text
  - text box
- zip
  - text box
- display items before analyzing
  - radio button
  - default value = true
- search instructions - `most of these are not supported by hibid and have to be applied manually`
  - number of items
    - dropdown
    - default value = 20
  - minimum ROI
    - text box
  - budget
    - text box
  - min time remaining on auction
    - multiple text boxes - one for days and one for hours
    - default value = 1 day

### Validations
- zip code needs be valid - 5 digits
- search text needs to be no more than 100 characters

### Error Handling
1. `network error`
  - **Status Code:** auto generated
  - **Handling:** display message via modal
2. `server error`
  - **Status Code:** auto generated
  - **Handling:** display message via modal

## 4. Acceptance Criteria

- `Control Panel Page`
  - control panel is the 'home page'
  - form is displayed that contains all the inputs and default values listed in the form inputs section
  - form inputs have the constraints mentioned in the validations section
  - there is a button that when pressed, resets the form
  - there is a button that when pressed, starts the data collecting / analyzing process
  - there is a button that when pressed navigates user to **Target Items page** - these are items that have been fully analyzed and were not filtered out meaning that they satisfy the user provided criteria and were saved to the db either manually or automatically depending on the resultSettings.json file
  - when data is being collected or analyzed there is a loading spinner
  - when process is complete there is a button that when pressed will navigate the user to the **Results Page**
  - `TODO` if an error occurs, display the error via the poppup message ui component

## 5. Tasks

- `client:`
  - install dependencies:
    - [x] tailwind
    - [x] react hook form
    - react portals
  - create the ui components:
    - modal
    - popup message
  - [x] create the control panel page