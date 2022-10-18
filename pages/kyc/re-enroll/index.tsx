import EnrollCamera, { IdeviceState } from "@/components/EnrollCamera";
import Footer from "@/components/Footer";
import ProgressStepBar from "@/components/ProgressStepBar";
import Head from "next/head";
import Image from "next/image";
import i18n from "i18";
import { toast } from "react-toastify";
import XIcon from "@/public/icons/XIcon";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Loading from "@/components/Loading";
import { assetPrefix } from "next.config";
import { actionText } from "@/utils/actionText";
import { AppDispatch, RootState } from "@/redux/app/store";
import { useDispatch, useSelector } from "react-redux";
import {
  RestKycCheckStepIssue,
  RestKycGenerateActionIssue,
  RestKycVerificationIssue,
} from "../../../infrastructure";
import { handleRoute } from "@/utils/handleRoute";
import SkeletonLoading from "@/components/SkeletonLoading";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";
import { resetImages, setActionList } from "@/redux/slices/livenessSlice";
import { TKycVerificationIssueRequestData } from "infrastructure/rest/kyc/types";
import UnsupportedDeviceModal from "@/components/UnsupportedDeviceModal";

let ready: boolean = false;

const ReEnrollMekari = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLivenessStarted, setisLivenessStarted] = useState<boolean>(false);
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
  const { t }: any = i18n;
  const images = useSelector((state: RootState) => state.liveness.images);
  const isDone = useSelector((state: RootState) => state.liveness.isDone);

  const currentIndex =
    actionList[currentActionIndex] === "look_straight"
      ? "hadap-depan"
      : actionList[currentActionIndex] === "mouth_open"
      ? "buka-mulut"
      : actionList[currentActionIndex] === "blink"
      ? "pejam"
      : "hadap-depan";

  const router = useRouter();
  const routerQuery = router.query;
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

  const setHumanReady = () => {
    ready = true;
    const loading: any = document.getElementById("loading");
    if (loading) {
      loading.style.display = "none";
    }
  };

  const checkStep = async () => {
    const body = {
      issueId: routerQuery.issue_id as string,
    };
    try {
      const result = await RestKycCheckStepIssue(body);
      if (result.success) {
        if (
          routerQuery.redirect_url &&
          (result.data.status === "F" || result.data.status === "S")
        ) {
          toast.error(result?.message || "Pengecekan Step Re-enroll gagal");
          setTimeout(() => {
            const params = {
              issue_id: routerQuery.issue_id,
              status: "Selesai",
            };
            const queryString = new URLSearchParams(params as any).toString();
            window.top!.location.href = concateRedirectUrlParams(
              routerQuery.redirect_url as string,
              queryString
            );
          }, 2000);
        }
      }
    } catch (e: any) {
      setIsLoading(false);
      const msg = e.response?.data?.data?.errors?.[0];
      if (msg) {
        toast.error(msg, {
          icon: <XIcon />,
        });
      } else {
        toast.error(e.response?.data?.message || "Verifikasi gagal", {
          icon: <XIcon />,
        });
      }
    }
  };
  const generateAction = () => {
    const body = {
      issueId: routerQuery.issue_id as string,
    };
    RestKycGenerateActionIssue(body)
      .then((result) => {
        if (result?.data) {
          setIsGenerateAction(false);
          const payload = ["look_straight"].concat(result.data.actionList);
          dispatch(setActionList(payload));
          setisLivenessStarted(true);
        } else {
          throw new Error(result.message);
        }
      })
      .catch((error) => {
        setIsGenerateAction(false);
        const msg = error.response?.data?.data?.errors?.[0];
        const status = error.response?.data?.data?.status;
        if (msg) {
          toast.error(msg, {
            icon: <XIcon />,
          });
        }
        if (routerQuery.redirect_url && (status === "F" || status === "S")) {
          setIsGenerateAction(false);
          setTimeout(() => {
            const params = {
              issue_id: routerQuery.issue_id,
              status: "Selesai",
            };
            const queryString = new URLSearchParams(params as any).toString();
            window.top!.location.href = concateRedirectUrlParams(
              routerQuery.redirect_url as string,
              queryString
            );
          }, 2000);
        }
      });
  };

  const verifyLiveness = async () => {
    setIsLoading(true);
    setFailedMessage("");

    try {
      const body: TKycVerificationIssueRequestData = {
        issueId: routerQuery.issue_id as string,
        image_selfie: "",
        image_action1: "",
      };

      const imageActions = images.filter(
        (image) => image.action !== "look_straight"
      );
      imageActions.forEach((image, index) => {
        body[
          `image_action${++index}` as keyof TKycVerificationIssueRequestData
        ] = image.value;
      });
      const imageSelfie = images.filter(
        (image) => image.action === "look_straight"
      )[0];

      body.image_selfie = imageSelfie.value;
      const result = await RestKycVerificationIssue(body);
      if (result.success) {
        removeStorage();
        if (routerQuery.redirect_url) {
          setTimeout(() => {
            const params = {
              status: "Selesai",
              issue_id: routerQuery.issue_id,
            };
            const queryString = new URLSearchParams(params as any).toString();
            window.top!.location.href = concateRedirectUrlParams(
              routerQuery.redirect_url as string,
              queryString
            );
          }, 2000);
        }
      } else {
        if (result.data.status === "F") {
          setIsLoading(false);
          if (routerQuery.redirect_url) {
            setTimeout(() => {
              const params = {
                status: "Selesai",
                issue_id: routerQuery.issue_id,
              };
              const queryString = new URLSearchParams(params as any).toString();

              window.top!.location.href = concateRedirectUrlParams(
                routerQuery.redirect_url as string,
                queryString
              );
            }, 2000);
          }
        } else {
          router.push({
            pathname: handleRoute(
              assetPrefix ? "liveness-fail" : "/liveness-fail"
            ),
            query: {
              ...routerQuery,
            },
          });
        }
      }
    } catch (e: any) {
      setIsLoading(false);
      const msg = e.response?.data?.data?.errors?.[0];
      if (msg) {
        toast.error(msg, {
          icon: <XIcon />,
        });
      } else {
        toast.error(e.response?.data?.message || "Verifikasi gagal", {
          icon: <XIcon />,
        });
      }
    }
  };

  const removeStorage = () => {
    localStorage.removeItem("kyc-reenroll-token");
  };

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

  useEffect(() => {
    if (!isDone) return;
    verifyLiveness();
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLivenessStarted) return;
    generateAction();
  }, [isLivenessStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady) return;
    checkStep();
    dispatch(resetImages());
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ready && showUnsupportedDeviceModal !== null) {
      if (
        !showUnsupportedDeviceModal.isDeviceSupportCamera ||
        showUnsupportedDeviceModal.cameraDevicePermission !== "granted"
      ) {
        setUnsupportedDeviceModal(true);
      } else {
        setUnsupportedDeviceModal(false);
      }
    }
  }, [showUnsupportedDeviceModal, ready]);

  useEffect(() => {
    setTimeout(() => {
      if (!ready) setIsMustReload(true);
    }, 15000);
  }, []);

  return (
    <>
      {!isLivenessStarted ? (
        <>
          <Head>
            <title>Panduan Liveness</title>
            <meta
              name="viewport"
              content="initial-scale=1.0, width=device-width"
            />
          </Head>
          <div className=" py-10 max-w-sm mx-auto px-2 pt-8 sm:w-full md:w-4/5 ">
            <h2 className="font-poppins text-xl font-semibold">Liveness</h2>
            <span className="font-poppins text-sm block mt-4">
              {t("guideTitle")}
            </span>
            <div className="flex flex-row justify-center mt-10 gap-5">
              <div className="flex flex-col items-center space-y-4">
                <Image
                  alt={"guide-1"}
                  src={`${assetPrefix}/images/Liveness.svg`}
                  width={150}
                  height={120}
                />
                <Image
                  alt={"right-guide"}
                  src={`${assetPrefix}/images/Right.svg`}
                  width={30}
                  height={30}
                />
              </div>
              <div className="flex flex-col items-center space-y-4">
                <Image
                  alt={"guide-2"}
                  src={`${assetPrefix}/images/guide1.svg`}
                  width={150}
                  height={120}
                />
                <Image
                  alt={"wrong-guide"}
                  src={`${assetPrefix}/images/Wrong.svg`}
                  width={30}
                  height={30}
                />
              </div>
            </div>
            <div>
              <ul className="list-disc flex flex-col font-poppins text-sm gap-4 my-10 px-5">
                <li>{t("guideSubtitle1")}</li>
                <li>{t("guideSubtitle2")}</li>
                <li>{t("guideSubtitle3")}</li>
              </ul>
            </div>
            <button
              onClick={() => generateAction()}
              className="bg-primary btn md:mx-auto md:block md:w-1/4 text-white font-poppins w-full mx-auto rounded-sm h-9 "
            >
              {t("startButton")}
            </button>
            <Footer />
          </div>
        </>
      ) : (
        <>
          <Head>
            <title>Liveness</title>
            <meta
              name="viewport"
              content="initial-scale=1.0, width=device-width"
            />
          </Head>
          <div className="py-10 max-w-sm mx-auto px-2">
            <h2 className="font-poppins text-xl font-semibold">
              {isGenerateAction ? (
                <SkeletonLoading width="w-2/5" />
              ) : (
                "Liveness"
              )}
            </h2>
            <span className="font-poppins text-sm mt-5 block">
              {isGenerateAction ? (
                <SkeletonLoading width="w-full" isDouble />
              ) : (
                subtitle
              )}
            </span>
            <div
              className={[
                "mt-5 rounded-md h-[350px] flex justify-center items-center sm:w-full md:w-full",
                isLoading ? "block" : "hidden",
              ].join(" ")}
            >
              <Loading title={t("loadingTitle")} />
            </div>
            <div
              className={["relative", isLoading ? "hidden" : "block"].join(" ")}
            >
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
              <EnrollCamera
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
                  <span
                    className={`font-poppins w-full text-center font-medium`}
                  >
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
                        {actionText(actionList[currentActionIndex])}
                      </span>
                      {failedMessage ? (
                        <span className="text-center font-poppins text-sm mt-7 text-red300">
                          {failedMessage}
                        </span>
                      ) : (
                        <span className="text-center font-poppins text-sm mt-7 text-neutral">
                          {actionList.length > 1 && t("dontMove")}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {isGenerateAction ? (
              <div className="w-2/5 h-[5px] mx-auto mt-10 border-b-2 border-[#E6E6E6] "></div>
            ) : (
              <div>
                {isMustReload ? (
                  <ProgressStepBar
                    actionList={actionList}
                    currentActionIndex={0}
                  />
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
      )}
    </>
  );
};

export default ReEnrollMekari;
