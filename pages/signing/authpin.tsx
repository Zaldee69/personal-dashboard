import PinFormComponent from "@/components/PinFormComponent";
import { RestSigningAuthPIN } from "infrastructure";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";
import i18n from "i18";

type Props = {};

const AuthPinForm = (props: Props) => {
  const router = useRouter();
  const {
    random,
    user,
    id,
    redirect_url,
  }: NextParsedUrlQuery & {
    random?: "1";
    user?: string;
    id?: string;
    redirect_url?: string;
  } = router.query;
  const isRandom: boolean = random === "1";
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<{
    isError: boolean;
    message: string;
  }>({ isError: false, message: "" });
  const [isButtonNumberDisabled, setIsButtonNumberDisabled] =
    useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);

  const digitLength: number = 6;
  const { t }: any = i18n;

  const onClickNumberHandlerCallback = (value: number) => {};
  const onClickDeleteHandlerCallback = () => {
    setPinError({ isError: false, message: "" });
  };
  const submitFormCallback = (pin: string) => {
    setIsButtonNumberDisabled(true);
    setIsProcessed(true);

    setPin(pin);
    RestSigningAuthPIN({
      payload: {
        user: user || "",
        pin,
        id: id || "",
        async: router.query.async as string
      },
    })
      .then((res) => {
        if (res.success) {
          setPinError({
            isError: false,
            message: res?.message || "penandatanganan dokumen berhasil",
          });
          if (redirect_url) {
            const params = {
              user_identifier: user,
              signing_id: id,
              status: "Sukses",
            };
            const queryString = new URLSearchParams(params as any).toString();
            window.top!.location.href = concateRedirectUrlParams(
              redirect_url as string,
              queryString
            );
          } else {
            setIsButtonNumberDisabled(false);
            setIsProcessed(false);
          }
        } else {
          setPinError({
            isError: true,
            message: res?.message || t("authPinError2"),
          });
          if (
            res?.message ===
              "penandatanganan dokumen gagal. pin sudah salah 3 kali" &&
            redirect_url
          ) {
            const params = {
              user_identifier: user,
              signing_id: id,
              status: "Blocked",
            };
            const queryString = new URLSearchParams(params as any).toString();
            setTimeout(() => {
              window.top!.location.href = concateRedirectUrlParams(
                redirect_url as string,
                queryString
              );
            }, 2000);
          } else {
            setIsButtonNumberDisabled(false);
            setIsProcessed(false);
          }
        }
      })
      .catch((err) => {
        if (err.response?.data?.data?.errors?.[0]) {
          setPinError({
            isError: true,
            message: `${err.response?.data?.message}, ${err.response?.data?.data?.errors?.[0]}`,
          });
        } else {
          setPinError({
            isError: true,
            message: err.response?.data?.message || t("authPinError2"),
          });
        }
        setIsButtonNumberDisabled(false);
        setIsProcessed(false);
      });
  };

  useEffect(() => {
    if (!router.isReady) return;
    setShouldRender(true);
    if (!user || !id) {
      setPinError({
        isError: true,
        message: "user atau id dibutuhkan",
      });
      setIsButtonNumberDisabled(true);
    }
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shouldRender) return;

  return (
    <div className="flex justify-center items-center min-h-screen px-3 pt-3 pb-5">
      <div className="max-w- w-full" style={{ maxWidth: "331px" }}>
        <PinFormComponent
          key="pinFormKey"
          title={"PIN"}
          subTitle={t("authPinSubtitle")}
          digitLength={digitLength}
          isRandom={isRandom}
          onClickNumberHandlerCallback={onClickNumberHandlerCallback}
          onClickDeleteHandlerCallback={onClickDeleteHandlerCallback}
          submitFormCallback={submitFormCallback}
          isResetAfterSubmit
          isErrorAfterSubmit={pinError.isError}
          isErrorAfterSubmitMessage={pinError.message}
          isButtonNumberDisabled={isButtonNumberDisabled}
          isProcessed={isProcessed}
          showPoweredByTilaka
        />
      </div>
    </div>
  );
};

export default AuthPinForm;
