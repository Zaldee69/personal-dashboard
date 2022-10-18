import PinFormComponent from "@/components/PinFormComponent";
import i18n from "i18";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";
import { handleRoute } from "@/utils/handleRoute";
import { RestKycCheckStep, RestKycFinalForm } from "infrastructure";
import { RestPersonalSetPassword } from "infrastructure/rest/personal";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

type Props = {};

type TUrlQuery = {
  random?: "1";
  user_identifier?: string;
  registration_id?: string;
  redirect_url?: string;
  token?: string; // for setPassword after success manual form
};

const PinFormDedicatedChannel = (props: Props) => {
  const router = useRouter();
  const {t} = i18n
  const {
    random,
    user_identifier,
    registration_id,
    redirect_url,
    token,
    ...restRouterQuery
  }: NextParsedUrlQuery & TUrlQuery = router.query;
  const isRandom: boolean = random === "1";
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<{
    isError: boolean;
    message: string;
  }>({ isError: false, message: "" });
  const [pinConfirmError, setPinConfirmError] = useState<{
    isError: boolean;
    message: string;
  }>({ isError: false, message: "" });
  const [pinConfirmErrorAfterSubmit, setPinConfirmErrorAfterSubmit] = useState<{
    isError: boolean;
    message: string;
  }>({ isError: false, message: "" });
  const [isConfirmMode, setIsConfirmMode] = useState<boolean>(false);
  const [isRequestCheckStatus, setIsRequestCheckStatus] =
    useState<boolean>(false);

  const digitLength: number = 6;

  const onClickNumberHandlerCallback = (value: number) => {};
  const onClickDeleteHandlerCallback = () => {};
  const submitFormCallback = (pin: string) => {
    setPin(pin);
    setIsConfirmMode(true);
  };
  const onClickNumberHandlerConfirmCallback = (value: number) => {
    setPinConfirmError({ isError: false, message: "" });
  };
  const onClickDeleteHandlerConfirmCallback = () => {
    setPinConfirmError({ isError: false, message: "" });
  };
  const submitFormConfirmCallback = (pinConfirm: string) => {
    if (pin !== pinConfirm) {
      setPinConfirmErrorAfterSubmit({
        isError: true,
        message: t("confirmPinDoesntMatch"),
      });
      return;
    }

    setPinConfirmErrorAfterSubmit({ isError: false, message: "" });

    const tilakaName = user_identifier || "";
    const password = pin;

    if (token) {
      RestPersonalSetPassword({
        payload: {
          register_id: registration_id as string,
          token: token,
          password,
        },
      })
        .then((res) => {
          if (res.success) {
            setIsConfirmMode(false);
            if (redirect_url) {
              const params = {
                register_id: registration_id,
                status: "F",
              };
              const queryString = new URLSearchParams(params as any).toString();
              window.top!.location.href = concateRedirectUrlParams(
                redirect_url as string,
                queryString
              );
            }
          } else {
            setPinConfirmError({
              isError: true,
              message: res?.message || "gagal",
            });
          }
        })
        .catch((err) => {
          setPinConfirmError({
            isError: true,
            message: err.response?.data?.message || "gagal",
          });
        });
    } else {
      RestKycFinalForm({
        payload: {
          tilakaName,
          password,
          registerId: registration_id as string,
        },
      })
        .then((res) => {
          if (res.success) {
            setIsConfirmMode(false);
            if (redirect_url) {
              const params = {
                register_id: registration_id,
                status: res.data.status === "E" ? "S" : res.data.status,
              };
              const queryString = new URLSearchParams(params as any).toString();
              window.top!.location.href = concateRedirectUrlParams(
                redirect_url as string,
                queryString
              );
            }
          } else {
            setPinConfirmError({
              isError: true,
              message: res?.message || "gagal",
            });
          }
        })
        .catch((err) => {
          if (err.response?.data?.data?.errors?.[0]) {
            setPinConfirmError({
              isError: true,
              message: `${err.response?.data?.message}, ${err.response?.data?.data?.errors?.[0]}`,
            });
          } else {
            setPinConfirmError({
              isError: true,
              message: err.response?.data?.message || "gagal",
            });
          }
        });
    }
  };

  const onClickBack = (_: React.SyntheticEvent) => {
    setPin("");
    setPinError({ isError: false, message: "" });
    setPinConfirmError({ isError: false, message: "" });
    setPinConfirmErrorAfterSubmit({ isError: false, message: "" });
    setIsConfirmMode(false);
    setIsRequestCheckStatus(false);
  };

  useEffect(() => {
    if (!router.isReady) return;
    setShouldRender(true);
    setIsRequestCheckStatus(true);
    RestKycCheckStep({
      payload: { registerId: registration_id as string },
    })
      .then((res) => {
        if (res.success) {
          setIsRequestCheckStatus(false);
          if (res.data.status === "D") {
            if (!res.data.pin_form) {
              router.push({
                pathname: handleRoute("form"),
                query: {
                  ...restRouterQuery,
                  request_id: registration_id,
                  redirect_url,
                },
              });
            } else {
              // should stay.
              return;
            }
          } else if (res.data.status === "E" || res.data.status === "F") {
              if (!res.data.pin_form) {
                if (redirect_url) {
                  const params = {
                    register_id: registration_id,
                    status: res.data.status,
                  };
                  const queryString = new URLSearchParams(
                    params as any
                  ).toString();
                  window.top!.location.href = concateRedirectUrlParams(
                    redirect_url as string,
                    queryString
                  );
                } else {
                  router.push({
                    pathname: handleRoute("liveness-failure"),
                    query: {
                      ...restRouterQuery,
                      request_id: registration_id,
                      redirect_url,
                    },
                  });
                }
              } else {
                // should stay.
                return;
              }
          } else if (res.data.status === "S") {
            const params = {
              register_id: registration_id,
              status: res.data.status,
            };
            const queryString = new URLSearchParams(params as any).toString();
            if (redirect_url) {
              window.top!.location.href = concateRedirectUrlParams(
                redirect_url as string,
                queryString
              );
            } else {
              setPinError({
                isError: true,
                message: res?.message || "pengecekan step berhasil",
              });
              setIsRequestCheckStatus(true);
            }
          }
        } else {
          setPinError({
            isError: true,
            message: res?.message || "pengecekan step tidak sukses",
          });
          setIsRequestCheckStatus(true);
        }
      })
      .catch((err) => {
        if (err.response?.data?.data?.errors?.[0]) {
          setPinError({
            isError: true,
            message: err.response?.data?.data?.errors?.[0],
          });
          setIsRequestCheckStatus(true);
        } else {
          setPinError({
            isError: true,
            message: err.response?.data?.message || "pengecekan step gagal",
          });
          setIsRequestCheckStatus(true);
        }
      });
  }, [router.isReady, registration_id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shouldRender) return;

  return (
    <div className="flex justify-center items-center min-h-screen px-3 pt-3 pb-5">
      {isConfirmMode ? (
        <div className="max-w- w-full" style={{ maxWidth: "331px" }}>
          <PinFormComponent
            key="pinFormConfirmKey"
            title={t("confirmPinTitle")}
            subTitle={t("confirmPinSubtitle")}
            digitLength={digitLength}
            isRandom={isRandom}
            onClickNumberHandlerCallback={onClickNumberHandlerConfirmCallback}
            onClickDeleteHandlerCallback={onClickDeleteHandlerConfirmCallback}
            submitFormCallback={submitFormConfirmCallback}
            isResetAfterSubmit={false}
            isErrorAfterSubmit={pinConfirmErrorAfterSubmit.isError}
            isErrorAfterSubmitMessage={pinConfirmErrorAfterSubmit.message}
            isError={pinConfirmError.isError}
            isErrorMessage={pinConfirmError.message}
            backButton={{
              show: true,
              onClickBackCallback: onClickBack,
            }}
            showPoweredByTilaka
          />
        </div>
      ) : (
        <div className="max-w- w-full" style={{ maxWidth: "331px" }}>
          <PinFormComponent
            key="pinFormKey"
            title={t("createPinTitle")}
            digitLength={digitLength}
            isRandom={isRandom}
            onClickNumberHandlerCallback={onClickNumberHandlerCallback}
            onClickDeleteHandlerCallback={onClickDeleteHandlerCallback}
            submitFormCallback={submitFormCallback}
            isResetAfterSubmit
            isError={pinError.isError}
            isErrorMessage={pinError.message}
            isButtonNumberDisabled={isRequestCheckStatus}
            subTitle={t("createPinSubtitle")}
            showPoweredByTilaka
          />
        </div>
      )}
    </div>
  );
};

export default PinFormDedicatedChannel;
