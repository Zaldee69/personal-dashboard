import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/app/store";
import useDocument from "../hooks/useDocument";
import Pagination from "./Pagination";

interface Props {
  url: any;
  setTotalPages: Dispatch<SetStateAction<number>>;
}
export const Viewer: React.FC<Props> = ({ url, setTotalPages }) => {
  const { pages } = useDocument({
    url: url,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDisplayed, setPdfDisplayed] = useState<number>(2);
  const [zoomCount, setZoomCount] = useState<number>(1);

  const indexOfLastPdf = currentPage * 2;
  const indexOfFirstPdf = indexOfLastPdf - 2;
  const currentPages = pages.slice(indexOfFirstPdf, indexOfLastPdf);

  useEffect(() => {
    setTotalPages(pages.length);
  }, []);

  return (
    <div className="mt-9 relative overflow-auto w-full">
      <div
        style={{
          transform: `matrix(${zoomCount}, 0, 0, ${zoomCount}, 0, 0)`,
          transformOrigin: "top left",
          transition: "all .3s",
        }}
        className="content-parent "
      >
        <Signature />
        {currentPages.map((canvasURL, idx) => {
          return <img className="mt-5 shadow-xl" src={canvasURL} key={idx} />;
        })}
      </div>
      <Pagination
        currentPage={currentPage}
        currentPages={currentPages.length}
        setCurrentPage={setCurrentPage}
        totalPages={pages.length}
        pdfDisplayed={pdfDisplayed}
        setPdfDisplayed={setPdfDisplayed}
        zoomCount={zoomCount}
        setZoomCount={setZoomCount}
      />
    </div>
  );
};

const Signature = () => {
  const res = useSelector((state: RootState) => state.document);
  return (
    <div
      style={{
        transform: `translate(${res.response.data.posX}px,${res.response.data.posY}px)`,
      }}
      className="absolute"
    >
      <div
        style={{
          borderWidth: "1px",
          boxSizing: "border-box",
          touchAction: "none",
        }}
        className=" relative border-[#1A73E8] handle "
      >
        <img
          style={{ touchAction: "none", width: `${100}px`, height: `${50}px` }}
          src="/images/download.png"
          alt="signature"
        />
        <div
          style={{ borderWidth: "2px", left: "-7px", top: "-5px" }}
          className="bg-[#1A73E8] rounded-full border-[#1A73E8] w-3 h-3 absolute "
        ></div>
        <div
          style={{ borderWidth: "2px", right: "-7px", top: "-5px" }}
          className="bg-[#1A73E8] rounded-full border-[#1A73E8] w-3 h-3 absolute "
        ></div>
        <div
          style={{ borderWidth: "2px", bottom: "-7px", left: "-5px" }}
          className="bg-[#1A73E8] rounded-full border-[#1A73E8] w-3 h-3 absolute "
        ></div>
        <div
          style={{ borderWidth: "2px", bottom: "-7px", right: "-5px" }}
          className="bg-[#1A73E8] rounded-full border-[#1A73E8] w-3 h-3 absolute -bottom-2 -right-2"
        ></div>
      </div>
    </div>
  );
};