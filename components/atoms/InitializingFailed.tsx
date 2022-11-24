import i18n from "i18";

const InitializingFailed = () => {
  const { t }: any = i18n;
  return (
    <div
      className={`rounded-md z-[999] ease-in duration-300 absolute bg-[#E6E6E6] w-full h-[270px] flex justify-center items-center`}
    >
      <div className="text-center text-neutral50 font-poppins">
        <p>{t("intializingFailed")}</p>
        <button
          className="text-[#000] mt-2"
          onClick={() => window.location.reload()}
        >
          {t("clickHere")}
        </button>
      </div>
    </div>
  );
};

export default InitializingFailed;
