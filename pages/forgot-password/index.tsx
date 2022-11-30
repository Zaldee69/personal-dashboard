import { Dispatch, SetStateAction, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import XIcon from "../../public/icons/XIcon";
import Head from "next/head";
import ReCAPTCHA from "react-google-recaptcha";
import { assetPrefix } from "../../next.config";
import { GetServerSideProps } from "next";
import { handleRoute } from "@/utils/handleRoute";

type Props = {};

type Tform = {
  email?: string;
};

const ForgotPassword = (props: Props) => {
  const [form, formSetter] = useState<Tform>({});
  const [modalSuccess, modalSuccessSetter] = useState<boolean>(false);
  const [reCaptchaSuccess, reCaptchaSuccessSetter] = useState<boolean>(false);

  const handleFormOnChange = (e: React.FormEvent<HTMLInputElement>): void => {
    formSetter({ ...form, [e.currentTarget.name]: e.currentTarget.value });
  };
  const handleFormOnSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      email: { value: Tform["email"] };
    };

    const email = target.email.value;

    if (email === "failure") {
      toast.error("Email tidak ditemukan", {
        icon: <XIcon />,
      });
    } else {
      modalSuccessSetter(true);
    }
  };
  const handleOnChangeReCaptcha = (value: string | null): void => {
    if (value === null) reCaptchaSuccessSetter(false);
    reCaptchaSuccessSetter(true);
  };

  return (
    <>
      <Head>
        <title>Lupa Kata Sandi</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="px-5 py-9 min-h-screen flex flex-col justify-between">
        <div>
          <p className="font-poppins text-lg font-semibold text-neutral800">
            Lupa Kata Sandi
          </p>
          <div className="flex justify-center mt-6">
            <Image
              src={`${assetPrefix}/images/forgotPassword.svg`}
              width="205px"
              height="205px"
              alt="forgot-ill"
            />
          </div>

          <div className="flex justify-center" style={{ minHeight: "180px" }}>
            {reCaptchaSuccess ? (
              <div className="w-full">
                <form onSubmit={handleFormOnSubmit}>
                  <label className="block mt-4">
                    <div className="flex justify-start items-center">
                      <p className="font-poppins text-sm text-neutral200 pl-2.5">
                        Email
                      </p>
                    </div>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        name="email"
                        placeholder="Masukkan Email"
                        value={form.email}
                        onChange={handleFormOnChange}
                        className="px-2.5 py-3 w-full focus:outline-none text-sm text-neutral800 placeholder:text-neutral50 font-poppins border border-neutral40 rounded-md"
                      />
                    </div>
                  </label>
                  <button
                    type="submit"
                    disabled={!form.email}
                    className="mt-48 w-full p-2.5 text-base disabled:opacity-50 text-white font-medium font-poppins rounded-sm bg-primary"
                  >
                    KIRIM
                  </button>
                </form>
              </div>
            ) : (
              <ReCAPTCHA
                sitekey="6LclJZggAAAAANygA1YWpx_qqrJybrVLHZBanCrs"
                onChange={handleOnChangeReCaptcha}
              />
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Image
            src={`${assetPrefix}/images/poweredByTilaka.svg`}
            alt="powered-by-tilaka"
            width="80px"
            height="41.27px"
          />
        </div>
      </div>
      <ModalSuccess modal={modalSuccess} setModal={modalSuccessSetter} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const params = context.query;
  const queryString = new URLSearchParams(params as any).toString();
  return {
    redirect: {
      permanent: false,
      destination: handleRoute("?" + queryString),
    },
  };
};

export default ForgotPassword;

const ModalSuccess: React.FC<{
  modal: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
}> = ({ modal, setModal }) => {
  return modal ? (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
      className="fixed z-50 flex items-center transition-all duration-1000 pb-3 justify-center w-full left-0 top-0 h-full "
    >
      <div className="bg-white max-w-md mt-20 px-3 pt-7 pb-4 rounded-xl w-full mx-5">
        <p className="font-poppins block text-center pb-5  whitespace-nowrap  font-semibold ">
          Email Telah Dikirim
        </p>
        <div className="mt-5 text-center">
          <Image
            src={`${assetPrefix}/images/checkCircle.svg`}
            width="53px"
            height="53px"
            alt="check-ill"
          />
        </div>
        <p className="text-neutral800 text-base font-normal mt-8 font-poppins text-center">
          Silahkan periksa email Anda untuk mereset kata sandi Anda.
        </p>
        <button
          onClick={() => setModal(false)}
          className="text-neutral80 font-poppins font-medium w-full mt-14 mx-auto rounded-sm py-2"
        >
          TUTUP
        </button>
      </div>
    </div>
  ) : null;
};
