/// ITEM KEY LIST:
// auction
// bidAmount
/// bidList
// bidQuantity
/// description
// estimate
// featuredPicture
// forceLiveCatalog
// fr8StarUrl
// hideLeadWithDescription
/// id - required for creating item url
// itemId
/// lead - required for creating item url
// links
// linkTypes
// lotNumber
// lotState
/// pictureCount
// quantity
// ringNumber
// rv
// shippingOffered
// simulcastStatus
// site
// distanceMiles

/// AUCTION OBJECT:
// {
//   id: 660900,
//   altBiddingUrl: null,
//   altBiddingUrlCaption: '',
//   amexAccepted: true,
//   discoverAccepted: true,
//   mastercardAccepted: true,
//   visaAccepted: true,
//   regType: 'CREDIT_CARD_EVERY_TIME',
//   holdAmount: 0,
///   auctioneer: {
//     address: '17203 South Drive  77433',
//     bidIncrementDisclaimer: 'Your bid must adhere to the<br/>bid increment schedule.',
//     buyerRegNotesCaption: 'YOUR NOTES TO THE AUCTIONEER',
//     city: 'Cypress',
//     countryId: 178,
//     country: 'United States',
//     cRMID: 0,
//     email: 'probid.cypress@gmail.com',
//     fax: '',
//     id: 148830,
//     internetAddress: null,
//     missingThumbnail: 'https://cdn.hibid.com/cdn/images/hibid/missing/thumbnail_en.png',
//     name: 'Probid Cypress',
//     noMinimumCaption: 'No Minimum',
//     phone: '832-493-0148',
//     state: 'TX',
//     postalCode: '77433',
//     __typename: 'Auctioneer'
//   },
//   auctionOptions: {
//     bidding: true,
//     altBidding: false,
//     catalog: true,
//     liveCatalog: true,
///     shippingType: 'NO_SHIPPING_OFFERED',
//     preview: false,
//     registration: true,
//     webcast: false,
//     useLotNumber: true,
//     useSaleOrder: true,
//     __typename: 'AuctionOptionsType'
//   },
//   auctionState: {
//     auctionStatus: 'OPEN_LIVE_CATALOG',
//     bidCardNumber: 0,
//     isRegistered: false,
//     openLotCount: 704,
//     timeToOpen: '',
//     __typename: 'AuctionStateType'
//   },
//   bidAmountType: 'MAX_BIDDING',
///   bidIncrements: [
//     {
//       minBidIncrement: 1,
//       upToAmount: 49,
//       __typename: 'BidIncrementType'
//     },
//     {
//       minBidIncrement: 2.5,
//       upToAmount: 97.5,
//       __typename: 'BidIncrementType'
//     },
//     {
//       minBidIncrement: 5,
//       upToAmount: 495,
//       __typename: 'BidIncrementType'
//     },
//     {
//       minBidIncrement: 10,
//       upToAmount: 990,
//       __typename: 'BidIncrementType'
//     },
//     {
//       minBidIncrement: 20,
//       upToAmount: 4987,
//       __typename: 'BidIncrementType'
//     },
//     {
//       minBidIncrement: 10000,
//       upToAmount: 9999999.99,
//       __typename: 'BidIncrementType'
//     }
//   ],
///   bidOpenDateTime: '2025-07-15T16:06:00',
///   bidCloseDateTime: '2025-07-21T19:30:00',
//   bidType: 'INTERNET_ONLY',
///   buyerPremium: '16% buyers premium',
//   buyerPremiumRate: 1,
//   checkoutDateInfo: '',
//   previewDateInfo: '',
//   currencyAbbreviation: 'USD',
//   description: 'This auction will consist of NEW in-the-box overstock, packaging damaged, and some customer returns inventory from major retailers. Items will include mattresses, furniture,  computers, lawn tools, ladders, home decor, toys, cleaning supplies, electronics, household goods, and other general merchandise. We do not have control over what inventory is sent to us. Please note that SOME customer returns have been added to the auction. All customer returns have been tested for functionality. All customer returns have a 3-day return policy should it be not functioning or if defect was not noted in description. Bid accordingly and bid with confidence. All merchandise is sold As-Is and Where Is without warranties or guarantees of any kind. ProBid Partners LLC does not represent any manufacturer or retailer. Items may consist of scuffs and scratches that may have not been noted in listing - all major issues if any will be noted',
//   eventAddress: '17203 South Drive',
//   eventCity: 'Cypress',
//   eventDateBegin: '2025-07-15T00:00:00',
//   eventDateEnd: '2025-07-21T00:00:00',
//   eventDateInfo: '',
//   eventName: '07/21 Bidder’s High > Serotonin',
//   eventState: 'TX',
//   eventZip: '77433',
//   featuredPicture: {
//     description: '07/21 Bidder’s High > Serotonin',
//     fullSizeLocation: 'https://cdn.hibid.com/img.axd?id=8172230454&wid=&rwl=false&p=&ext=&w=0&h=0&t=&lp=&c=true&wt=false&sz=MAX&checksum=DdHhkGss%2b0UBADbu5M9kWh1wXT3gy5Ih',
//     height: 0,
//     hdThumbnailLocation: '',
//     thumbnailLocation: 'https://cdn.hibid.com/img.axd?id=8172230454&wid=&rwl=false&p=&ext=&w=0&h=0&t=&lp=&c=true&wt=false&sz=MAX&checksum=DdHhkGss%2b0UBADbu5M9kWh1wXT3gy5Ih&h=200&w=200',      
//     width: 0,
//     __typename: 'Picture'
//   },
//   links: [],
//   lotCount: 2032,
//   showBuyerPremium: false,
//   audioVideoChatInfo: {
//     aVCEnabled: false,
//     blockChat: false,
//     __typename: 'AuctionAudioVideoChat'
//   },
//   hidden: false,
//   sourceType: 'AF_360',
//   distanceMiles: null,
//   __typename: 'Auction'
// }

/// SAMPLE LOT STATE OBJECT:

// lotState: {
///     bidCount: 12,
//     biddingExtended: false,
//     bidMax: 0,
//     bidMaxTotal: 0,
//     buyerBidStatus: 'NO_BID',
//     buyerHighBid: 0,
//     buyerHighBidTotal: 0,
///     buyNow: 0,
//     choiceType: 'SINGLE_LOT',
///     highBid: 20,
//     highBuyerId: '9122414',
//     isArchived: false,
///     isClosed: true,
//     isHidden: false,
//     isLive: false,
//     isNotYetLive: false,
//     isOnLiveCatalog: false,
//     isPosted: false,
//     isPublicHidden: false,
//     isRegistered: false,
//     isWatching: false,
//     linkedSoftClose: '',
//     mayHaveWonStatus: '',
///     minBid: 0,
//     priceRealized: 20,
//     priceRealizedMessage: null,
//     priceRealizedPerEach: 20,
//     productStatus: 'BUY_NOW_SET',
//     productUrl: null,
//     quantitySold: 1,
//     reserveSatisfied: true,
//     sealed: false,
//     showBidStatus: true,
//     showReserveStatus: false,
//     softCloseMinutes: 2,
//     softCloseSeconds: 0,
///     status: 'CLOSED',
///     timeLeft: 'Bidding Closed',
//     timeLeftLead: '',
//     timeLeftSeconds: -60.65,
//     timeLeftTitle: 'Internet Bidding closed at: 7/21/2025 9:44:02 PM EST',
//     timeLeftWithLimboSeconds: -59.65,
//     watchNotes: null,
//     __typename: 'LotState'
//   }

/// ITEM IMAGE OBJECT:

// featuredPicture: {
//   description: 'Sealed 1990 Hockey Picture Cards Set',
//   fullSizeLocation: 'https://cdn.hibid.com/img.axd?id=8166836917&wid=&rwl=false&p=&ext=&w=0&h=0&t=&lp=&c=true&wt=false&sz=MAX&checksum=3sLVQec%2fk%2b3Yb51i2Yte3TjpkFpdGlVa',
//   height: 0,
//   hdThumbnailLocation: 'https://cdn.hibid.com/img.axd?id=8166836917&wid=&rwl=false&p=&ext=&w=0&h=0&t=&lp=&c=true&wt=false&sz=MAX&checksum=3sLVQec%2fk%2b3Yb51i2Yte3TjpkFpdGlVa&h=400&w=400',  
//   thumbnailLocation: 'https://cdn.hibid.com/img.axd?id=8166836917&wid=&rwl=false&p=&ext=&w=0&h=0&t=&lp=&c=true&wt=false&sz=MAX&checksum=3sLVQec%2fk%2b3Yb51i2Yte3TjpkFpdGlVa&h=200&w=200',    
//   width: 0,
//   __typename: 'Picture'
// }

/// AUCTIONEER INFO:

// auctioneer: {
//   address: '12003 Woodruff Ave',
//   bidIncrementDisclaimer: 'Your bid must adhere to the<br/>bid increment schedule.',
//   buyerRegNotesCaption: 'YOUR NOTES TO THE AUCTIONEER',
//   city: 'Downy',
//   countryId: 178,
//   country: 'United States',
//   cRMID: 0,
//   email: 'support@surplus4all.com',
//   fax: '',
//   id: 89314,
//   internetAddress: 'www.surplus4all.com/',
//   missingThumbnail: 'https://cdn.hibid.com/cdn/images/hibid/missing/thumbnail_en.png',
//   name: 'Surplus 4 All',
//   noMinimumCaption: 'No Minimum',
//   phone: '(888)-944-9952',
//   state: 'CA',
//   postalCode: '90241',
//   __typename: 'Auctioneer'
// }