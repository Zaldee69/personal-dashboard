import Image from "next/image";
import { useEffect, useState, useRef, Dispatch, SetStateAction } from "react";
import { useDispatch, useSelector } from "react-redux";
import Head from "next/head";
import { AppDispatch, RootState } from "@/redux/app/store";
import Camera, { IdeviceState } from "../../components/Camera";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  RestKycCheckStep,
  RestKycGenerateAction,
  RestKycVerification,
} from "../../infrastructure";
import { TKycVerificationRequestData } from "../../infrastructure/rest/kyc/types";
import XIcon from "@/public/icons/XIcon";
import CheckOvalIcon from "@/public/icons/CheckOvalIcon";

import Footer from "../../components/Footer";
import ProgressStepBar from "../../components/ProgressStepBar";
import { resetImages, setActionList } from "@/redux/slices/livenessSlice";
import { handleRoute } from "@/utils/handleRoute";
import { assetPrefix } from "../../next.config";
import Loading from "@/components/Loading";
import SkeletonLoading from "@/components/SkeletonLoading";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";
import i18n from "i18";

interface IModal {
  modal: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
}

let ready: boolean = false;

const Liveness = () => {
  const router = useRouter();
  const routerQuery = router.query;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  let [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [failedMessage, setFailedMessage] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [isStepDone, setStepDone] = useState<boolean>(false);
  const [isGenerateAction, setIsGenerateAction] = useState<boolean>(true);
  const [isMustReload, setIsMustReload] = useState<boolean>(false);
  const [unsupportedDeviceModal, setUnsupportedDeviceModal] =
    useState<boolean>(false);
  const [showUnsupportedDeviceModal, setShowUnsupportedDeviceModal] =
    useState<IdeviceState | null>(null);

  const actionList = useSelector(
    (state: RootState) => state.liveness.actionList
  );
  const images = useSelector((state: RootState) => state.liveness.images);
  const isDone = useSelector((state: RootState) => state.liveness.isDone);
  const {t} : any = i18n

  const currentIndex =
    actionList[currentActionIndex] === "look_straight"
      ? "hadap-depan"
      : actionList[currentActionIndex] === "mouth_open"
      ? "buka-mulut"
      : actionList[currentActionIndex] === "blink"
      ? "pejam"
      : "hadap-depan";

  const actionText = () => {
    switch (actionList[currentActionIndex]) {
      case "look_straight":
        return t("lookStraight");
      case "look_up":
        return "Wajah menghadap ke  atas";
      case "look_down":
        return "Wajah menghadap ke bawah";
      case "look_left":
        return "Wajah menghadap ke kiri";
      case "look_right":
        return "Wajah menghadap ke kanan";
      case "mouth_open":
        return t("openMouth");
      case "blink":
        return t("blink");
      default:
        return "";
    }
  };

  const subtitle = isLoading
    ? t("livenessVerificationSubtitle")
    : t("livenessSubtitle");

  useEffect(() => {
    const track: any = document.querySelector(".track");
    if (progress === 100) {
      track?.classList?.add("white-stroke");
      setTimeout(() => {
        setStepDone(true);
        track?.classList?.remove("white-stroke");
      }, 2000);
    }
  }, [progress]);

  const dispatch: AppDispatch = useDispatch();
  const humanReadyRef = useRef<null>(null);

  const setHumanReady = () => {
    ready = true;
    const loading: any = document.getElementById("loading");
    loading.style.display = "none";
  };

  const generateAction = () => {
    const body = {
      registerId: routerQuery.request_id as string,
    };
    toast(`Mengecek status...`, {
      type: "info",
      toastId: "generateAction",
      isLoading: true,
      position: "top-center",
    });
    RestKycCheckStep({
      payload: { registerId: routerQuery.request_id as string },
    })
      .then((res) => {
        if (
          res.success &&
          res.data.status !== "D" &&
          res.data.status !== "F" &&
          res.data.status !== "E"
        ) {
          // this scope for status A B C S
          if (res.data.status === "S") {
            toast.dismiss("generateAction");
            const params = {
              register_id: routerQuery.request_id,
              status: res.data.status,
            };
            const queryString = new URLSearchParams(params as any).toString();
            if (routerQuery.redirect_url) {
              window.top!.location.href = concateRedirectUrlParams(
                routerQuery.redirect_url as string,
                queryString
              );
            } else {
              toast.success(res?.message || "pengecekan step berhasil", {
                icon: <CheckOvalIcon />,
              });
            }
          } else {
            RestKycGenerateAction(body)
              .then((result) => {
                if (result?.data) {
                  const payload = ["look_straight"].concat(
                    result.data.actionList
                  );
                  dispatch(setActionList(payload));
                  toast(`${result.message}`, {
                    type: "success",
                    position: "top-center",
                    autoClose: 3000,
                  });
                  toast.dismiss("generateAction");
                  setIsGenerateAction(false);
                } else {
                  setIsGenerateAction(false);
                  throw new Error(result.message);
                }
              })
              .catch((error) => {
                toast.dismiss("generateAction");
                const msg = error.response?.data?.data?.errors?.[0];
                if (msg) {
                  if (
                    msg === "Proses ekyc untuk registrationId ini telah sukses"
                  ) {
                    toast(`${msg}`, {
                      type: "success",
                      position: "top-center",
                      autoClose: 3000,
                    });
                    setIsGenerateAction(false);
                  } else {
                    toast.error(msg, {
                      icon: <XIcon />,
                    });
                    setIsGenerateAction(false);
                  }
                } else {
                  setIsGenerateAction(false);
                  toast.error(
                    error.response?.data?.message || "Generate Action gagal",
                    {
                      icon: <XIcon />,
                    }
                  );
                }
              });
          }
        } else {
          // this scope for status D F E
          setIsGenerateAction(false);
          toast.dismiss("generateAction");
          toast(`${res.message || "Tidak merespon!"}`, {
            type: "error",
            autoClose: 5000,
            position: "top-center",
            toastId: "errToast1",
          });
          if (
            res.message === "Anda berada di tahap pengisian formulir" ||
            res.data.status === "D"
          ) {
            toast.dismiss("errToast1");
            if (res.data.pin_form) {
              router.replace({
                pathname: handleRoute("kyc/pinform"),
                query: {
                  ...routerQuery,
                  registration_id: router.query.request_id,
                },
              });
            } else {
              router.push({
                pathname: handleRoute("form"),
                query: { ...routerQuery, request_id: router.query.request_id },
              });
            }
          } else {
            if (
              res.data.status === "F" &&
              res.data.pin_form &&
              routerQuery.redirect_url
            ) {
              const params = {
                status: res.data.status,
                register_id: routerQuery.request_id,
              };
              const queryString = new URLSearchParams(params as any).toString();
              window.top!.location.href = concateRedirectUrlParams(
                routerQuery.redirect_url as string,
                queryString
              );
            } else {
              router.push({
                pathname: handleRoute("liveness-failure"),
                query: { ...routerQuery, request_id: router.query.request_id },
              });
            }
          }
        }
      })
      .catch((err) => {
        toast.dismiss("generateAction");
        setIsGenerateAction(false);
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
  };

  const changePage = async () => {
    setIsLoading(true);
    setFailedMessage("");

    try {
      const body: TKycVerificationRequestData = {
        registerId: router.query.request_id as string,
        mode: "web",
        image_action1: "",
        image_action2: "",
        image_action3: "",
        image_selfie: "",
      };

      const imageActions = images.filter(
        (image) =>
          image.step === "Liveness Detection" &&
          image.action !== "look_straight"
      );
      imageActions.forEach((image, index) => {
        body[`image_action${++index}` as keyof TKycVerificationRequestData] =
          image.value;
      });
      const imageSelfie = images.filter(
        (image) => image.action === "look_straight"
      )[0];

      body.image_selfie = imageSelfie.value;

      const result = await RestKycVerification(body);
      const status = result.data.status;
      if (result.success) {
        removeStorage();
        if (result.data.pin_form) {
          router.replace({
            pathname: handleRoute("kyc/pinform"),
            query: { ...routerQuery, registration_id: router.query.request_id },
          });
        } else {
          router.push({
            pathname: handleRoute("form"),
            query: { ...routerQuery, request_id: router.query.request_id },
          });
        }
      } else {
        const attempt =
          result.data?.numFailedLivenessCheck ||
          parseInt(localStorage.getItem("tlk-counter") as string) + 1;
        localStorage.setItem("tlk-counter", attempt.toString());
        if (status !== "E" && status !== "F") {
          setIsLoading(false);
          toast("Liveness Detection failed. Please try again", {
            type: "error",
            autoClose: 5000,
            position: "top-center",
          });
          router.push({
            pathname: handleRoute("liveness-fail"),
            query: { ...routerQuery, request_id: router.query.request_id },
          });
        } else {
          if (status) {
            if (status === "E") {
              removeStorage();
              toast(
                "We are unable to find your data in Dukpacil. For further assistance, please contact admin@tilaka.id",
                {
                  type: "error",
                  autoClose: 5000,
                  position: "top-center",
                }
              );
              setIsLoading(false);
            } else if (status === "F") {
              toast(
                result?.data?.numFailedLivenessCheck &&
                  result?.data?.numFailedLivenessCheck > 2
                  ? "You have failed 3 times \nYou will be redirected to the next page, please wait..."
                  : "Registration Gagal",
                {
                  type: "error",
                  autoClose: 5000,
                  position: "top-center",
                }
              );
              setTimeout(() => {
                if (result.data.pin_form && routerQuery.redirect_url) {
                  const params = {
                    status: status,
                    register_id: routerQuery.request_id,
                  };
                  const queryString = new URLSearchParams(
                    params as any
                  ).toString();
                  window.top!.location.href = concateRedirectUrlParams(
                    routerQuery.redirect_url as string,
                    queryString
                  );
                } else {
                  router.push({
                    pathname: handleRoute("liveness-fail"),
                    query: {
                      ...routerQuery,
                      request_id: router.query.request_id,
                    },
                  });
                }
              }, 5000);
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        }
      }
    } catch (e) {
      toast.dismiss("verification");
      toast(`${e || "Tidak merespon!"}`, {
        type: "error",
        autoClose: e ? 5000 : false,
        position: "top-center",
      });
      setIsLoading(false);
      setTimeout(() => {
        router.push({
          pathname: handleRoute("liveness-fail"),
          query: { ...routerQuery, request_id: router.query.request_id },
        });
      }, 5000);
    }
  };

  const removeStorage = () => {
    localStorage.removeItem("tlk-reg-id");
    localStorage.removeItem("tlk-counter");
  };

  useEffect(() => {
    if (!isDone) return;
    changePage();
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady) return;
    generateAction();
    dispatch(resetImages());
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showUnsupportedDeviceModal !== null) {
      if (
        !showUnsupportedDeviceModal.isDeviceSupportCamera ||
        showUnsupportedDeviceModal.cameraDevicePermission !== "granted"
      ) {
        setUnsupportedDeviceModal(true);
      } else {
        setUnsupportedDeviceModal(false);
      }
    }
  }, [showUnsupportedDeviceModal]);

  useEffect(() => {
    setTimeout(() => {
      if (!ready) setIsMustReload(true);
    }, 15000);
  }, []);

  return (
    <>
      <Head>
        <title>Liveness</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="py-10 max-w-sm mx-auto px-2">
        <h2 className="font-poppins text-xl font-semibold">
          {isGenerateAction ? <SkeletonLoading width="w-2/5" /> : "Liveness"}
        </h2>
        <span className="font-poppins text-sm mt-5 block">
          {isGenerateAction ? (
            <SkeletonLoading width="w-full" isDouble />
          ) : (
            subtitle
          )}
        </span>
        {isLoading ? (
          <div className="mt-5 rounded-md h-[350px] flex justify-center items-center sm:w-full md:w-full">
            <Loading title={t("loadingTitle")} />
          </div>
        ) : (
          <div className="relative">
            {!ready && (
              <div
                id="loading"
                className={`rounded-md z-[999] ease-in duration-300 absolute bg-[#E6E6E6] w-full h-[350px] flex justify-center items-center`}
              >
                <Loading title={t("initializing")} />
              </div>
            )}
            {isMustReload && (
              <div
                className={`rounded-md z-[999] ease-in duration-300 absolute bg-[#E6E6E6] w-full h-[350px] flex justify-center items-center`}
              >
                <div className="text-center text-neutral50 font-poppins">
                  <p>{t("intializingFailed")}</p>
                  <button
                    className="text-[#000] mt-2"
                    onClick={() => window.location.reload()}
                  >
                    {t("clickHere")}
                  </button>
                </div>
              </div>
            )}
            <Camera
              currentActionIndex={currentActionIndex}
              setCurrentActionIndex={setCurrentActionIndex}
              currentStep="Liveness Detection"
              setFailedMessage={setFailedMessage}
              setProgress={setProgress}
              setHumanReady={setHumanReady}
              deviceState={(state) => {
                setShowUnsupportedDeviceModal(state);
              }}
            />
          </div>
        )}
        {(!isStepDone && actionList.length > 1) || isMustReload ? (
          <>
            <div className="mt-5 flex justify-center">
              {!isGenerateAction && (
                <Image
                  src={`${assetPrefix}/images/${
                    !isStepDone ? "hadap-depan" : currentIndex
                  }.svg`}
                  width={50}
                  height={50}
                  alt="1"
                />
              )}
            </div>
            <div className="flex items-center justify-center mt-5 flex-col">
              <span className={`font-poppins w-full text-center font-medium`}>
                {t("lookStraight")}
              </span>
              <span
                id={isMustReload ? "" : "log"}
                className="text-center font-poppins text-sm w-full mt-7 text-neutral"
              >
                {t("dontMove")}
              </span>
            </div>
          </>
        ) : (
          <div>
            {isGenerateAction && (
              <div className="flex items-center justify-center mt-14 flex-col">
                <SkeletonLoading width="w-full" isDouble />
              </div>
            )}
            {!isLoading && (
              <>
                <div className="mt-5 flex justify-center">
                  {actionList.length === 2 && (
                    <Image
                      src={`${assetPrefix}/images/${currentIndex}.svg`}
                      width={50}
                      height={50}
                      alt="2"
                    />
                  )}
                </div>
                <div className="flex items-center justify-center mt-5 flex-col">
                  <span className="font-poppins font-medium">
                    {actionText()}
                  </span>
                  {failedMessage ? (
                    <span className="text-center font-poppins text-sm mt-7 text-red300">
                      {failedMessage}
                    </span>
                  ) : (
                    <span className="text-center font-poppins text-sm mt-7 text-neutral">
                      {actionList.length > 1 && t("dontMove")}</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {isGenerateAction ? (
          <div className="w-2/5 h-[5px] mx-auto mt-5 border-b-2 border-[#E6E6E6] "></div>
        ) : (
          <div>
            {isMustReload ? (
              <ProgressStepBar actionList={actionList} currentActionIndex={0} />
            ) : (
              <ProgressStepBar
                actionList={actionList}
                currentActionIndex={isStepDone ? currentActionIndex : 0}
              />
            )}
          </div>
        )}
        <Footer />
        <UnsupportedDeviceModal
          modal={unsupportedDeviceModal}
          setModal={setUnsupportedDeviceModal}
        />
      </div>
    </>
  );
};

export default Liveness;

const UnsupportedDeviceModal: React.FC<IModal> = ({ modal, setModal }) => {
  const {t}: any = i18n
  const copyLink = () => {
    var copyText = document.getElementById("inputLink") as HTMLInputElement;
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard
      .writeText(copyText.value)
      .then(() => {
        toast.success("Berhasil menyalin link!");
      })
      .catch(() => {
        toast.error("Gagal menyalin link!");
      });
  };
  const getCurrentURL = (): string => window.location.href;
  return modal ? (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)", zIndex: "999" }}
      className="fixed z-50 flex items-start transition-all duration-1000 pb-3 justify-center w-full left-0 top-0 h-full"
    >
      <div
        className="bg-white mt-20 pt-6 px-3.5 pb-9 rounded-xl w-full mx-5"
        style={{ maxWidth: "352px" }}
      >
        <div className="flex flex-col">
          <p className="font-poppins text-center font-semibold text-base text-neutral800">
            {t("deviceNotSupportedTitle")}
          </p>
          <p className="text-base font-normal text-neutral800 font-poppins text-center mt-6 mx-auto px-8">
          {t("deviceNotSupportedSubtitle")}
          </p>
          <label className="mt-10">
            <p className="pl-4 pb-2 font-popping text-neutral200 text-sm font-semibold">
              {t("link")}
            </p>
            <div className="flex items-center border border-neutral50 rounded-md overflow-hidden">
              <div className="px-3 border-r border-neutral50 self-stretch flex">
                <Image
                  src={`${assetPrefix}/images/link.svg`}
                  width="20px"
                  height="10px"
                  alt="link-ill"
                />
              </div>

              <input
                id="inputLink"
                type="text"
                className="text-neutral800 text-sm font-poppins focus:outline-none truncate px-3 self-stretch flex-1"
                value={getCurrentURL()}
                readOnly
              />
              <button
                onClick={copyLink}
                className="bg-primary text-white text-sm font-poppins px-3 py-4"
              >
                {t("copy")}
              </button>
            </div>
          </label>
        </div>
      </div>
    </div>
  ) : null;
};
