import Image from "next/image";
import React from "react";
import Head from "next/head";
import i18n from "i18";
import Footer from "@/components/Footer";
import { assetPrefix } from 'next.config';

interface Props {
  setIsClicked: React.Dispatch<React.SetStateAction<boolean>>;
  isDisabled: boolean
}

const Guide = ({setIsClicked, isDisabled}: Props) => {
  const { t }: any = i18n;

  return (
    <>
      <Head>
        <title>Panduan Liveness</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className=" py-10 max-w-sm mx-auto px-2 pt-8 sm:w-full md:w-4/5 ">
        <h2 className="font-poppins text-xl font-semibold">Liveness</h2>
        <span className="font-poppins text-sm block mt-4">
          {t("guideTitle")}
        </span>
        <div className="flex flex-col gap-5 my-6" >
          <div className="grid font-poppins text-sm grid-cols-2 items-center grid-flow-col">
            <Image
              alt="guide-1"
              src={`${assetPrefix}/images/1.svg`}
              width={120}
              height={90}
            />
            <p>{t("guideSubtitle1")}</p>
          </div>
          <div className="grid font-poppins text-sm grid-cols-2 items-center grid-flow-col">
            <Image
              alt="guide-1"
              src={`${assetPrefix}/images/2.svg`}
              width={120}
              height={90}
            />
            <p>{t("guideSubtitle2")}</p>
          </div>
          <div className="grid font-poppins text-sm grid-cols-2 items-center grid-flow-col">
            <Image
              alt="guide-1"
              src={`${assetPrefix}/images/3.svg`}
              width={120}
              height={90}
            />
            <p>{t("guideSubtitle3")}</p>
          </div>
        </div>
        <button disabled={isDisabled} onClick={() => setIsClicked(true)} className="bg-primary disabled:opacity-75 btn md:mx-auto md:block md:w-1/4 text-white font-poppins w-full mx-auto rounded-sm h-9 ">
          {t("startButton")}
        </button>
        <Footer />
      </div>
    </>
  );
};

export default Guide;
