import Camera from "@/components/Camera";
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
import Guide from "@/components/Guide";
import InitializingFailed from "@/components/atoms/InitializingFailed";
import Initializing from "@/components/atoms/Initializing";
import { ActionGuide1, ActionGuide2 } from "@/components/atoms/ActionGuide";
import CheckOvalIcon from "@/public/icons/CheckOvalIcon";

let human: any = undefined;

const ReEnrollMekari = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLivenessStarted, setIsLivenessStarted] = useState<boolean>(false);
  let [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [failedMessage, setFailedMessage] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [isStepDone, setStepDone] = useState<boolean>(false);
  const [isGenerateAction, setIsGenerateAction] = useState<boolean>(true);
  const [isMustReload, setIsMustReload] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [humanDone, setHumanDone] = useState(false);
  const [isClicked, setIsClicked] = useState<boolean>(false);

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
  const dispatch: AppDispatch = useDispatch();

  const setHumanReady = () => {
    const loading: any = document.getElementById("loading");
    if (loading) {
      loading.style.display = "none";
    }
  };

  const checkStep = async () => {
    setIsDisabled(true);
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
            const params: any = {
              issue_id: routerQuery.issue_id,
              status: "Selesai",
            };

            if (result.data.reason_code) {
              params.reason_code = result.data.reason_code;
            }

            const queryString = new URLSearchParams(params as any).toString();
            window.top!.location.href = concateRedirectUrlParams(
              routerQuery.redirect_url as string,
              queryString
            );
          }, 2000);
        } else {
          generateAction();
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

    toast(`Mengecek status...`, {
      type: "info",
      toastId: "generateAction",
      isLoading: true,
      position: "top-center",
    });

    RestKycGenerateActionIssue(body)
      .then((result) => {
        if (result?.data) {
          toast.dismiss("generateAction");
          toast.success("Pembuatan daftar aksi sukses", {
          icon: <CheckOvalIcon />,
          });
          setIsGenerateAction(false);
          setIsDisabled(false);
          const payload = ["look_straight"].concat(result.data.actionList);
          dispatch(setActionList(payload));
        } else {
          throw new Error(result.message);
        }
      })
      .catch((error) => {
        setIsGenerateAction(false);
        toast.dismiss("generateAction");
        const msg = error.response?.data?.data?.errors?.[0];
        const status = error.response?.data?.data?.status;
        const reason_code = error.response?.data?.data?.reason_code;
        if (msg) {
          toast.error(msg, {
            icon: <XIcon />,
          });
        }
        if (routerQuery.redirect_url && (status === "F" || status === "S")) {
          setIsGenerateAction(false);
          setTimeout(() => {
            const params: any = {
              issue_id: routerQuery.issue_id,
              status: "Selesai",
            };

            if (reason_code) {
              params.reason_code = reason_code;
            }

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
            const params: any = {
              status: "Selesai",
              issue_id: routerQuery.issue_id,
            };

            if (result.data.reason_code) {
              params.reason_code = result.data.reason_code;
            }

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
              const params: any = {
                status: "Selesai",
                issue_id: routerQuery.issue_id,
              };

              if (result.data.reason_code) {
                params.reason_code = result.data.reason_code;
              }

              const queryString = new URLSearchParams(params as any).toString();

              window.top!.location.href = concateRedirectUrlParams(
                routerQuery.redirect_url as string,
                queryString
              );
            }, 2000);
          }
        } else {
          const query: any = {
            ...routerQuery,
          };

          if (result.data.reason_code) {
            query.reason_code = result.data.reason_code;
          }

          router.push({
            pathname: handleRoute(
              assetPrefix ? "liveness-fail" : "/liveness-fail"
            ),
            query,
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
    const initHuman = async () => {
      const humanConfig: any = {
        // user configuration for human, used to fine-tune behavior
        backend: "webgl",
        modelBasePath: assetPrefix ? `${assetPrefix}/models` : "/models",
        filter: { enabled: false, equalization: false },
        face: {
          enabled: true,
          detector: { rotation: true },
          mesh: { enabled: true },
          iris: { enabled: true },
          description: { enabled: true },
          emotion: { enabled: false },
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: true },
        debug: true,
      };
      import("@vladmandic/human").then((H) => {
        human = new H.default(humanConfig);
        human.warmup().then(() => {
          setHumanDone(true);
        });
      });
    };
    initHuman();
  }, []);

  useEffect(() => {
    if (!humanDone && isClicked) {
      toast.dismiss();
      toast(`Loading...`, {
        type: "info",
        toastId: "load",
        isLoading: true,
        position: "top-center",
      });
      setIsDisabled(true);
    } else if (humanDone && isClicked) {
      toast.dismiss("load");
      setIsLivenessStarted(true);
    }
  }, [isClicked, humanDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const track: any = document.querySelector(".track");
    if (progress === 100) {
      track?.classList?.add("white-stroke");
      setTimeout(() => {
        setStepDone(true);
        track?.classList?.remove("white-stroke");
      }, 2000);
    }
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isDone) return;
    verifyLiveness();
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady) return;
    checkStep();
    dispatch(resetImages());
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLivenessStarted)
    return <Guide setIsClicked={setIsClicked} isDisabled={isDisabled} />;

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
        {(!isStepDone && actionList.length > 1) || isMustReload ? (
          <ActionGuide2
            currentIndex={currentIndex}
            isGenerateAction={isGenerateAction}
            isStepDone={isStepDone}
            isMustReload={isMustReload}
          />
        ) : (
          <div>
            {isGenerateAction && (
              <div className="flex gap-5 mx-2 mt-5">
                <SkeletonLoading width="w-[60px]" height="h-[50px]" />
                <div className="flex items-center w-full flex-col">
                  <SkeletonLoading width="w-full" height="h-[20px]" isDouble />
                </div>
              </div>
            )}
            {!isLoading && (
              <ActionGuide1
                actionList={actionList}
                currentIndex={currentIndex}
                currentActionIndex={currentActionIndex}
                failedMessage={failedMessage}
                actionText={actionText}
              />
            )}
          </div>
        )}
        <div
          className={[
            "mt-5 rounded-md h-[350px] flex justify-center items-center sm:w-full md:w-full",
            isLoading ? "block" : "hidden",
          ].join(" ")}
        >
          <Loading title={t("loadingTitle")} />
        </div>
        <div className={["relative", isLoading ? "hidden" : "block"].join(" ")}>
          {!isMustReload ? <Initializing /> : <InitializingFailed />}
          <Camera
            currentActionIndex={currentActionIndex}
            setCurrentActionIndex={setCurrentActionIndex}
            currentStep="Liveness Detection"
            setFailedMessage={setFailedMessage}
            setProgress={setProgress}
            setHumanReady={setHumanReady}
            humanDone={humanDone}
            human={human}
          />
        </div>
        {isGenerateAction ? (
          <div className="w-2/5 h-[5px] mx-auto mt-10 border-b-2 border-[#E6E6E6] "></div>
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
        <UnsupportedDeviceModal />
      </div>
    </>
  );
};

export default ReEnrollMekari;
