import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import i18n from "i18";
import { useRouter } from "next/router";
import { assetPrefix } from "../../next.config";
import { AppDispatch } from "@/redux/app/store";
import { useDispatch } from "react-redux";
import { setIsDone } from "@/redux/slices/livenessSlice";
import { handleRoute } from "@/utils/handleRoute";
import { GetServerSideProps } from "next";
import { TKycCheckStepResponseData } from "infrastructure/rest/kyc/types";
import { RestKycCheckStep } from "infrastructure";
import { serverSideRenderReturnConditions } from "@/utils/serverSideRenderReturnConditions";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";

const LivenessFail = () => {
  const router = useRouter();
  const [gagalCounter, setGagalCounter] = useState(0);
  const dispatch: AppDispatch = useDispatch();

  const { t }: any = i18n;

  const resetStorage = () => {
    setGagalCounter(0);
    sessionStorage.removeItem("tlk-counter");
    if (router.query.redirect_url) {
      window.location.replace(
        concateRedirectUrlParams(router.query.redirect_url as string, "")
      );
    } else {
      router.replace({
        pathname: handleRoute("/"),
      });
    }
  };

  const setPathName = (routerQuery: any) => {
    if (routerQuery.revoke_id) return handleRoute("kyc/revoke");
    if (routerQuery.issue_id) return handleRoute("kyc/re-enroll");
    return handleRoute("guide");
  };

  useEffect(() => {
    if (gagalCounter > 2) localStorage.removeItem("tlk-counter");
  }, [gagalCounter]);

  useEffect(() => {
    dispatch(setIsDone(false));
    if (localStorage.getItem("tlk-counter")) {
      setGagalCounter(parseInt(localStorage.getItem("tlk-counter") as string));
    }
  }, []);

  const RedirectButton = () => {
    if (gagalCounter > 2) {
      return (
        <span
          onClick={resetStorage}
          className="cursor-pointer text-center poppins-semibold underline-offset-1	underline  text-primary"
        >
          {t("livenessSuccessButtonTitle")}
        </span>
      );
    } else {
      return (
        <Link
          href={{
            pathname: setPathName(router.query),
            query: { ...router.query },
          }}
        >
          <button className="bg-primary btn md:mx-auto md:block md:w-1/4 text-white poppins-regular w-full mx-auto rounded-sm h-9">
            {t("livenessFailedButtonTitle")}
          </button>
        </Link>
      );
    }
  };
  return (
    <>
      <Head>
        <title>Liveness</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="px-5 pt-8 sm:w-full md:w-4/5 mx-auto">
        <div className="flex flex-col gap-20 items-center justify-center">
          <h1 className="text-center poppins-semibold text-xl">
            {t("livenessFailedTitle")}
          </h1>
          <Image
            src={`${assetPrefix}/images/livenessFail.svg`}
            width={200}
            height={200}
          />
          <div className="flex flex-col gap-10 ">
            <span className="text-center poppins-regular text-neutral ">
              {gagalCounter > 2
                ? t("livenessFailed3xSubtitle")
                : t("livenessFailedSubtitle")}
            </span>
          </div>
          <RedirectButton />
        </div>
        <Footer />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cQuery = context.query;
  const uuid =
    cQuery.transaction_id || cQuery.request_id || cQuery.registration_id;

  const checkStepResult: {
    res?: TKycCheckStepResponseData;
    err?: {
      response: {
        data: {
          success: boolean;
          message: string;
          data: { errors: string[] };
        };
      };
    };
  } = await RestKycCheckStep({
    payload: { registerId: uuid as string },
  })
    .then((res) => {
      return { res };
    })
    .catch((err) => {
      return { err };
    });

  return serverSideRenderReturnConditions({ context, checkStepResult });
};

export default LivenessFail;
