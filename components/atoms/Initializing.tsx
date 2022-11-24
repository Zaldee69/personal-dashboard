import React from "react";
import Loading from "@/components/Loading";
import i18n from "i18";

const Initializing = () => {
  const { t }: any = i18n;

  return (
    <div
      id="loading"
      className={`rounded-md z-[999] ease-in duration-300 absolute bg-[#E6E6E6] w-full h-[270px] flex justify-center items-center`}
    >
      <Loading title={t("initializing")} />
    </div>
  );
};

export default Initializing;
