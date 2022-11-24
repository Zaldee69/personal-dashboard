import { useEffect, useState } from "react";
import Image from "next/image";
import EyeIcon from "./../../public/icons/EyeIcon";
import EyeIconOff from "./../../public/icons/EyeIconOff";
import { useRouter } from "next/router";
import { AppDispatch, RootState } from "@/redux/app/store";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/redux/slices/loginSlice";
import Head from "next/head";
import { TLoginProps } from "@/interface/interface";
import { assetPrefix } from "../../next.config";
import { handleRoute } from "./../../utils/handleRoute";
import { getCertificateList, getUserName } from "infrastructure/rest/b2b";
import { GetServerSideProps } from "next";
import { TKycCheckStepResponseData } from "infrastructure/rest/kyc/types";
import { RestKycCheckStep } from "infrastructure";
import { serverSideRenderReturnConditions } from "@/utils/serverSideRenderReturnConditions";
import i18n from "i18";

type Props = {};

type Tform = {
  tilaka_name: string;
  password: string;
};

const LinkAccount = (props: Props) => {
  const router = useRouter();
  const { t }: any = i18n;
  const [showPassword, showPasswordSetter] = useState<boolean>(false);
  const [nikRegistered, nikRegisteredSetter] = useState<boolean>(true);
  const [form, formSetter] = useState<Tform>({ tilaka_name: "", password: "" });
  const { nik, request_id, signing, setting, ...restRouterQuery } =
    router.query;
  const dispatch: AppDispatch = useDispatch();
  const data = useSelector((state: RootState) => state.login);

  const handleFormOnChange = (e: React.FormEvent<HTMLInputElement>): void => {
    formSetter({ ...form, [e.currentTarget.name]: e.currentTarget.value });
  };

  const handleFormOnSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      tilaka_name: { value: Tform["tilaka_name"] };
      password: { value: Tform["password"] };
    };

    const tilaka_name = target.tilaka_name.value;
    const password = target.password.value;

    dispatch(
      login({
        password,
        nik,
        tilaka_name,
        request_id,
        ...restRouterQuery,
      } as TLoginProps)
    );
  };

  useEffect(() => {
    if (data.status === "FULLFILLED" && data.data.success) {
      let queryWithDynamicRedirectURL = {
        ...router.query,
      };
      if (data.data.message.length > 0) {
        queryWithDynamicRedirectURL["redirect_url"] = data.data.message;
      }
      localStorage.setItem("refresh_token", data.data.data[1] as string);
      localStorage.setItem("token", data.data.data[0] as string);
      if (signing === "1" || setting === "1") {
        getCertificateList({ params: "" as string }).then((res) => {
          const certif = JSON.parse(res.data);
          if (certif[0].status == "Aktif") {
            getUserName({}).then((res) => {
              const data = JSON.parse(res.data);
              if (data.typeMfa == null) {
                if (setting === "1") {
                  router.replace({
                    pathname: handleRoute("setting-signature-and-mfa"),
                    query: {
                      ...queryWithDynamicRedirectURL,
                      tilaka_name: form.tilaka_name
                    },
                  });
                } else {
                  router.replace({
                    pathname: handleRoute("link-account/success"),
                    query: { ...queryWithDynamicRedirectURL },
                  });
                }
              } else {
                router.replace({
                  pathname: handleRoute("link-account/success"),
                  query: { ...queryWithDynamicRedirectURL },
                });
              }
            });
          } else {
            router.replace({
              pathname: handleRoute("certificate-information"),
              query: { ...queryWithDynamicRedirectURL, tilaka_name: form.tilaka_name },
            });
          }
        });
      } else {
        router.replace({
          pathname: handleRoute("link-account/success"),
          query: { ...queryWithDynamicRedirectURL },
        });
      }
    } else if (
      data.status === "REJECTED" ||
      (data.status === "FULLFILLED" && !data.data.success)
    ) {
      router.replace({
        pathname: handleRoute("link-account/failure"),
        query: {
          ...router.query,
        },
      });
    }
  }, [data.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Head>
        <title>{t("linkAccountTitle")}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="px-5 py-9">
        <p className="text-lg poppins-semibold text-neutral800">
          {t("linkAccountTitle")}
        </p>
        <div className="flex justify-center mt-6">
          <Image
            src={`${assetPrefix}/images/linkAccount.svg`}
            width="150px"
            height="150px"
            alt="linkAccount-ill"
          />
        </div>
        {nikRegistered && (
          <p className="poppins-regular text-sm text-neutral800 mt-5">
            {t("linkAccountSubtitle")}
          </p>
        )}
        <form onSubmit={handleFormOnSubmit}>
          <label className="block mt-4">
            <div className="flex justify-start items-center">
              <p className="poppins-regular text-sm text-neutral200 pl-2.5">
                Tilaka Name
              </p>
              <div className="tooltip poppins-regular">
                <p className="text-white bg-neutral200 w-3 h-3 flex justify-center items-center text-xs rounded-full ml-1">
                  ?
                </p>
                <span className="tooltiptext text-xs">
                  {t("linkAccountTooltip")}
                </span>
              </div>
            </div>
            <div className="mt-1 relative">
              <input
                type="text"
                name="tilaka_name"
                placeholder={t("linkAccountPlaceholder")}
                value={form.tilaka_name}
                onChange={handleFormOnChange}
                className="px-2.5 py-3 w-full focus:outline-none text-sm text-neutral800 poppins-regular border border-neutral40 rounded-md"
              />
            </div>
          </label>
          <label className="block mt-6">
            <div className="flex justify-start items-center">
              <p className="font-poppins text-sm text-neutral200 pl-2.5">
                {t("linkAccountPasswordInputlabel")}
              </p>
            </div>
            <div className="mt-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("passwordPlaceholder")}
                value={form.password}
                onChange={handleFormOnChange}
                className="px-2.5 py-3 w-full focus:outline-none text-sm text-neutral800 poppins-regular border border-neutral40 rounded-md"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  showPasswordSetter(!showPassword);
                }}
                className="absolute right-2.5 top-3 bg-white"
              >
                {showPassword ? <EyeIconOff /> : <EyeIcon />}
              </button>
            </div>
          </label>
          <div className="flex justify-center items-center mt-10">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${process.env.NEXT_PUBLIC_PORTAL_URL}/public/reset-pass-req.xhtml`}
              className="poppins-regular text-primary text-xs"
            >
              {t("linkAccountForgotPasswordButton")}
            </a>
            <div className="block mx-2.5">
              <Image
                src={`${assetPrefix}/images/lineVertical.svg`}
                width="8px"
                height="24px"
                alt="lineVertical"
              />
            </div>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${process.env.NEXT_PUBLIC_PORTAL_URL}/public/forgot-tilaka-name.xhtml`}
              className="poppins-regular text-primary text-xs"
            >
              {t("linkAccountForgotTilakaName")}
            </a>
          </div>
          <button
            type="submit"
            disabled={!form.tilaka_name || !form.password}
            className="mt-16 w-full p-2.5 uppercase text-base poppins-regular disabled:opacity-50 text-white rounded-sm bg-primary"
          >
            {t("linkAccountCTA")}
          </button>
        </form>
        <div className="mt-8 flex justify-center">
          <Image
            src={`${assetPrefix}/images/poweredByTilaka.svg`}
            alt="powered-by-tilaka"
            width="80px"
            height="41.27px"
          />
        </div>
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

export default LinkAccount;

// const LinkAccountProcess = (props: Props) => {
//   return (
//     <div className="px-10 pt-16 pb-9 text-center">
//       <p className="font-poppins text-base font-semibold text-neutral800">
//         Penautan Akun Berhasil!
//       </p>
//       <div className="mt-20">
//         <Image
//           src="/images/linkAccountSuccess.svg"
//           width="196px"
//           height="196px"
//         />
//       </div>
//       <div className="mt-24">
//         <Image
//           src="/images/loader.svg"
//           width="46.22px"
//           height="48px"
//           className="animate-spin"
//         />
//         <p className="font-poppins text-sm text-neutral50">Mohon menunggu...</p>
//       </div>
//       <div className="mt-11 flex justify-center">
//         <Image
//           src="/images/poweredByTilaka.svg"
//           alt="powered-by-tilaka"
//           width="80px"
//           height="41.27px"
//         />
//       </div>
//     </div>
//   );
// };
