import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Footer from "../../components/Footer";
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
          className="cursor-pointer text-center font-semibold font-poppins underline-offset-1	underline  text-primary"
        >
          Kembali ke Halaman Utama
        </span>
      );
    } else {
      return (
        <Link
          href={{
            pathname: router.query.revoke_id
              ? handleRoute("/kyc/revoke")
              : handleRoute(`/guide`),
            query: { ...router.query },
          }}
        >
          <button className="bg-primary btn md:mx-auto md:block md:w-1/4 text-white font-poppins w-full mx-auto rounded-sm h-9">
            ULANGI
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
          <h1 className="text-center font-poppins text-xl font-semibold">
            Liveness Gagal
          </h1>
          <Image
            src={`${assetPrefix}/images/livenessFail.svg`}
            width={200}
            height={200}
          />
          <div className="flex flex-col gap-10 ">
            <span className="text-center font-poppins text-neutral ">
              {gagalCounter > 2
                ? "Mohon mengisi Formulir yang dikirim ke email Anda untuk melanjutkan proses aktivasi akun"
                : "Maaf, proses Liveness Anda gagal. Foto dan aksi yang diminta tidak sesuai. Mohon ulangi proses Liveness dan ikuti petunjuk dengan benar."}
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
