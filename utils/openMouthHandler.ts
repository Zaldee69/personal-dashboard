import i18n from "i18";
import { log } from "@/utils/logging";

type Props = {
  distance: number;
  mouth_score: number;
  progressSetter: (number: number) => void;
  count: number;
  wrongActionSetter: (error: boolean, message: string) => void;
  isIndexDone: (i: any) => Promise<any>;
  setIndexDone: (i: any) => Promise<any>;
  currentActionIndex: number;
  clicked: boolean;
  capture: HTMLButtonElement;
};

const openMouthHandler = async ({
  distance,
  mouth_score,
  progressSetter,
  count,
  isIndexDone,
  setIndexDone,
  currentActionIndex,
  clicked,
  capture,
  wrongActionSetter,
}: Props) => {
  const { t }: any = i18n;
  if(mouth_score >= 0.3 && mouth_score < 0.39 && distance < 25) {
    progressSetter(32);
    wrongActionSetter(false, t("openMouthError2"))
  } else if(mouth_score >= 0.4 && mouth_score < 0.49 && distance < 25) {
    progressSetter(53);
    wrongActionSetter(false, t("openMouthError2"))
  } else if(mouth_score >= 0.5 && mouth_score < 0.59 && distance < 25) {
    progressSetter(70);
    wrongActionSetter(false, t("openMouthError2"))
  } else if(mouth_score >= 0.64 && distance < 25) {
    progressSetter(100);
    wrongActionSetter(false, "");
    await new Promise((resolve) => setTimeout(resolve, 1000));
      log(t("dontMove"), t("doNotMove"));
      await new Promise((resolve) => setTimeout(resolve, 500));
      let done = await isIndexDone(currentActionIndex);
      if (!done) {
        setIndexDone(currentActionIndex);
        ++currentActionIndex;
        capture.click();
        clicked = true;
    }
  }
else if (distance > 25) {
    wrongActionSetter(true, t("closeYourFace"));
    log(t(""), "");
    count = 1;
    progressSetter(0);
  } else {
    progressSetter(0);
    wrongActionSetter(true, t("openMouthError1"));
    log(t("dontMove"), "")
    count = 1;
    progressSetter(0);
  }
};

export default openMouthHandler;
