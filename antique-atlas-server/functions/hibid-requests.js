import { HIBID_BULK_SEARCH_QUERY, HIBID_SINGLE_ITEM_SEARCH_QUERY } from "../graphql/queries.js";
import fetch from 'node-fetch';

export const fetchAntiquesAndCollectibles = async (variables) => {
  const response = await fetch("https://hibid.com/graphql", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ "operationName": "LotSearch", query: HIBID_BULK_SEARCH_QUERY, variables}),
  });

  const resData = await response.json();
  return resData.data.lotSearch.pagedResults.results;
};

export const fetchItemImageData = async (variables) => {
  const response = await fetch("https://hibid.com/graphql", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ "operationName": "GetLotDetails", query: HIBID_SINGLE_ITEM_SEARCH_QUERY, variables}),
  });

  const resData = await response.json();
  return resData.data.lot.lot.pictures;
}

export async function fetchItemById(variables) {
  const response = await fetch("https://hibid.com/graphql", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ "operationName": "GetLotDetails", query: HIBID_SINGLE_ITEM_SEARCH_QUERY, variables}),
  });

  const resData = await response.json();
  return resData.data.lot.lot;
}