import React, { useState, useEffect } from "react";
import { getCertificateList, getUserName } from "infrastructure/rest/b2b";
import Footer from "@/components/Footer";
import EyeIcon from "@/public/icons/EyeIcon";
import EyeIconOff from "@/public/icons/EyeIconOff";
import { AppDispatch, RootState } from "@/redux/app/store";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/redux/slices/loginSlice";
import { TLoginProps } from "@/interface/interface";
import Head from "next/head";
import toastCaller from "@/utils/toastCaller";
import { toast } from "react-toastify";
import XIcon from "@/public/icons/XIcon";
import { useRouter } from "next/router";
import { handleRoute } from "./../../utils/handleRoute";
import Image from "next/image";
import { assetPrefix } from "../../next.config";
import { RestKycCheckStep } from "infrastructure";
import { GetServerSideProps } from "next";
import { TKycCheckStepResponseData } from "infrastructure/rest/kyc/types";
import { serverSideRenderReturnConditions } from "@/utils/serverSideRenderReturnConditions";
import i18n from "i18";

type Props = {
  channel_id: string;
  pathname: string;
};

type ModalProps = {
  certifModal: boolean;
  setCertifModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const Login = () => {
  const [password, setPassword] = useState<string>("");
  const [tilakaName, setTilakaName] = useState("");
  const [certifModal, setCertifModal] = useState<boolean>(false);
  const [type, setType] = useState<{ password: string }>({
    password: "password",
  });
  const {t}: any = i18n
  const dispatch: AppDispatch = useDispatch();
  const data = useSelector((state: RootState) => state.login);
  const router = useRouter();
  const { channel_id, tilaka_name, company_id, transaction_id, signing } = router.query;

  useEffect(() => {
    if (router.isReady) {
      setTilakaName(tilaka_name as string);
    }
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data.status === "FULLFILLED" && data.data.success) {
      let queryWithDynamicRedirectURL = {
        ...router.query,
      };
      if (data.data.message.length > 0) {
        queryWithDynamicRedirectURL["redirect_url"] = data.data.message;
      }
      localStorage.setItem("token", data.data.data[0] as string);
      localStorage.setItem("refresh_token", data.data.data[1] as string);
      getCertificateList({ params: company_id as string }).then((res) => {
        const certif = JSON.parse(res.data);
        if (!transaction_id && signing === "1") {
          toast.dismiss("success");
          toast("Transaction ID tidak boleh kosong", {
            type: "error",
            toastId: "error",
            position: "top-center",
            icon: XIcon,
          });
        } else {
          if (certif[0].status == "Aktif") {
            getUserName({}).then((res) => {
              const data = JSON.parse(res.data);
              if(data.typeMfa == null) {
                router.replace({
                  pathname: handleRoute("setting-signature-and-mfa"),
                  query: {
                    ...queryWithDynamicRedirectURL,
                  },
                });
              } else {
                router.replace({
                  pathname: handleRoute("signing"),
                  query: {
                    ...queryWithDynamicRedirectURL,
                  },
                });
              }
            });
          } else if (
            certif[0].status === "Revoke" ||
            certif[0].status === "Expired" ||
            certif[0].status === "Enroll"
          ) {
            setCertifModal(true);
          } else {
            router.replace({
              pathname: handleRoute("certificate-information"),
              query: {
                ...queryWithDynamicRedirectURL,
              },
            });
          }
        }
      });
    }
    toastCaller(data);
  }, [data.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setPassword(e.target.value);
  };

  const submitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(login({ password, channel_id, tilaka_name, company_id, transaction_id,} as TLoginProps));
    setPassword("");
  };

  const handleShowPwd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setType((prev) => ({
      ...prev,
      password: type.password === "password" ? "text" : "password",
    }));
  };
  return (
    <>
      <CertifModal setCertifModal={setCertifModal} certifModal={certifModal} />
      <Head>
        <title>Tilaka</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="px-5 pt-8 max-w-screen-sm sm:w-full md:w-4/5 mx-auto">
        <div className="flex flex-col gap-5 mt-10 items-center">
          <div className="h-14 w-14 poppins-semibold flex text-xl items-center justify-center name text-white bg-[#64bac3] rounded-full">
            {tilakaName?.[0]?.toUpperCase()}
          </div>
          <span className="font-bold text-xl text-[#172b4d] poppins-regular">
            {t("hi")}, {tilaka_name}
          </span>
        </div>
        <form onSubmit={submitHandler}>
          <div className="flex flex-col  mt-20">
            <label
              className="poppins-regular px-2 text-label font-light"
              htmlFor="password"
            >
              {t("passwordLabel")}
            </label>
            <div className="relative flex-1">
              <input
                onChange={(e) => onChangeHandler(e)}
                value={password}
                name="password"
                type={type.password}
                placeholder={t("passwordPlaceholder")}
                className={`poppins-regular py-3 focus:outline-none border-borderColor focus:ring  placeholder:text-placeholder placeholder:font-light px-2 rounded-md border w-full`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={(e) => handleShowPwd(e)}
                className="absolute right-3 top-3"
              >
                {type.password === "password" ? <EyeIcon /> : <EyeIconOff />}
              </button>
            </div>
            <a
              className="m-5 text-center poppins-regular text-primary"
              target="_blank"
              rel="noopener noreferrer"
              href={`${process.env.NEXT_PUBLIC_PORTAL_URL}/public/reset-pass-req.xhtml`}
            >
              {t("linkAccountForgotPasswordButton")}
            </a>
          </div>
          <button
            type="submit"
            disabled={password.length < 1}
            className="bg-primary uppercase disabled:opacity-50 mt-32 text-xl md:mx-auto md:block md:w-1/4 text-white poppins-regular w-full mx-auto rounded-sm h-11"
          >
            {t("loginCTA")}
          </button>
        </form>
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

export default Login;

const CertifModal = ({ certifModal, setCertifModal }: ModalProps) => {
  const {t}: any = i18n
  return certifModal ? (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
      className="fixed z-50 flex items-start transition-all duration-1000 pb-3 justify-center w-full left-0 top-0 h-full "
    >
      <div className="bg-white max-w-md mt-20 pt-5 px-2 pb-3 rounded-xl w-full mx-5">
        <p className="text-center font-poppins font-semibold">
          {t("dontHaveCertifTitle")}
        </p>
        <div className="flex flex-col justify-center">
          <Image
            src={`${assetPrefix}/images/certif.svg`}
            width={100}
            height={100}
            alt="cert"
          />
          <p className="text-center font-poppins mt-5">
           {t("dontHaveCertifSubtitle")}
          </p>
        </div>
        <button className="bg-primary uppercase btn mt-8 disabled:opacity-50 text-white font-poppins w-full mx-auto rounded-sm h-9">
          {t("createNewCertif")}
        </button>
        <button
          onClick={() => {
            // restLogout({})
            setCertifModal(false);
          }}
          className="  text-[#97A0AF] uppercase font-poppins w-full mt-4  mx-auto rounded-sm h-9"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  ) : null;
};
