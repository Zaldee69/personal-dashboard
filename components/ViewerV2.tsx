import React, { Dispatch, SetStateAction, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/app/store";
import useDocument from "../hooks/useDocument";

interface Props {
  url: any;
  tandaTangan: any;
  setTotalPages: Dispatch<SetStateAction<number>>;
}
export const ViewerV2: React.FC<Props> = ({
  url,
  setTotalPages,
  tandaTangan,
}) => {
  const { pages } = useDocument({
    url: url,
  });

  useEffect(() => {
    if (pages) {
      setTotalPages(pages.length);
    }
  }, [pages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className=" relative overflow-auto w-full">
      <div className="w-fit mx-auto h-fit">
        {tandaTangan ? <Signature /> : null}
        {pages.map((canvasURL, idx) => {
          return (
            <img
              key={idx}
              style={{
                transformOrigin: "top left",
                transition: "all .3s",
              }}
              className="mt-5 shadow-xl"
              src={canvasURL}
              alt="canvas"
            />
          );
        })}
      </div>
    </div>
  );
};

const Signature = () => {
  const res = useSelector((state: RootState) => state.document);
  const data = useSelector((state: RootState) => state.signature);

  return (
    <div
      style={{
        transform: `translate(${res.response.data.posX}px,${res.response.data.posY}px)`,
        zIndex: "2",
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
          style={{
            touchAction: "none",
            width: `${res.response.data.width}px`,
            height: `${res.response.data.height}px`,
          }}
          src={`data:image/png;base64,${
            data.data.scratch !== "" || data.data.font !== ""
              ? data?.data?.scratch?.split(",")[1] ||
                data?.data?.font?.split(",")[1]
              : res.response.data.tandaTangan
          }`}
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
