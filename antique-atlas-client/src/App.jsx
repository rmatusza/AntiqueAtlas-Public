import { useState } from "react";
import { ControlPanel } from "./pages/ControlPanel";
import { Results } from "./pages/Results";
import { data } from "./utils/testing/testData";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("controlPanel");
  const [items, setItems] = useState(data);
  const [cursors, setCursors] = useState(null);
  const [totalItems, setTotalItems] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [searchId, setSearchId] = useState(null);

  return (
    <div className="items-center justify-center">
      {
        page === "controlPanel" 
        && 
        <ControlPanel setPage={setPage} setItems={setItems} setCursors={setCursors} setTotalItems={setTotalItems} setPageCount={setPageCount} setSearchId={setSearchId} />
      }

      {
        page === "results"
        &&
        <Results items={items} setPage={setPage} setItems={setItems} setCursors={setCursors} cursors={cursors} totalItems={totalItems} pageCount={pageCount} searchId={searchId} />
      }

    </div>
  );
}
