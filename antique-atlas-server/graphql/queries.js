export const HIBID_BULK_SEARCH_QUERY =
  `query LotSearch(
  $auctionId: Int = null, 
  $pageNumber: Int!, 
  $pageLength: Int!, 
  $category: CategoryId = null, 
  $searchText: String = null, 
  $zip: String = null, 
  $miles: Int = null, 
  $shippingOffered: Boolean = false, 
  $countryName: String = null, 
  $status: AuctionLotStatus = null, 
  $sortOrder: EventItemSortOrder = null, 
  $filter: AuctionLotFilter = null, 
  $isArchive: Boolean = false, 
  $dateStart: DateTime, 
  $dateEnd: DateTime, 
  $countAsView: Boolean = true, 
  $hideGoogle: Boolean = false
) {
  lotSearch(
    input: {
      auctionId: $auctionId
      category: $category
      searchText: $searchText
      zip: $zip
      miles: $miles
      shippingOffered: $shippingOffered
      countryName: $countryName
      status: $status
      sortOrder: $sortOrder
      filter: $filter
      isArchive: $isArchive
      dateStart: $dateStart
      dateEnd: $dateEnd
      countAsView: $countAsView
      hideGoogle: $hideGoogle
    }
    pageNumber: $pageNumber
    pageLength: $pageLength
    sortDirection: DESC
  ) {
    pagedResults {
      pageLength
      pageNumber
      totalCount
      filteredCount
      results {
        auction {
          ...auctionMinimum
          __typename
        }
        bidAmount
        bidList
        bidQuantity
        description
        estimate
        featuredPicture {
          description
          fullSizeLocation
          height
          hdThumbnailLocation
          thumbnailLocation
          width
          __typename
        }
        forceLiveCatalog
        fr8StarUrl
        hideLeadWithDescription
        id
        itemId
        lead
        links {
          description
          id
          type
          url
          videoId
          __typename
        }
        linkTypes
        lotNumber
        lotState {
          bidCount
          biddingExtended
          bidMax
          bidMaxTotal
          buyerBidStatus
          buyerHighBid
          buyerHighBidTotal
          buyNow
          choiceType
          highBid
          highBuyerId
          isArchived
          isClosed
          isHidden
          isLive
          isNotYetLive
          isOnLiveCatalog
          isPosted
          isPublicHidden
          isRegistered
          isWatching
          linkedSoftClose
          mayHaveWonStatus
          minBid
          priceRealized
          priceRealizedMessage
          priceRealizedPerEach
          productStatus
          productUrl
          quantitySold
          reserveSatisfied
          sealed
          showBidStatus
          showReserveStatus
          softCloseMinutes
          softCloseSeconds
          status
          timeLeft
          timeLeftLead
          timeLeftSeconds
          timeLeftTitle
          timeLeftWithLimboSeconds
          watchNotes
          __typename
        }
        pictureCount
        quantity
        ringNumber
        rv
        shippingOffered
        simulcastStatus
        site {
          domain
          fr8StarUrl
          isDomainRequest
          isExtraWWWRequest
          siteType
          subdomain
          __typename
        }
        distanceMiles
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment auctionMinimum on Auction {
  id
  altBiddingUrl
  altBiddingUrlCaption
  amexAccepted
  discoverAccepted
  mastercardAccepted
  visaAccepted
  regType
  holdAmount
  auctioneer {
    ...auctioneer
    __typename
  }
  auctionOptions {
    bidding
    altBidding
    catalog
    liveCatalog
    shippingType
    preview
    registration
    webcast
    useLotNumber
    useSaleOrder
    __typename
  }
  auctionState {
    auctionStatus
    bidCardNumber
    isRegistered
    openLotCount
    timeToOpen
    __typename
  }
  bidAmountType
  bidIncrements {
    minBidIncrement
    upToAmount
    __typename
  }
  bidOpenDateTime
  bidCloseDateTime
  bidType
  buyerPremium
  buyerPremiumRate
  checkoutDateInfo
  previewDateInfo
  currencyAbbreviation
  description
  eventAddress
  eventCity
  eventDateBegin
  eventDateEnd
  eventDateInfo
  eventName
  eventState
  eventZip
  featuredPicture {
    description
    fullSizeLocation
    height
    hdThumbnailLocation
    thumbnailLocation
    width
    __typename
  }
  links {
    description
    id
    type
    url
    videoId
    __typename
  }
  lotCount
  showBuyerPremium
  audioVideoChatInfo {
    aVCEnabled
    blockChat
    __typename
  }
  hidden
  sourceType
  distanceMiles
  __typename
}

fragment auctioneer on Auctioneer {
  address
  bidIncrementDisclaimer
  buyerRegNotesCaption
  city
  countryId
  country
  cRMID
  email
  fax
  id
  internetAddress
  missingThumbnail
  name
  noMinimumCaption
  phone
  state
  postalCode
  __typename
}`;

export const HIBID_SINGLE_ITEM_SEARCH_QUERY = 
`
query GetLotDetails($lotId: ID!, $countAsView: Boolean = true) {
  lot(input: $lotId, countAsView: $countAsView) {
    accessability
    lot {
      ...lotFull
      __typename
    }
    __typename
  }
}

fragment lotFull on Lot {
  auction {
    ...auction
    __typename
  }
  ...lotOnly
  __typename
}

fragment auction on Auction {
  id
  altBiddingUrl
  altBiddingUrlCaption
  amexAccepted
  discoverAccepted
  mastercardAccepted
  visaAccepted
  regType
  holdAmount
  termsAndConditions
  auctioneer {
    ...auctioneer
    __typename
  }
  auctionNotice
  auctionOptions {
    bidding
    altBidding
    catalog
    liveCatalog
    shippingType
    preview
    registration
    webcast
    useLotNumber
    useSaleOrder
    __typename
  }
  auctionState {
    auctionStatus
    bidCardNumber
    isRegistered
    openLotCount
    timeToOpen
    __typename
  }
  bidAmountType
  biddingNotice
  bidIncrements {
    minBidIncrement
    upToAmount
    __typename
  }
  bidOpenDateTime
  bidCloseDateTime
  bidType
  buyerPremium
  buyerPremiumRate
  checkoutDateInfo
  previewDateInfo
  currencyAbbreviation
  description
  eventAddress
  eventCity
  eventDateBegin
  eventDateEnd
  eventDateInfo
  eventName
  eventState
  eventZip
  featuredPicture {
    description
    fullSizeLocation
    height
    hdThumbnailLocation
    thumbnailLocation
    width
    __typename
  }
  links {
    description
    id
    type
    url
    videoId
    __typename
  }
  lotCount
  showBuyerPremium
  audioVideoChatInfo {
    aVCEnabled
    blockChat
    __typename
  }
  shippingAndPickupInfo
  paymentInfo
  hidden
  sourceType
  distanceMiles
  __typename
}

fragment auctioneer on Auctioneer {
  address
  bidIncrementDisclaimer
  buyerRegNotesCaption
  city
  countryId
  country
  cRMID
  email
  fax
  id
  internetAddress
  missingThumbnail
  name
  noMinimumCaption
  phone
  state
  postalCode
  __typename
}

fragment lotOnly on Lot {
  bidAmount
  bidList
  bidQuantity
  description
  estimate
  featuredPicture {
    description
    fullSizeLocation
    height
    hdThumbnailLocation
    thumbnailLocation
    width
    __typename
  }
  forceLiveCatalog
  fr8StarUrl
  hideLeadWithDescription
  id
  itemId
  lead
  links {
    description
    id
    type
    url
    videoId
    __typename
  }
  linkTypes
  lotNavigator {
    lotCount
    lotPosition
    nextId
    previousId
    __typename
  }
  lotNumber
  lotState {
    ...lotState
    __typename
  }
  pictureCount
  pictures {
    description
    fullSizeLocation
    height
    hdThumbnailLocation
    thumbnailLocation
    width
    __typename
  }
  quantity
  ringNumber
  rv
  category {
    baseCategoryId
    categoryName
    description
    fullCategory
    header
    id
    parentCategoryId
    uRLPath
    __typename
  }
  shippingOffered
  simulcastStatus
  site {
    domain
    fr8StarUrl
    isDomainRequest
    isExtraWWWRequest
    siteType
    subdomain
    __typename
  }
  saleOrder
  __typename
}

fragment lotState on LotState {
  bidCount
  biddingExtended
  bidMax
  bidMaxTotal
  buyerBidStatus
  buyerHighBid
  buyerHighBidTotal
  buyNow
  choiceType
  highBid
  highBuyerId
  isArchived
  isClosed
  isHidden
  isLive
  isNotYetLive
  isOnLiveCatalog
  isPosted
  isPublicHidden
  isRegistered
  isWatching
  linkedSoftClose
  mayHaveWonStatus
  minBid
  priceRealized
  priceRealizedMessage
  priceRealizedPerEach
  productStatus
  productUrl
  quantitySold
  reserveSatisfied
  sealed
  showBidStatus
  showReserveStatus
  softCloseMinutes
  softCloseSeconds
  status
  timeLeft
  timeLeftLead
  timeLeftSeconds
  timeLeftTitle
  timeLeftWithLimboSeconds
  timeLeftWithLimboSeconds
  watchNotes
  __typename
}
`