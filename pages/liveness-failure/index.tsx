import { handleRoute } from "@/utils/handleRoute";
import { serverSideRenderReturnConditions } from "@/utils/serverSideRenderReturnConditions";
import { RestKycCheckStep } from "infrastructure";
import { TKycCheckStepResponseData } from "infrastructure/rest/kyc/types";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";
import Footer from "../../components/Footer";
import { assetPrefix } from "../../next.config";

const LivenessFailure = () => {
  const router = useRouter();
  const routerQuery = router.query;
  return (
    <>
      <Head>
        <title>Liveness</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="px-5 pt-8 sm:w-full md:w-4/5 mx-auto">
        <div className="flex flex-col gap-20 items-center justify-center">
          <h1 className="text-center text-neutral800 font-poppins text-xl font-semibold">
            Liveness Gagal
          </h1>
          <Image
            src={`${assetPrefix}/images/livenessFail.svg`}
            width={200}
            height={200}
          />
          <div className="flex flex-col items-center gap-10 ">
            <p className="text-center font-poppins  text-neutral ">
              Mohon mengisi Formulir yang dikirim ke email Anda untuk
              melanjutkan proses aktivasi akun
            </p>
            {routerQuery.redirect_url && (
              <a href={handleRoute(routerQuery.redirect_url as string)}>
                <span className="text-center font-semibold font-poppins underline-offset-1	underline  text-primary">
                  Kembali ke Halaman Utama
                </span>
              </a>
            )}
          </div>
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

export default LivenessFailure;
