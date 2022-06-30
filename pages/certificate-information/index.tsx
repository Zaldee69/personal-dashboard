type Props = {};
import { setCertificate } from "@/redux/slices/certificateSlice";
import { useEffect } from "react";
import { AppDispatch, RootState } from "@/redux/app/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { RestRegisteredCertificate, RestConfirmCertificate } from "infrastructure/rest/b2b";
import { toast } from "react-toastify";
import { TConfirmCertificateRequestData } from "infrastructure/rest/b2b/types";

function CertificateInformation({}: Props) {

  const dispatch: AppDispatch = useDispatch();
  const { certificate } = useSelector((state: RootState) => state.certificate);
  const router = useRouter();
  const { company_id } = router.query;


  const getRegisteredCertificate = () => {
    const body = {
      company_id: company_id as string,
    }
    RestRegisteredCertificate(body).then((res) => {
      if (res?.data) {
        const result = JSON.parse(res.data[0])
        dispatch(setCertificate(result))
      } 
    }).catch((_) => {
      toast("Gagal mengecek sertifikat", {
        type: "error",
        toastId: "error",
        position: "top-center",
      });
    })
  } 

  useEffect(() => {
    if(!router.isReady) return
    getRegisteredCertificate()
  }, [router.isReady])
  
  const handleConfirm = (): void => {
    const body: TConfirmCertificateRequestData = {
      company_id: company_id as string,
      serial_number: certificate.serial_number
    }
    RestConfirmCertificate(body).then((res) => {
     if(res.success){
      router.push('/setting-signature-and-mfa')
     }
    }).catch((_) => {
      toast("Gagal mengaktifkan sertifikat", {
        type: "error",
        toastId: "error",
        position: "top-center",
      });
    })
  };
  return (
    <div className="bg-white p-4 font-poppins">
      <div className="flex justify-center">
        <img src="images/certInfo.svg" alt="ill" />
      </div>
      <p className="text-sm text-neutral800">
        Informasi data pada sertifikat Anda
      </p>
      <div className="mt-5">
        <div className="flex items-center">
          <p className="text-sm text-neutral800 font-normal w-24 pr-2">
            Negara
          </p>
          <p className="text-sm text-neutral800 font-medium">{ certificate.negara }</p>
        </div>
        <div className="flex items-center">
          <p className="text-sm text-neutral800 font-normal w-24 pr-2">Nama</p>
          <p className="text-sm text-neutral800 font-medium">{ certificate.nama }</p>
        </div>
        <div className="flex items-center">
          <p className="text-sm text-neutral800 font-normal w-24 pr-2">
            Organisasi
          </p>
          <p className="text-sm text-neutral800 font-medium">
            { certificate.organisasi }
          </p>
        </div>
        <div className="flex items-center">
          <p className="text-sm text-neutral800 font-normal w-24 pr-2">Email</p>
          <p className="text-sm text-neutral800 font-medium">
            { certificate.emailAddress }
          </p>
        </div>
      </div>
      <p className="text-xs text-neutral800 mt-4 font-normal text-justify">
        Apabila dalam jangka waktu{" "}
        <span className="font-semibold">
          sembilan hari kalender tidak ada keluhan,
        </span>{" "}
        maka pelanggan dianggap telah menerima bahwa semua informasi yang
        terdapat dalam sertifikat adalah benar.
      </p>
      <button
        onClick={handleConfirm}
        className="mt-8 p-2.5 text-base text-white bg-primary w-full font-medium rounded-sm"
      >
        SESUAI
      </button>
      <a
        target="_blank"
        rel="noreferrer"
        href="https://cantikatnt.atlassian.net/servicedesk/customer/portal/2/group/8/create/27"
        className="mt-4 p-2.5 text-base text-primary bg-white w-full font-medium rounded-sm border border-primary inline-block text-center"
      >
        AJUKAN KOMPLAIN
      </a>
      <div className="mt-8 flex justify-center">
        <img src="images/poweredByTilaka.svg" alt="powered-by-tilaka" />
      </div>
    </div>
  );
}

export default CertificateInformation;
