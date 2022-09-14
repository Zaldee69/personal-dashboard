import { assetPrefix } from "../../next.config";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { restLogout } from "infrastructure/rest/b2b";
import { handleRoute } from "./../../utils/handleRoute";
import { GetServerSideProps } from "next";
import { TKycCheckStepResponseData } from "infrastructure/rest/kyc/types";
import { RestKycCheckStep } from "infrastructure";
import { serverSideRenderReturnConditions } from "@/utils/serverSideRenderReturnConditions";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";

type Props = {};

const LinkAccountSuccess = (props: Props) => {
  const router = useRouter();
  const routerIsReady: boolean = router.isReady;
  const routerQuery: NextParsedUrlQuery & {
    signing?: "1";
    redirect_url?: string;
  } = router.query;
  const isSigning: boolean = routerQuery.signing === "1";

  useEffect(() => {
    if (!routerIsReady) return;
    if (!isSigning) {
      restLogout();
    } else {
      setTimeout(() => {
        router.replace({
          pathname: handleRoute("/signing"),
          query: { ...routerQuery },
        });
      }, 1000);
    }
  }, [isSigning, routerIsReady]);

  return (
    <div className="px-10 pt-16 pb-9 text-center">
      <p className="font-poppins text-base font-semibold text-neutral800">
        Penautan Akun Berhasil!
      </p>
      <div className="mt-20">
        <Image
          src={`${assetPrefix}/images/linkAccountSuccess.svg`}
          width="196px"
          height="196px"
          alt="liveness-success-ill"
        />
      </div>
      <div className="mt-14">
        <p className="font-poppins text-xs text-neutral200">
          Akun Tilaka Anda telah berhasil ditautkan.
        </p>
      </div>
      {!isSigning && routerQuery.redirect_url && (
        <div className="mt-20 text-primary text-base font-medium font-poppins underline hover:cursor-pointer">
          <a href={concateRedirectUrlParams(routerQuery.redirect_url, "")}>
            <a>Kembali ke Halaman Utama</a>
          </a>
        </div>
      )}
      <div className="mt-11 flex justify-center">
        <Image
          src={`${assetPrefix}/images/poweredByTilaka.svg`}
          alt="powered-by-tilaka"
          width="80px"
          height="41.27px"
        />
      </div>
    </div>
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

export default LinkAccountSuccess;
