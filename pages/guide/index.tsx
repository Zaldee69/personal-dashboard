import Link from "next/link";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import Head from "next/head";
import { handleRoute } from "@/utils/handleRoute";
import { useEffect } from "react";
import { RestKycCheckStep } from "infrastructure";
import { toast } from "react-toastify";
import CheckOvalIcon from "@/public/icons/CheckOvalIcon";
import XIcon from "@/public/icons/XIcon";

const Guide = () => {
  const router = useRouter();
  const { request_id, ...restRouterQuery } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    toast.info("Mengecek status...", {
      toastId: "kycCheckStepRequestToast",
      isLoading: true,
      position: "top-center",
    });
    RestKycCheckStep({
      payload: { registerId: request_id as string },
    })
      .then((res) => {
        if (res.success) {
          if (res.data.status === "D") {
            toast.dismiss("kycCheckStepRequestToast");
            toast.success(res?.message || "pengecekan step berhasil", {
              icon: <CheckOvalIcon />,
            });
            if (res.data.pin_form) {
              router.replace({
                pathname: handleRoute("kyc/pinform"),
                query: { ...restRouterQuery, registration_id: request_id },
              });
            } else {
              router.push({
                pathname: handleRoute("form"),
                query: { ...restRouterQuery, request_id },
              });
            }
          } else if (res.data.status === "E" || res.data.status === "F") {
            toast.dismiss("kycCheckStepRequestToast");
            toast.error(
              res?.message ||
                "pengecekan step berhasil, tetapi proses ekyc bermasalah",
              {
                icon: <XIcon />,
              }
            );
            router.push({
              pathname: handleRoute("liveness-failure"),
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
        <title>Panduan Liveness</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className=" py-10 max-w-sm mx-auto px-2 pt-8 sm:w-full md:w-4/5 ">
        <h2 className="font-poppins text-xl font-semibold">Liveness</h2>
        <span className="font-poppins text-sm block mt-4">
          Mohon perhatikan hal-hal berikut saat pengambilan wajah untuk
          penilaian yang maksimal.
        </span>
        <div className="flex flex-row justify-center mt-10 gap-5">
          <div className="flex flex-col items-center space-y-4">
            <img
              alt="guide-1"
              src="images/Liveness.svg"
              width={150}
              height={120}
            />
            <img
              alt="right-guide"
              src="images/Right.svg"
              width={30}
              height={30}
            />
          </div>
          <div className="flex flex-col items-center space-y-4">
            <img
              alt="guide-2"
              src="images/guide1.svg"
              width={150}
              height={120}
            />
            <img
              alt="wrong-guide"
              src="images/Wrong.svg"
              width={30}
              height={30}
            />
          </div>
        </div>
        <div>
          <ul className="list-disc flex flex-col font-poppins text-sm gap-4 my-10 px-5">
            <li>Wajah menghadap kamera dengan latar belakang yang jelas.</li>
            <li>
              Lepaskan atribut seperti kacamata, topi dan masker, serta rambut
              tidak menutupi wajah.
            </li>
            <li>
              Pastikan pencahayaan baik, tidak terlalu terang atau terlalu
              gelap.
            </li>
          </ul>
        </div>
        <Link
          href={{
            pathname: handleRoute(`/liveness`),
            query: {
              ...restRouterQuery,
              request_id: request_id,
            },
          }}
        >
          <button className="bg-primary btn md:mx-auto md:block md:w-1/4 text-white font-poppins w-full mx-auto rounded-sm h-9 ">
            MULAI
          </button>
        </Link>
        <Footer />
      </div>
    </>
  );
};

export default Guide;
