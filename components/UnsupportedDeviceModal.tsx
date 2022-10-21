import i18n from "i18";
import { assetPrefix } from "next.config";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";

interface Props {}

const UnsupportedDeviceModal: React.FC<Props> = () => {
  const { t }: any = i18n;
  const copyLink = () => {
    var copyText = document.getElementById("inputLink") as HTMLInputElement;
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard
      .writeText(copyText.value)
      .then(() => {
        toast.success("Berhasil menyalin link!");
      })
      .catch(() => {
        toast.error("Gagal menyalin link!");
      });
  };
  const getCurrentURL = (): string => window.location.href;
  return (
    <div
      id="unsupportedDevice"
      style={{ backgroundColor: "rgba(0, 0, 0, .5)", zIndex: "999" }}
      className="fixed z-50  items-start transition-all hidden duration-1000 pb-3 justify-center w-full left-0 top-0 h-full"
    >
      <div
        className="bg-white mt-20 pt-6 px-3.5 pb-9 rounded-xl w-full mx-5"
        style={{ maxWidth: "352px" }}
      >
        <div className="flex flex-col">
          <p className="font-poppins text-center font-semibold text-base text-neutral800">
            {t("deviceNotSupportedTitle")}
          </p>
          <p className="text-base font-normal text-neutral800 font-poppins text-center mt-6 mx-auto px-8">
            {t("deviceNotSupportedSubtitle")}
          </p>
          <label className="mt-10">
            <p className="pl-4 pb-2 font-popping text-neutral200 text-sm font-semibold">
              {t("link")}
            </p>
            <div className="flex items-center border border-neutral50 rounded-md overflow-hidden">
              <div className="px-3 border-r border-neutral50 self-stretch flex">
                <Image
                  src={`${assetPrefix}/images/link.svg`}
                  width="20px"
                  height="10px"
                  alt="link-ill"
                />
              </div>

              <input
                id="inputLink"
                type="text"
                className="text-neutral800 text-sm font-poppins focus:outline-none truncate px-3 self-stretch flex-1"
                value={getCurrentURL()}
                readOnly
              />
              <button
                onClick={copyLink}
                className="bg-primary text-white text-sm font-poppins px-3 py-4"
              >
                {t("copy")}
              </button>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
};

export default UnsupportedDeviceModal;
