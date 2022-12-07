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

let counter = 10;

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
  if (mouth_score >= 0.6 && distance < 25) {
    counter >= 700 ? 700 : (counter += 10);
    progressSetter(counter / 7);
    if (counter === 700 && mouth_score >= 0.6) {
      log(t("dontMove"), t("doNotMove"));
      let done = await isIndexDone(currentActionIndex);
      if (!done) {
        setIndexDone(currentActionIndex);
        ++currentActionIndex;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        capture.click();
        clicked = true;
      }
    }
  } else if (distance > 25) {
    wrongActionSetter(true, t("closeYourFace"));
    log(t("closeYourFace"), "");
    count = 1;
    progressSetter(0);
  } else if (mouth_score < 0.1) {
    progressSetter(0);
    wrongActionSetter(true, t("openMouthError1"));
    log(t("closeYourFace"), "");
    count = 1;
    progressSetter(0);
  }
};

export default openMouthHandler;
