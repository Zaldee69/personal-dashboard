import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Footer from "../../components/Footer";
import { RestKycCheckStep, RestKycFinalForm } from "../../infrastructure";
import EyeIcon from "../../public/icons/EyeIcon";
import EyeIconOff from "./../../public/icons/EyeIconOff";
import QuestionIcon from "./../../public/icons/QuestionIcon";
import Head from "next/head";
import XIcon from "@/public/icons/XIcon";
import CheckOvalIcon from "@/public/icons/CheckOvalIcon";
import i18n from "i18";
import { assetPrefix } from "../../next.config";
import { handleRoute } from "@/utils/handleRoute";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";
interface InputType {
  password: string | number;
  confirmPassword: string | number;
  tilakaName: string | number;
}

interface ErrorType {
  password: string;
  confirmPassword: string;
  tilakaName: string;
}

interface Type {
  password: string;
  confirmPassword: string;
}

const Form: React.FC = () => {
  const router = useRouter();
  const { request_id, ...restRouterQuery } = router.query;
  const [input, setInput] = useState<InputType>({
    password: "",
    confirmPassword: "",
    tilakaName: "",
  });

  const [error, setError] = useState<ErrorType>({
    password: "",
    confirmPassword: "",
    tilakaName: "",
  });

  const [type, setType] = useState<Type>({
    password: "password",
    confirmPassword: "password",
  });

  const { t }: any = i18n;

  const [isChecked, setIsCheked] = useState<boolean>(false);
  const disabled =
    !input.password ||
    !input.confirmPassword ||
    !input.tilakaName ||
    error.tilakaName ||
    error.confirmPassword ||
    error.password ||
    !isChecked;

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "tnc") {
      setIsCheked(e.target.checked);
      console.log(e.target.checked);
    } else {
      setInput((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setError((prev) => {
      const stateObj = { ...prev, [name]: "" };

      switch (name) {
        case "tilakaName":
          if (!value) {
            stateObj[name] = t("tilakaNameErrorRequired");
          } else if (
            !/^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z_]{6,15}$/.test(value)
          ) {
            stateObj[name] = t("tilakaNameWrongFormat");
          }
          break;

        case "password":
          if (!value) {
            stateObj[name] = t("passwordRequired");
          } else if (
            !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])[0-9a-zA-Z@#$%^&+=]{10,40}$/.test(
              value
            )
          ) {
            stateObj[name] = t("passwordWrongFormat");
          } else if (input.password && value !== input.confirmPassword) {
            stateObj["confirmPassword"] = t("passwordNotMatch");
          } else {
            stateObj["confirmPassword"] = input.confirmPassword
              ? ""
              : error.confirmPassword;
          }
          break;

        case "confirmPassword":
          if (!value) {
            stateObj[name] = t("passwordConfirmationRequired");
          } else if (
            !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])[0-9a-zA-Z@#$%^&+=]{10,40}$/
          ) {
            stateObj[name] = t("passwordWrongFormat");
          } else if (input.password && value !== input.password) {
            stateObj[name] = t("passwordNotMatch");
          }
          break;

        default:
          break;
      }

      return stateObj;
    });
  };
  const handleShowPwd = (
    types: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    switch (types) {
      case "password":
        setType((prev) => ({
          ...prev,
          password: type.password === "password" ? "text" : "password",
        }));
        break;

      case "confirmPassword":
        setType((prev) => ({
          ...prev,
          confirmPassword:
            type.confirmPassword === "password" ? "text" : "password",
        }));
    }
  };
  const onSubmitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      tilakaName: { value: string };
      password: { value: string };
    };
    const tilakaName = target.tilakaName.value;
    const password = target.password.value;

    RestKycFinalForm({
      payload: { tilakaName, password, registerId: request_id as string },
    })
      .then((res) => {
        if (res.success) {
          toast.dismiss("kycCheckStepRequestToast");
          toast.success(res?.message || "berhasil", {
            icon: <CheckOvalIcon />,
          });

          const query: any = {
            request_id,
            ...restRouterQuery,
          };

          if (res.data.reason_code) {
            query.reason_code = res.data.reason_code;
          }

          router.replace({
            pathname: handleRoute("form/success"),
            query,
          });
        } else {
          toast.dismiss("kycCheckStepRequestToast");
          toast.error(res?.message || "gagal", { icon: <XIcon /> });
        }
      })
      .catch((err) => {
        toast.dismiss("kycCheckStepRequestToast");
        if (err.response?.data?.data?.errors?.[0]) {
          toast.error(
            `${err.response?.data?.message}, ${err.response?.data?.data?.errors?.[0]}`,
            { icon: <XIcon /> }
          );
        } else {
          toast.error(err.response?.data?.message || "gagal", {
            icon: <XIcon />,
          });
        }
      });
  };

  useEffect(() => {
    if (!router.isReady) return;
    toast.info("pengecekan step...", { toastId: "kycCheckStepRequestToast" });
    RestKycCheckStep({ payload: { registerId: request_id as string } })
      .then((res) => {
        if (res.success) {
          if (res.data.status === "D") {
            toast.dismiss("kycCheckStepRequestToast");
            toast.success(res?.message || "pengecekan step berhasil", {
              icon: <CheckOvalIcon />,
            });
            // ketika res.data.pin_form === false, tidak akan redirect kemana-mana, karena sudah benar dihalaman ini.
            if (res.data.pin_form) {
              router.replace({
                pathname: handleRoute("kyc/pinform"),
                query: { ...restRouterQuery, registration_id: request_id },
              });
            }
          } else if (res.data.status === "F") {
            toast.dismiss("kycCheckStepRequestToast");
            toast.error(
              res?.message ||
                "pengecekan step berhasil, tetapi proses ekyc bermasalah",
              {
                icon: <XIcon />,
              }
            );
            if (
              res.data.status === "F" &&
              res.data.pin_form &&
              restRouterQuery.redirect_url
            ) {
              window.top!.location.href = concateRedirectUrlParams(
                restRouterQuery.redirect_url as string,
                `request_id=${request_id}${
                  res.data.reason_code
                    ? "%26reason_code=" + res.data.reason_code
                    : ""
                }`
              );
            } else {
              const query: any = {
                ...restRouterQuery,
                request_id,
              };

              if (res.data.reason_code) {
                query.reason_code = res.data.reason_code;
              }

              router.push({
                pathname: handleRoute("liveness-failure"),
                query,
              });
            }
          } else if (res.data.status === "S" || res.data.status === "E") {
            toast.dismiss("kycCheckStepRequestToast");
            const params: any = {
              register_id: request_id,
              status: res.data.status,
            };

            if (res.data.reason_code) {
              params.reason_code = res.data.reason_code;
            }

            const queryString = new URLSearchParams(params as any).toString();
            if (restRouterQuery.redirect_url) {
              window.top!.location.href = concateRedirectUrlParams(
                restRouterQuery.redirect_url as string,
                queryString
              );
            } else {
              toast.success(res?.message || "pengecekan step berhasil", {
                icon: <CheckOvalIcon />,
              });
            }
          } else if (res.data.status === "B") {
            toast.dismiss("kycCheckStepRequestToast");
            router.push({
              pathname: handleRoute("guide"),
              query: { ...restRouterQuery, request_id },
            });
          } else {
            toast.dismiss("kycCheckStepRequestToast");
            toast.success(res?.message || "pengecekan step berhasil", {
              icon: <CheckOvalIcon />,
            });
          }
        } else {
          toast.dismiss("kycCheckStepRequestToast");
          toast.error(res?.message || "pengecekan step tidak sukses", {
            icon: <XIcon />,
          });
        }
      })
      .catch((err) => {
        toast.dismiss("kycCheckStepRequestToast");
        if (err.response?.data?.data?.errors?.[0]) {
          toast.error(err.response?.data?.data?.errors?.[0], {
            icon: <XIcon />,
          });
        } else {
          toast.error(err.response?.data?.message || "pengecekan step gagal", {
            icon: <XIcon />,
          });
        }
      });
  }, [router.isReady, request_id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Head>
        <title>{t("finalFormTitle")}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="px-5 pt-8 sm:w-full md:w-4/5 mx-auto">
        <h1 className="font-poppins font-semibold text-xl">
          {t("finalFormTitle")}
        </h1>
        <div className="flex justify-center mt-10">
          <Image
            width={200}
            height={200}
            src={`${assetPrefix}/images/form.svg`}
            alt="imgform"
          />
        </div>
        <span className="font-poppins text-left block mt-5">
          {t("finalFormSubtitle")}
        </span>
        <form autoComplete="off" className="mt-10" onSubmit={onSubmitHandler}>
          <div className="flex flex-col">
            <div className="flex flex-row">
              <label
                className="font-poppins px-2 text-label font-light"
                htmlFor="tilakaName"
              >
                Tilaka Name
              </label>
              <div className="relative flex flex-col items-center group">
                <QuestionIcon />
                <div className="absolute left-9 -top-10  w-48   flex-col items-center hidden mb-6 group-hover:flex">
                  <span className="relative z-10 p-2 text-xs rounded-md font-poppins w-full text-white whitespace-no-wrap bg-neutral shadow-lg">
                    {t("finalFormTooltip")}
                  </span>
                  <div className="w-3 h-3 -mt-16 mr-48 rotate-45 bg-neutral"></div>
                </div>
              </div>
            </div>

            <input
              onChange={(e) => onChangeHandler(e)}
              name="tilakaName"
              autoComplete="off"
              type="text"
              placeholder={t("tilakaNamePlaceHolder")}
              className={`font-poppins py-3 focus:outline-none  placeholder:text-placeholder placeholder:font-light   px-2 rounded-md border border-borderColor ${
                error.tilakaName
                  ? "border-error "
                  : "border-borderColor focus:ring"
              }`}
            />
            <p className="text-error font-poppins pl-2 pt-2 block text-sm">
              {error.tilakaName}
            </p>
          </div>
          <div className="flex flex-col  mt-5">
            <label
              className="font-poppins px-2 text-label font-light"
              htmlFor="password"
            >
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <input
                onChange={(e) => onChangeHandler(e)}
                name="password"
                type={type.password}
                placeholder={t("passwordPlaceholder")}
                className={`font-poppins py-3 focus:outline-none  placeholder:text-placeholder placeholder:font-light  px-2 rounded-md border  w-full ${
                  error.password
                    ? "border-error "
                    : "border-borderColor focus:ring"
                }`}
                autoComplete="off"
              />
              <button
                onClick={(e) => handleShowPwd("password", e)}
                className="absolute right-3 top-3"
              >
                {type.password === "password" ? <EyeIcon /> : <EyeIconOff />}
              </button>
              <p className="text-error font-poppins pl-2 pt-2 block text-sm">
                {error.password}
              </p>
            </div>
          </div>
          <div className="flex flex-col mt-5">
            <label
              className="font-poppins px-2 text-label font-light"
              htmlFor="retype-password"
            >
              {t("passwordConfirmationLabel")}
            </label>
            <div className="relative">
              <input
                onChange={(e) => onChangeHandler(e)}
                name="confirmPassword"
                type={type.confirmPassword}
                placeholder={t("passwordConfirmationPlaceholder")}
                className={`font-poppins py-3 focus:outline-none  placeholder:text-placeholder placeholder:font-light  px-2 rounded-md border border-borderColor w-full ${
                  error.confirmPassword
                    ? "border-error "
                    : "border-borderColor focus:ring"
                } `}
              />
              <button
                onClick={(e) => handleShowPwd("confirmPassword", e)}
                className="absolute right-3 top-3"
              >
                {type.confirmPassword === "password" ? (
                  <EyeIcon />
                ) : (
                  <EyeIconOff />
                )}
              </button>
              <p className="text-error font-poppins pl-2 pt-2 block text-sm">
                {error.confirmPassword}
              </p>
            </div>
          </div>
          <div className="flex flex-row mt-5">
            <input
              id="tnc"
              name="tnc"
              type="checkbox"
              className=" border-borderColor"
              onChange={onChangeHandler}
            />
            <label className="ml-2 text-neutral font-poppins " htmlFor="tnc">
              {t("agree")}{" "}
              <span className="text-primary">
                <a
                  href="https://repository.tilaka.id/CP_CPS.pdf"
                  target="blank"
                >
                  CP/CPS
                </a>
                ,{" "}
                <a
                  href="https://repository.tilaka.id/kebijakan-jaminan.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("warranty")}
                </a>
                ,{" "}
                <a
                  href="https://repository.tilaka.id/kebijakan-privasi.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("privacy")}
                </a>
                ,{" "}
              </span>
              {t("and")}
              <a
                target="blank"
                href="https://repository.tilaka.id/perjanjian-pemilik-sertifikat.pdf"
                className="text-primary"
              >
                {" "}
                {t("certificate")}
              </a>
            </label>
          </div>
          <button
            disabled={disabled as boolean}
            className={`bg-primary mt-10 md:mx-auto md:block md:w-1/4 uppercase text-white font-poppins w-full mx-auto rounded-sm h-9 disabled:opacity-50
          }`}
          >
            {t("CTA")}
          </button>
        </form>
        <Footer />
      </div>
    </>
  );
};

export default Form;
