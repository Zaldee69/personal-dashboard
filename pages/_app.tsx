import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { store } from "../redux/app/store";
import { Provider } from "react-redux";
import { useRouter } from "next/router";
import "react-toastify/dist/ReactToastify.min.css";
import "../styles/globals.css";
import Script from "next/script";
import i18n from "../i18";
import { useEffect, useState } from "react";

type TcontextClass = {
  success: string;
  error: string;
  info: string;
  warning: string;
  default: string;
  dark: string;
};

const contextClass: TcontextClass = {
  success:
    "Toastify__toast-success bg-green50 text-neutral800 border border-green200",
  error: "Toastify__toast-error bg-red50 text-neutral800 border border-red75",
  info: "bg-primary text-white",
  warning: "bg-warning text-neutral800",
  default: "bg-white text-neutral800",
  dark: "bg-neutral800 text-white",
};

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { lang } = router.query;

  i18n.changeLanguage(lang as string);

  const [showChild, setShowChild] = useState(false);
  useEffect(() => {
    setShowChild(true);
  }, []);

  if (!showChild) {
    return null;
  }

  if (typeof window === "undefined") {
    return <></>;
  } else {
    return (
      <>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.js"
          strategy="beforeInteractive"
        ></Script>
        <Provider store={store}>
          <ToastContainer
            toastClassName={(context: any) =>
              contextClass[
                (context?.type || "default") as keyof TcontextClass
              ] +
              " relative  rounded items-center w-fit px-5 mx-auto mt-5 text-sm overflow-hidden hover:cursor-pointer flex justify-between"
            }
            bodyClassName={() => "text-sm poppins-regular  p-3 flex items-center"}
            position="top-center"
            autoClose={3000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            closeButton={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Component {...pageProps} />
        </Provider>
      </>
    );
  }
}

export default MyApp;
