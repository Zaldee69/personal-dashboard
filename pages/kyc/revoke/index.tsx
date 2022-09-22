import Camera from "@/components/Camera";
import Footer from "@/components/Footer";
import ProgressStepBar from "@/components/ProgressStepBar";
import Head from "next/head";
import Image from "next/image";
import { toast } from "react-toastify";
import XIcon from "@/public/icons/XIcon";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Loading from "@/components/Loading";
import { assetPrefix } from "next.config";
import { actionText } from "@/utils/actionText";
import { AppDispatch, RootState } from "@/redux/app/store";
import { useDispatch, useSelector } from "react-redux";
import {
  RestKycGenerateRevokeAction,
  RestKycVerificationRevoke,
} from "../../../infrastructure";
import { resetImages, setActionList } from "@/redux/slices/livenessSlice";
import { TKycVerificationRevokeRequestData } from "infrastructure/rest/kyc/types";
import { handleRoute } from "@/utils/handleRoute";
import SkeletonLoading from "@/components/SkeletonLoading";
import { concateRedirectUrlParams } from "@/utils/concateRedirectUrlParams";

const RevokeMekari = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  let [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [failedMessage, setFailedMessage] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [isStepDone, setStepDone] = useState<boolean>(false)
  const [isGenerateAction, setIsGenerateAction] = useState<boolean>(true)
  const [isMustReload, setIsMustReload] = useState<boolean>(false)

  const actionList = useSelector(
    (state: RootState) => state.liveness.actionList
  );
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
  const subtitle: string =
      isLoading
      ? "Terima kasih telah mengikuti proses Liveness. Hasil dinilai berdasarkan keaslian serta kesesuaian foto dengan aksi yang diminta."
      : "Pastikan wajah di dalam garis panduan dan ikuti petunjuk dengan benar";

  const dispatch: AppDispatch = useDispatch();
  const humanReadyRef = useRef<null>(null);

  useEffect(() => {
    const track: any = document.querySelector(".track");
    if(progress === 100){
      track?.classList?.add("white-stroke")
      setTimeout(() => {
        setStepDone(true)
        track?.classList?.remove("white-stroke")
      }, 2000)
    }
    
  }, [progress])

  const generateAction = () => {
    const body = {
      revokeId: routerQuery.revoke_id as string,
    };
    RestKycGenerateRevokeAction(body)
      .then((result) => {
        if (result?.data) {
          const payload = ["look_straight"].concat(result.data.actionList);
          dispatch(setActionList(payload));
          setIsGenerateAction(false)
        } else {
          throw new Error(result.message);
        }
      })
      .catch((error) => {
        toast.dismiss("generateAction");
        setIsGenerateAction(false)
        const msg = error.response?.data?.data?.errors?.[0];
        const status = error.response?.data?.data?.status;
        const user = error.response?.data?.data?.user;
        if (msg) {
          setIsGenerateAction(false)
          toast.error(msg, {
            icon: <XIcon />,
          });
          if (status === "F") {
            if (routerQuery.redirect_url) {
              setTimeout(() => {
                const params = {
                  status: "Gagal",
                  revoke_id: routerQuery.revoke_id,
                  user_identifier: user ? user : "",
                };
                const queryString = new URLSearchParams(
                  params as any
                ).toString();
                window.top!.location.href = concateRedirectUrlParams(
                  routerQuery.redirect_url as string,
                  queryString
                );
              }, 3000);
            }
          } else if (status === "S") {
            setIsGenerateAction(false)
            if (routerQuery.redirect_url) {
              setTimeout(() => {
                const params = {
                  status: "Sukses",
                  revoke_id: routerQuery.revoke_id,
                  user_identifier: user ? user : "",
                };
                const queryString = new URLSearchParams(
                  params as any
                ).toString();
                window.top!.location.href = concateRedirectUrlParams(
                  routerQuery.redirect_url as string,
                  queryString
                );
              }, 3000);
            }
          }
        } else {
          toast.error(
            error.response?.data?.message || "Generate Action gagal",
            {
              icon: <XIcon />,
            }
          );
        }
      });
  };

  const verifyLiveness = async () => {

    setIsLoading(true)
    setFailedMessage("");

    try {
      const body: TKycVerificationRevokeRequestData = {
        revokeId: router.query.revoke_id as string,
        image_selfie: "",
      };

      const imageActions = images.filter(
        (image) => image.action !== "look_straight"
      );
      imageActions.forEach((image, index) => {
        body[
          `image_action${++index}` as keyof TKycVerificationRevokeRequestData
        ] = image.value;
      });
      const imageSelfie = images.filter(
        (image) => image.action === "look_straight"
      )[0];

      body.image_selfie = imageSelfie.value;

      const result = await RestKycVerificationRevoke(body);
      if (result.success) {
        toast.dismiss("verification");
        removeStorage();
        if (routerQuery.redirect_url) {
          setTimeout(() => {
            const params = {
              status: "Sukses",
              revoke_id: routerQuery.revoke_id,
              user_identifier: result.data.user,
            };
            const queryString = new URLSearchParams(params as any).toString();
            window.top!.location.href = concateRedirectUrlParams(
              routerQuery.redirect_url as string,
              queryString
            );
          }, 3000);
        }
      } else {
        toast.dismiss('verification')
        if(result.data.status === "F") {
          setIsLoading(false);
          if(routerQuery.redirect_url){
            setTimeout(() => {
              const params = {
                status: "Gagal",
                revoke_id: routerQuery.revoke_id,
                user_identifier: result.data.user,
              };
              const queryString = new URLSearchParams(params as any).toString();

              window.top!.location.href = concateRedirectUrlParams(
                routerQuery.redirect_url as string,
                queryString
              );
            }, 3000);
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
        toast.dismiss("verification")
        const msg = e.response?.data?.data?.errors?.[0];
        if (msg) {
            toast.error(msg, {
              icon: <XIcon />,
            });
        } else {
          toast.error(
            e.response?.data?.message || "Verifikasi gagal",
            {
              icon: <XIcon />,
            }
          );
        }
      
    }
  }

  const removeStorage = () => {
    localStorage.removeItem("cert-revoke-token");
  };

  useEffect(() => {
    if (!isDone) return;
    verifyLiveness();
  }, [isDone]);

  useEffect(() => {
    if (!router.isReady) return;
    generateAction();
    dispatch(resetImages());
  }, [router.isReady]);

  useEffect(() => {
    setTimeout(() => {
      const any = document.getElementById("loading")
      console.log(any)
      if(any !== null) setIsMustReload(true)
    }, 15000)
  }, [])


  return (
    <>
    <Head>
      <title>Liveness</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <div className="py-10 max-w-sm mx-auto px-2">
    <h2 className="font-poppins text-xl font-semibold">
      { isGenerateAction ?  <SkeletonLoading width="w-2/5" /> : "Liveness" }
    </h2>
      <span className="font-poppins text-sm mt-5 block">
        { isGenerateAction ? <SkeletonLoading width="w-full" isDouble /> : subtitle }
      </span>
      {
        isLoading ? (
          <div className="mt-5 rounded-md h-[350px] flex justify-center items-center sm:w-full md:w-full">
            <Loading title="Mohon menunggu" />
          </div>
        ) : (
          <div className="relative" >
              {
                humanReadyRef.current === null && (
                <div id="loading" className={`rounded-md z-[999] ease-in duration-300 absolute bg-[#E6E6E6] w-full h-[350px] flex justify-center items-center`}>
                  <Loading title="Initializing" />
                </div>
                )
              }
              {
                isMustReload && (
                  <div className={`rounded-md z-[999] ease-in duration-300 absolute bg-[#E6E6E6] w-full h-[350px] flex justify-center items-center`}>
                   <div className="text-center text-neutral50 font-poppins" >
                    <p>Initializing Failed</p>
                    <button className="text-[#000] mt-2" onClick={() => window.location.reload()} >Click here to reload page</button>
                  </div>
                </div>
                )
              }
                <Camera
                 currentActionIndex={currentActionIndex}
                 setCurrentActionIndex={setCurrentActionIndex}
                 currentStep="Liveness Detection"
                 setFailedMessage={setFailedMessage}
                 setProgress={setProgress}
                 humanReadyRef={humanReadyRef}
               />
          </div>
        )
      }
      {
        !isStepDone && actionList.length > 1 ? (
          <>
            <div className="mt-5 flex justify-center">
              {!isGenerateAction && (
                <Image
                  src={`${assetPrefix}/images/${!isStepDone ? "hadap-depan" : currentIndex}.svg`}
                  width={50}
                  height={50}
                  alt="1"
                />
              )}
            </div>
              <div className="flex items-center justify-center mt-5 flex-col">
                <span className={`font-poppins w-full text-center font-medium`}>Wajah menghadap depan</span>
                  <span className="text-center font-poppins text-sm w-full mt-7 text-neutral">Mohon jangan bergerak selama proses pengambilan wajah</span>
              </div>
          </> ) : (
          <div>
             {
                isGenerateAction && (
                  <div className="flex items-center justify-center mt-14 flex-col">
                    <SkeletonLoading width="w-full" isDouble />
                  </div>
                )
              }
            {
              !isLoading && (
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
                    <span className="font-poppins font-medium">{actionText(actionList[currentActionIndex])}</span>
                    {failedMessage ? (
                      <span className="text-center font-poppins text-sm mt-7 text-red300">
                        {failedMessage}
                      </span>
                    ) : (
                      <span className="text-center font-poppins text-sm mt-7 text-neutral">
                        {actionList.length > 1 && "Mohon jangan bergerak selama proses pengambilan wajah"}
                      </span>
                    )}
                  </div>
                </>
              )
            }
            </div>
          )
      }
      {
        isGenerateAction ? (
          <div className="w-2/5 h-[5px] mx-auto mt-10 border-b-2 border-[#E6E6E6] " ></div>
        ) : (
          <ProgressStepBar
            actionList={actionList}
            currentActionIndex={isStepDone ? currentActionIndex : 0}
          />
        )
      }
      <Footer />
    </div>
  </>
  );
};

export default RevokeMekari;
