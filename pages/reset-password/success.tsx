import Image from "next/image";
import Head from "next/head";
import { assetPrefix } from "../../next.config";
import { GetServerSideProps } from "next";
import { handleRoute } from "@/utils/handleRoute";

type Props = {};

const LinkAccount = (props: Props) => {
  return (
    <>
      <Head>
        <title>Pengaturan Ulang Kata Sandi Berhasil</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="px-5 py-9 min-h-screen flex flex-col justify-between">
        <div className="text-center">
          <p className="font-poppins text-lg font-normal text-neutral800 text-center">
            Pengaturan Ulang Kata Sandi Berhasil
          </p>
          <div className="mt-9">
            <Image
              src={`${assetPrefix}/images/linkAccountSuccess.svg`}
              width="151px"
              height="151px"
              alt="liveness-success-ill"
            />
          </div>
        </div>
        <div className="mt-48 flex justify-center">
          <Image
            src={`${assetPrefix}/images/poweredByTilaka.svg`}
            alt="powered-by-tilaka"
            width="80px"
            height="41.27px"
          />
        </div>
      </div>
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

export default LinkAccount;
