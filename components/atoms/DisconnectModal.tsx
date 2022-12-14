import React, {useState} from "react";
import i18n from "i18";
import Image from "next/image";
import { assetPrefix } from "next.config";
import useNavigatorOnline from "hooks/useNavigatorOnline";

const DisconnectModal = () => {
  const { t }: any = i18n;
  const status = useNavigatorOnline()
  const [show, setShow] = useState(true)

  return (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
      className={`fixed z-50 items-start transition-all duration-1000 pb-3 justify-center w-full left-0 top-0 h-full ${!status && show ? "flex" : "hidden"}`}
    >
      <div className="bg-white max-w-md font-poppins mt-20 pt-5 p-2 pb-3 rounded-md w-full mx-5">
        <div className="px-5" >
        <div className="flex items-center gap-5" >
            <img src={`${assetPrefix}/images/danger.jpg`} alt="danger" height={30} width={30} />
            <p>{t("offlineModal.title")}</p>
        </div>
        <p className="mt-5 text-sm text-[#505F79]" >{t("offlineModal.subtitle")}</p>
        <div className="flex justify-end" >
        <button
            onClick={() => setShow(false)}
            className="bg-primary btn my-10 disabled:bg-[#DAE6F8] disabled:text-[#6B778C]/30 hover:opacity-70 text-white font-poppins rounded py-2.5 px-6 font-semibold"
          >
            {t("close")}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DisconnectModal;
