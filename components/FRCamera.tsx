import React, { useRef, useState, useEffect } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import Webcam from "react-webcam";
import { RootState } from "@/redux/app/store";
import { useDispatch, useSelector } from "react-redux";
import { restSigning } from "infrastructure/rest/signing";
import { restLogout } from "infrastructure/rest/b2b";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import XIcon from "@/public/icons/XIcon";
import { handleRoute } from "./../utils/handleRoute";
import i18n from "i18"

interface Constraint {
  width: number;
  height: number;
  facingMode: string;
}

interface Props {
  setIsFRSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
  signingFailedRedirectTo?: string;
  tokenIdentifier?: string;
  countIdentifier?: string;
  callbackCaptureProcessor?: (base64Img: string | null | undefined) => void;
}

let dom: any;

const FRCamera = ({
  setIsFRSuccess,
  setModal,
  signingFailedRedirectTo = handleRoute("login"),
  tokenIdentifier = "token",
  countIdentifier = "count",
  callbackCaptureProcessor,
}: Props) => {
  const constraint: Constraint = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  const dispatch = useDispatch();
  const {t}: any = i18n

  const document = useSelector((state: RootState) => state.document);
  const signature = useSelector((state: RootState) => state.signature);

  const router = useRouter();
  const { transaction_id, request_id } = router.query;

  const [successState, setIsSuccessState] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const webcamRef = useRef<Webcam | null>(null);

  const checkCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = [];
      Object.keys(devices).forEach((key: any) => {
        if (devices[key].kind === "videoinput") {
          videoInputs.push(devices[key]);
        }
      });

      if (videoInputs.length === 0) {
        setIsSuccessState(false);
      } else {
        dom = {
          // grab instances of dom objects so we dont have to look them up later
          video: webcamRef.current?.video,
          canvas: null,
        };
      }
    } catch (_) {
      setIsSuccessState(false);
    }
  };

  const onPlay = () => {
    setIsPlaying(true);
  };
  const count = parseInt(localStorage.getItem(countIdentifier) as string);
  localStorage.setItem(countIdentifier, count ? count.toString() : "0");

  const capture = React.useCallback(() => {
    toast(t("loadingTitle"), {
      type: "info",
      toastId: "info",
      isLoading: true,
      position: "top-center",
    });
    const imageSrc = webcamRef?.current?.getScreenshot();
    if (callbackCaptureProcessor) {
      callbackCaptureProcessor(imageSrc);
    } else {
      restSigning({
        payload: {
          file_name: new Date().getTime().toString(),
          otp_pin: "",
          content_pdf: document.response.data.document,
          width: document.response.data.width,
          height: document.response.data.height,
          face_image: imageSrc?.split(",")[1] as string,
          coordinate_x: document.response.data.posX,
          coordinate_y: document.response.data.posY,
          signature_image:
            signature.data.font ||
            signature.data.scratch ||
            document.response.data.tandaTangan,
          page_number: document.response.data.page_number,
          qr_content: "",
          tilakey: "",
          company_id: "",
          api_id: "",
          trx_id: (transaction_id as string) || (request_id as string),
        },
      })
        .then((res) => {
          if (res.success) {
            localStorage.setItem(countIdentifier, "0");
            toast.dismiss("info");
            toast(`Pencocokan berhasil`, {
              type: "success",
              position: "top-center",
            });
            setIsFRSuccess(true);
          } else if (!res.success) {
            toast.dismiss("info");
            toast.error(res.message, { icon: <XIcon /> });
            setModal(false);
          }
        })
        .catch((err) => {
          toast.dismiss("info");
          if (err.request.status === 401) {
            localStorage.removeItem(tokenIdentifier);
            localStorage.setItem(countIdentifier, "0");
            router.replace({
              pathname: signingFailedRedirectTo,
              query: { ...router.query },
            });
          } else {
            setModal(false);
            setTimeout(() => {
              setModal(true);
            }, 100);
            toast.error(t("faceValidationFailed"), { icon: <XIcon /> });
            const newCount =
              parseInt(localStorage.getItem(countIdentifier) as string) + 1;
            localStorage.setItem(countIdentifier, newCount.toString());
            const count = parseInt(
              localStorage.getItem(countIdentifier) as string
            );
            setModal(false);
            if (count >= 5) {
              localStorage.removeItem(tokenIdentifier);
              localStorage.setItem(countIdentifier, "0");
              restLogout({});
              router.replace({
                pathname: signingFailedRedirectTo,
                query: { ...router.query },
              });
            }
          }
        });
    }
  }, [webcamRef]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkCamera();
  });

  return (
    <div className="relative">
      <div
        id="countdown-timer-fr"
        className="absolute text-white right-3 top-3"
      >
        <CountdownCircleTimer
          onComplete={() => {
            capture();
            return { shouldRepeat: true, delay: 15 };
          }}
          isPlaying={isPlaying}
          size={45}
          strokeWidth={4}
          duration={5}
          colors="#fff"
        >
          {({ remainingTime }) => remainingTime + "s"}
        </CountdownCircleTimer>
      </div>
      <Webcam
        style={{ height: "280px", objectFit: "cover" }}
        className="mt-4 rounded-md sm:w-full md:w-full"
        ref={webcamRef}
        audio={false}
        height={960}
        screenshotFormat="image/jpeg"
        width={1280}
        screenshotQuality={1}
        minScreenshotWidth={1280}
        mirrored={false}
        minScreenshotHeight={960}
        videoConstraints={constraint}
        onLoadedMetadata={(e) => onPlay()}
      />
    </div>
  );
};

export default FRCamera;
