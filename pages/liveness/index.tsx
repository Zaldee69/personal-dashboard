import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Head from "next/head";
import { AppDispatch, RootState } from "@/redux/app/store";
import Camera from "../../components/Camera";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  RestKycCheckStep,
  RestKycFinalForm,
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
import Loading from "@/components/Loading";
import SkeletonLoading from "@/components/SkeletonLoading";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";
import i18n from "i18";
import UnsupportedDeviceModal from "@/components/UnsupportedDeviceModal";
import Guide from "@/components/Guide";
import InitializingFailed from "@/components/atoms/InitializingFailed";
import Initializing from "@/components/atoms/Initializing";
import { ActionGuide1, ActionGuide2 } from "@/components/atoms/ActionGuide";
import { actionText } from "@/utils/actionText";
import { assetPrefix } from "next.config";
import ImageDebugger from "@/components/ImageDebugger";

type TQueryParams = {
  request_id?: string;
  redirect_url?: string;
  reason_code?: string;
  register_id?: string;
  status?: string;
};

let human: any = undefined;

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
  const [isLivenessStarted, setIsLivenessStarted] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [humanDone, setHumanDone] = useState(false);
  const [isClicked, setIsClicked] = useState<boolean>(false);

  const actionList = useSelector(
    (state: RootState) => state.liveness.actionList
  );
  const images = useSelector((state: RootState) => state.liveness.images);
  const isDone = useSelector((state: RootState) => state.liveness.isDone);
  const { t }: any = i18n;

  const currentIndex =
    actionList[currentActionIndex] === "look_straight"
      ? "hadap-depan"
      : actionList[currentActionIndex] === "mouth_open"
      ? "buka-mulut"
      : actionList[currentActionIndex] === "blink"
      ? "pejam"
      : "hadap-depan";

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
    const loading: any = document.getElementById("loading");
    if (loading) {
      loading.style.display = "none";
    }
  };

  const generateAction = () => {
    setIsDisabled(true);
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
          setIsDisabled(false);
          if (res.data.status === "S") {
            toast.dismiss("generateAction");
            const params: TQueryParams = {
              register_id: routerQuery.request_id as string,
              status: res.data.status,
            };

            if (res.data.reason_code) {
              params.reason_code = res.data.reason_code;
            }

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
              const params: TQueryParams = {
                status: res.data.status,
                register_id: routerQuery.request_id as string,
              };

              if (res.data.reason_code) {
                params.reason_code = res.data.reason_code;
              }

              const queryString = new URLSearchParams(params as any).toString();
              window.top!.location.href = concateRedirectUrlParams(
                routerQuery.redirect_url as string,
                queryString
              );
            } else if (res.data.status === "F" && routerQuery.dashboard_url){
              // Redirect berdasarkan redirect-url
              
              const params: TQueryParams = {
                request_id: routerQuery.request_id as string,
                reason_code: res.data.reason_code as string,
              };
              const queryString = new URLSearchParams(params as any).toString();
              const { hostname } = new URL(routerQuery.dashboard_url as string)
              
              if(hostname === 'tilaka.id' || hostname.endsWith("tilaka.id")){
                window.top!.location.href = concateRedirectUrlParams(
                  routerQuery.dashboard_url as string,
                  queryString
                  );
              }
            } else {
              const query: TQueryParams = {
                ...routerQuery,
                request_id: router.query.request_id as string,
              };

              if (res.data.reason_code) {
                query.reason_code = res.data.reason_code;
              }

              router.push({
                pathname: handleRoute("liveness-failure"),
                query,
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
        if (result.data.config_level === 2) {
          try {
            const finalFormResponse = await RestKycFinalForm({
              payload: { registerId: router.query.request_id as string },
            });

            if (finalFormResponse.success) {
              toast.success(finalFormResponse?.message || "berhasil", {
                icon: <CheckOvalIcon />,
              });

              // Redirect berdasarkan redirect-url
              const params: TQueryParams = {
                request_id: routerQuery.request_id as string,
              };

              if (routerQuery.redirect_url) {
                params.redirect_url = routerQuery.redirect_url as string;
              }

              if (finalFormResponse.data.reason_code) {
                params.reason_code = finalFormResponse.data.reason_code;
              }

              const queryString = new URLSearchParams(params as any).toString();
              const { hostname } = new URL(routerQuery.dashboard_url as string)
              
              if(hostname === 'tilaka.id' || (hostname).endsWith("tilaka.id")){
                window.top!.location.href = concateRedirectUrlParams(
                  routerQuery.dashboard_url as string,
                  queryString
                );
              }
            } else {
              toast.error(finalFormResponse?.message || "gagal", {
                icon: <XIcon />,
              });
            }
          } catch (e: any) {
            if (e.response?.data?.data?.errors?.[0]) {
              toast.error(
                `${e.response?.data?.message}, ${e.response?.data?.data?.errors?.[0]}`,
                { icon: <XIcon /> }
              );
            } else {
              toast.error(e.response?.data?.message || "gagal", {
                icon: <XIcon />,
              });
            }
          }
        } else if (result.data.pin_form) {
          const query: any = {
            ...routerQuery,
            registration_id: router.query.request_id,
          };

          if (result.data.reason_code) {
            query.reason_code = result.data.reason_code;
          }

          router.replace({
            pathname: handleRoute("kyc/pinform"),
            query,
          });
        } else {
          const query: any = {
            ...routerQuery,
            request_id: router.query.request_id,
          };

          if (result.data.reason_code) {
            query.reason_code = result.data.reason_code;
          }

          router.push({
            pathname: handleRoute("form"),
            query,
          });
        }
      } else {
        const attempt =
          result.data?.numFailedLivenessCheck ||
          parseInt(localStorage.getItem("tlk-counter") as string) + 1;
        localStorage.setItem("tlk-counter", attempt.toString());
        if (status !== "E" && status !== "F") {
          toast("Liveness Detection failed. Please try again", {
            type: "error",
            autoClose: 5000,
            position: "top-center",
          });


          const query: TQueryParams = {
            ...routerQuery,
            request_id: router.query.request_id as string,
          };

          if (result.data.reason_code) {
            query.reason_code = result.data.reason_code;
          }

          router.push({
            pathname: handleRoute("liveness-fail"),
            query,
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
                if (result.data.config_level === 2) {
                  const params: TQueryParams = {
                    request_id: routerQuery.request_id as string,
                  };

                  if (routerQuery.redirect_url) {
                    params.redirect_url = routerQuery.redirect_url as string;
                  }

                  if (result?.data.reason_code) {
                    params.reason_code = result?.data.reason_code as string;
                  }

                  const queryString = new URLSearchParams(
                    params as any
                  ).toString();
                  const { hostname } = new URL(routerQuery.dashboard_url as string)
              
                  if(hostname === 'tilaka.id' || (hostname).endsWith("tilaka.id")){
                    window.top!.location.href = concateRedirectUrlParams(
                      routerQuery.dashboard_url as string,
                      queryString
                    );
                  }
                } else if (result.data.pin_form && routerQuery.redirect_url) {
                  const params: any = {
                    status: status,
                    register_id: routerQuery.request_id,
                  };

                  if (result?.data.reason_code) {
                    params.reason_code = result?.data.reason_code;
                  }

                  const queryString = new URLSearchParams(
                    params as any
                  ).toString();
                  window.top!.location.href = concateRedirectUrlParams(
                    routerQuery.redirect_url as string,
                    queryString
                  );
                } else {
                  const query: any = {
                    ...routerQuery,
                    request_id: router.query.request_id,
                  };

                  if (result?.data.reason_code) {
                    query.reason_code = result?.data.reason_code;
                  }

                  router.push({
                    pathname: handleRoute("liveness-fail"),
                    query,
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
          query: {
            ...routerQuery,
            request_id: router.query.request_id,
          },
        });
      }, 5000);
    }
  };

  const removeStorage = () => {
    localStorage.removeItem("tlk-reg-id");
    localStorage.removeItem("tlk-counter");
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
    if (!isDone) return;
    changePage();
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!router.isReady) return;
    generateAction();
    dispatch(resetImages());
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLivenessStarted)
    return <Guide setIsClicked={setIsClicked} isDisabled={isDisabled} />;

  return (
    <>
    {/* <ImageDebugger/> */}
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
            "mt-5 rounded-md h-[270px] flex justify-center items-center sm:w-full md:w-full",
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
        <UnsupportedDeviceModal />
      </div>
    </>
  );
};

export default Liveness;
