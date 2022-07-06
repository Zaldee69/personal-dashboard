import { Viewer } from "@/components/Viewer";
import { useDispatch, useSelector } from "react-redux";
import { getDocument } from "@/redux/slices/documentSlice";
import { addFont, addScratch } from "@/redux/slices/signatureSlice";
import { useRouter } from "next/router";
import { AppDispatch, RootState } from "@/redux/app/store";
import { TDocumentProps } from "@/interface/interface";
import { PinInput } from "react-input-pin-code";
import { restSigning } from "infrastructure/rest/signing";
import { restLogout } from "infrastructure/rest/b2b";
import { toast } from "react-toastify";
import XIcon from "@/public/icons/XIcon";
import { restGetOtp } from "infrastructure/rest/b2b";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import Image from "next/image";
import Head from "next/head";
import FRCamera from "@/components/FRCamera";
import SignaturePad from "@/components/SignaturePad";
import Footer from "@/components/Footer";
import { setAuthToken } from "@/config/API";
import html2canvas from "html2canvas";
import {
  getUserName
} from "infrastructure/rest/b2b";
import { assetPrefix } from "../../next.config";
import { handleRoute } from './../../utils/handleRoute';

type TFontSig =
  | "signature_font_type_allan"
  | "signature_font_type_aguafinaScript"
  | "signature_font_type_architectsDaughter"
  | "signature_font_type_giveYouGlory"
  | "signature_font_type_berkshireSwash"
  | "signature_font_type_missFajardose";

interface Active {
  modal: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
  tilakaName?: string;
}

interface Props {
  token: string;
  pathname: string;
}

const Signing = () => {
  const [totalPages, setTotalPages] = useState<number>(0);
  const [openFRModal, setopenFRModal] = useState<boolean>(false);
  const [openScratchesModal, setOpenScratchesModal] = useState<boolean>(false);
  const [selectFontModal, setSelectFontModal] = useState<boolean>(false);
  const [otpModal, setOtpModal] = useState<boolean>(false);
  const [data, setData] = useState<string>()
  const router = useRouter();
  const routerIsReady = router.isReady;
  const pathname = router.pathname;
  const { company_id, request_id, transaction_id} = router.query;

  const dispatch: AppDispatch = useDispatch();
  const res = useSelector((state: RootState) => state.document);

  

  useEffect(() => {
    const token = localStorage.getItem("token");
    const count = parseInt(localStorage.getItem("count" ) as string) 
    localStorage.setItem("count", count ? count.toString() : "0")
    if (routerIsReady) {
      getUserName({}).then((res) => {
        const data = JSON.parse(res.data)
        setData(data.name)
      })
      dispatch(getDocument({ company_id, transaction_id : request_id as string || transaction_id  as string } as TDocumentProps));
      if (res.response.status === "REJECTED") {
        localStorage.removeItem("token");
      }
    }
    if (!token) {
      router.replace({
        pathname: handleRoute("/login"),
        query: { ...router.query },
      });
    }
    setAuthToken({ token, pathname } as Props);
  }, [routerIsReady]);

  return (
    <>
      <Head>
        <title>Tanda Tangan</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {res.response.status === "PENDING" ? (
        <>
          {" "}
          <div className="flex justify-center relative h-[45rem] items-center ">
            <Image
              alt="loading"
              width={50}
              height={50}
              src={`${assetPrefix}/images/loader.svg`}
              className=" motion-safe:animate-spin"
            />
          </div>
          <Footer />
        </>
      ) : (
        <div className=" pt-8 pb-10 sm:w-full bg-[#f4f5f7] h-full relative  mx-auto">
          {" "}
          <FRModal modal={openFRModal} setModal={setopenFRModal} />
          <Configuration
            selectFontModal={selectFontModal}
            setSelectFontModal={setSelectFontModal}
            openScratchesModal={openScratchesModal}
            setOpenScratchesModal={setOpenScratchesModal}
          />
          <ChooseFontModal
            modal={selectFontModal}
            setModal={setSelectFontModal}
            tilakaName={data}
          />
          <ChooseScratchModal
            modal={openScratchesModal}
            setModal={setOpenScratchesModal}
          />
          <OTPModal modal={otpModal} setModal={setOtpModal} />
          <Viewer
            setTotalPages={setTotalPages}
            url={`{data:application/pdf;base64,${res.response.data.document}`}
            tandaTangan={res.response.data.tandaTangan}
          />
          <div className="px-5 fixed w-full flex justify-center items-center bottom-0">
            {res.response.data.document && (
              <button
                onClick={() =>
                  res.response.data.mfa.toLowerCase() == "fr"
                    ? setopenFRModal(true)
                    : setOtpModal(true)
                }
                className="bg-primary  btn  md:w-1/4 my-5 text-white font-poppins w-full mx-5 rounded-sm h-9"
              >
                TANDA TANGANI
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Signing;

const Configuration: React.FC<{
  selectFontModal: boolean;
  openScratchesModal: boolean;
  setOpenScratchesModal: Dispatch<SetStateAction<boolean>>;
  setSelectFontModal: Dispatch<SetStateAction<boolean>>;
}> = ({
  selectFontModal,
  setSelectFontModal,
  openScratchesModal,
  setOpenScratchesModal,
}) => {
  return (
    <div className="flex flex-row items-center shadow-xl z-10 left-0 fixed py-2 w-full top-0 bg-[rgb(223,225,230)] justify-center gap-10">
      <div className="flex flex-col  ">
        <button onClick={() => setOpenScratchesModal(!openScratchesModal)}>
          <Image width={25} height={25} src={`${assetPrefix}/images/goresan.svg`} />
          <p className="text-[#727272] text-base  ">Goresan</p>
        </button>
      </div>
      <div className="flex flex-col">
        <button onClick={() => setSelectFontModal(!selectFontModal)}>
          <Image width={25} height={25} src={`${assetPrefix}/images/font.svg`} />
          <p className="text-[#727272] text-base ">Font</p>
        </button>
      </div>
    </div>
  );
};

const FRModal: React.FC<Active | any> = ({ modal, setModal }) => {
  const [isFRSuccess, setIsFRSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isFRSuccess && modal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "scroll";
    }
  }, [isFRSuccess]);

  return modal ? (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
      className="fixed z-50 flex items-start transition-all duration-1000 justify-center w-full left-0 top-0 h-full "
    >
      <div className="bg-white max-w-md mt-20 pt-5 px-2 pb-3 rounded-md w-full mx-5 ">
        {isFRSuccess ? (
          <div className="flex flex-col  items-center">
            <p className="font-poppins block text-center  whitespace-nowrap  font-semibold ">
              Tanda Tangan Berhasil
            </p>
            <div className="my-10">
              <Image width={150} height={150} src={`${assetPrefix}/images/successFR.svg`} />
            </div>

            <button
              onClick={() => {
                setModal(!modal);
                setIsFRSuccess(false);
              }}
              className="bg-primary btn  text-white font-poppins w-full mt-5 mx-auto rounded-sm h-9"
            >
              TUTUP
            </button>
          </div>
        ) : (
          <>
            <p className="font-poppins block text-center font-semibold ">
              Konfirmasi Tanda Tangan
            </p>
            <span className="font-poppins mt-2 block text-center text-sm font-normal">
              Arahkan wajah ke kamera untuk otentikasi
            </span>
            <FRCamera setModal={setModal} setIsFRSuccess={setIsFRSuccess} />
            <button
              onClick={() => setModal(!modal)}
              className="bg-primary btn  text-white font-poppins w-full mt-5 mx-auto rounded-sm h-9"
            >
              BATAL
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;
};

const ChooseFontModal: React.FC<Active> = ({ modal, setModal, tilakaName }) => {
  const dispatch: AppDispatch = useDispatch();
  const [form, formSetter] = useState<TFontSig | string>(
    "signature_font_type_aguafinaScript"
  );
  const [sig, setSig] = useState<any>();
  const handleFormOnChange = (e: React.FormEvent<HTMLInputElement>): void => {
    formSetter(e.currentTarget.value);
    setSig(e.currentTarget);
  };

  const convertToDataURL = async () => {
    const canvas = await html2canvas(sig.parentNode.children[1], {
      height: 60,
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
    dispatch(addFont(canvas.toDataURL("image/png")));
  };
  return modal ? (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
      className="fixed z-50 flex items-start transition-all duration-1000 justify-center w-full left-0 top-0 h-full "
    >
      <div className="bg-white max-w-md mt-20 pt-5 px-2 pb-3 rounded-md w-full mx-2">
        <p className="font-poppins block text-center  whitespace-nowrap  font-semibold ">
          Pilih Font
        </p>
        <div className="mt-5 flex flex-col gap-5">
          <div className={`grid  ${tilakaName?.length as number > 15 ? "grid-cols gap-5" : "grid-col-2"} gap-3 mt-5`}>
            <label className="relative flex justify-center items-center">
              <input
                type="radio"
                name="signature_font_type"
                value="signature_font_type_allan"
                onChange={handleFormOnChange}
                checked={form === "signature_font_type_allan"}
                className="appearance-none border border-_B6B6B6 checked:border-_1A73E8 rounded-md w-full h-12"
              />
              <p className="text-2xl font-allan bg-transparent text-_030326 absolute w-fit text-center">
                {tilakaName}
              </p>
            </label>
            <label className="relative flex justify-center items-center">
              <input
                type="radio"
                name="signature_font_type"
                value="signature_font_type_aguafinaScript"
                onChange={handleFormOnChange}
                checked={form === "signature_font_type_aguafinaScript"}
                className="appearance-none border border-_B6B6B6 checked:border-_1A73E8 rounded-md w-full h-12"
              />
              <p className="text-2xl font-aguafinaScript text-_030326 absolute w-fit text-center">
                {tilakaName}
              </p>
            </label>
            <label className="relative flex justify-center items-center">
              <input
                type="radio"
                name="signature_font_type"
                value="signature_font_type_architectsDaughter"
                onChange={handleFormOnChange}
                checked={form === "signature_font_type_architectsDaughter"}
                className="appearance-none border border-_B6B6B6 checked:border-_1A73E8 rounded-md w-full h-12"
              />
              <p className="text-lg font-architectsDaughter text-_030326 absolute w-fit text-center">
                {tilakaName}
              </p>
            </label>
            <label className="relative flex justify-center items-center">
              <input
                type="radio"
                name="signature_font_type"
                value="signature_font_type_giveYouGlory"
                onChange={handleFormOnChange}
                checked={form === "signature_font_type_giveYouGlory"}
                className="appearance-none border border-_B6B6B6 checked:border-_1A73E8 rounded-md w-full h-12"
              />
              <p className="text-base font-giveYouGlory text-_030326 absolute w-fit text-center">
                {tilakaName}
              </p>
            </label>
            <label className="relative flex justify-center items-center">
              <input
                type="radio"
                name="signature_font_type"
                value="signature_font_type_berkshireSwash"
                onChange={handleFormOnChange}
                checked={form === "signature_font_type_berkshireSwash"}
                className="appearance-none border border-_B6B6B6 checked:border-_1A73E8 rounded-md w-full h-12"
              />
              <p className="text-2xl font-berkshireSwash text-_030326 absolute w-fit text-center">
                {tilakaName}
              </p>
            </label>
            <label className="relative flex justify-center items-center">
              <input
                type="radio"
                name="signature_font_type"
                value="signature_font_type_missFajardose"
                onChange={handleFormOnChange}
                checked={form === "signature_font_type_missFajardose"}
                className="appearance-none border border-_B6B6B6 checked:border-_1A73E8 rounded-md w-full h-12"
              />
              <p className="text-2xl font-missFajardose text-_030326 absolute w-fit text-center">
                {tilakaName}
              </p>
            </label>
          </div>
        </div>
        <button
          onClick={() => {
            setModal(!modal);
            convertToDataURL();
          }}
          className="bg-primary btn  text-white font-poppins w-full mt-5 mx-auto rounded-sm h-9"
        >
          TERAPKAN
        </button>
        <button
          onClick={() => setModal(!modal)}
          className="  text-[#97A0AF]  font-poppins w-full  mx-auto rounded-sm h-9"
        >
          BATAL
        </button>
      </div>
    </div>
  ) : null;
};

const ChooseScratchModal: React.FC<Active> = ({ modal, setModal }) => {
  const sigPad = useRef<any>();
  const dispatch: AppDispatch = useDispatch();

  const onClickHandler = (e: React.SyntheticEvent) => {
    const scratch = sigPad.current.getTrimmedCanvas().toDataURL("image/png");
    dispatch(addScratch(scratch));
  };

  return modal ? (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
      className="fixed z-50 flex items-start transition-all duration-1000 justify-center w-full left-0 top-0 h-full "
    >
      <div className="bg-white max-w-md mt-20 pt-5 px-2 pb-3 rounded-md w-full mx-2">
        <p className="font-poppins block text-center  whitespace-nowrap  font-semibold ">
          Goresan
        </p>
        <SignaturePad sigPad={sigPad} />
        <button
          onClick={(e) => {
            setModal(!modal);
            onClickHandler(e);
          }}
          className="bg-primary btn  text-white font-poppins w-full mt-5 mx-auto rounded-sm h-9"
        >
          TERAPKAN
        </button>
        <button
          onClick={() => setModal(!modal)}
          className="  text-[#97A0AF]  font-poppins w-full mt-3  mx-auto rounded-sm h-9"
        >
          BATAL
        </button>
      </div>
    </div>
  ) : null;
};

const OTPModal: React.FC<Active> = ({ modal, setModal }) => {
  const [successSigning, setSuccessSigning] = useState<boolean>(false)
  const document = useSelector((state: RootState) => state.document);
  const signature = useSelector((state: RootState) => state.signature);
  const router = useRouter();

  const [values, setValues] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    if(modal && !successSigning){
        restGetOtp({})
        .then((res) => {
          toast(`Kode OTP telah dikirim ke Email anda`, {
            type: "info",
            toastId: "info",
            isLoading: false,
            position: "top-center",
          });
        })
        .catch(() => {
          toast.error("Kode OTP gagal dikirim", { icon: <XIcon /> });
        });
    }
  }, [modal]);

  const onClickHandler = () => {
    toast(`Loading...`, {
      type: "info",
      toastId: "loading",
      isLoading: true,
      position: "top-center",
    });
    restSigning({
      payload: {
        file_name: new Date().getTime().toString(),
        otp_pin: values.join(""),
        content_pdf: document.response.data.document,
        width: document.response.data.width,
        height: document.response.data.height,
        face_image: "",
        coordinate_x: document.response.data.posX,
        coordinate_y: document.response.data.posY,
        signature_image:
          signature.data.font ||
          signature.data.scratch ||
          document.response.data.tandaTangan,
        page_number: 1,
        qr_content: "",
        tilakey: "",
        company_id: "",
        api_id: "",
        trx_id: router.query.transaction_id as string,
      },
    }).then((res) => {
      console.log(res)
      setSuccessSigning(true)
      toast.dismiss("loading")
      localStorage.setItem("count", "0")
    }).catch((err) => {
      toast.dismiss("loading")
      if(err.request.status === 401){
        router.replace({
          pathname: "/login",
          query: { ...router.query },
        });
      }else {
        toast.error("Kode OTP salah", { icon: <XIcon /> });
        setValues(["", "", "", "", "", ""])
        const newCount = parseInt(localStorage.getItem("count" ) as string) + 1
        localStorage.setItem("count", newCount.toString())
        const count = parseInt(localStorage.getItem("count" ) as string) 
        if(count >= 5){
          localStorage.removeItem("token")
          localStorage.setItem("count", "0")
          restLogout()
          router.replace({
              pathname: "/login",
              query: { ...router.query },
            });
        }
      }
    })
  };

  return modal ? (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
      className="fixed z-50 flex items-start transition-all duration-1000 pb-3 justify-center w-full left-0 top-0 h-full "
    >
      <div className="bg-white max-w-md mt-20 pt-5 px-2 pb-3 rounded-md w-full mx-5">
        {
          successSigning ? (
            <div className="flex flex-col  items-center">
            <p className="font-poppins block text-center  whitespace-nowrap  font-semibold ">
              Tanda Tangan Berhasil
            </p>
            <div className="my-10">
              <Image width={150} height={150} src={`${assetPrefix}/images/successFR.svg`} />
            </div>

            <button
              onClick={() => {
                setModal(false);
              }}
              className="bg-primary btn  text-white font-poppins w-full mt-5 mx-auto rounded-sm h-9"
            >
              TUTUP
            </button>
          </div>
          ) : (
            <>
          <p className="font-poppins block text-center pb-5  whitespace-nowrap  font-semibold ">
          Goresan
        </p>
        <span className="font-poppins block text-center pb-5  ">
          Masukkan 6 digit OTP
        </span>
        <PinInput
          containerStyle={{ alignItems: "center", gap: 5, marginTop: "10px" }}
          inputStyle={{ alignItems: "center", gap: 5, marginTop: "10px" }}
          placeholder=""
          size="lg"
          values={values}
          onChange={(value, index, values) => setValues(values)}
        />
        <button
          disabled={values.join("").length < 6}
          onClick={onClickHandler}
          className="bg-primary btn mt-16 disabled:opacity-50 text-white font-poppins w-full mx-auto rounded-sm h-9"
        >
          TERAPKAN
        </button>
        <button
          onClick={() => {
            setValues(["", "", "", "", "", ""])
            setModal(!modal)
          }}
          className="  text-[#97A0AF]  font-poppins w-full mt-4  mx-auto rounded-sm h-9"
        >
          BATAL
        </button>
            </>
          )
        }
        
      </div>
    </div>
  ) : null;
};
