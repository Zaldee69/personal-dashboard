import i18n from "i18";
let blinkCount: number = 1;
import { log } from "@/utils/logging";

type Props = {
  distance: number;
  blink_left_eye: boolean;
  blink_right_eye: boolean;
  wrongActionSetter: (error: boolean, message: string) => void;
  progressSetter: (number: number) => void;
  count: number;
  isIndexDone: (i: any) => Promise<any>;
  setIndexDone: (i: any) => Promise<any>;
  currentActionIndex: number;
  clicked: boolean;
  capture: HTMLButtonElement;
};

const blinkHandler = async ({
  distance,
  blink_left_eye,
  blink_right_eye,
  count,
  progressSetter,
  isIndexDone,
  setIndexDone,
  currentActionIndex,
  clicked,
  capture,
  wrongActionSetter,
}: Props) => {
  const { t }: any = i18n;
  if (blink_left_eye || (blink_right_eye && distance < 25)) {
    blinkCount >= 30 ? blinkCount : blinkCount++;
    if (blinkCount >= 10 && blinkCount <= 19 && distance < 25) {
      progressSetter(30);
      wrongActionSetter(false, "");
    } else if (blinkCount >= 20 && blinkCount <= 29 && distance < 25) {
      progressSetter(65);
      wrongActionSetter(false, "");
      log(t("dontMove"), t("doNotMove"));
    } else if (blinkCount === 30 && distance < 25) {
      progressSetter(100);
      wrongActionSetter(false, "");
      let done = await isIndexDone(currentActionIndex);
      if (!done) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIndexDone(currentActionIndex);
        ++currentActionIndex;
        capture.click();
        clicked = true;
      }
    } else if (distance > 25) {
      wrongActionSetter(true, t("closeYourFace"));
      log(t("closeYourFace"), "");
    }
  } else if (distance > 25) {
    wrongActionSetter(true, t("closeYourFace"));
    log(t("closeYourFace"), "");
  } else {
    wrongActionSetter(true, t("blinkError"));
    log(t("blinkError"), "");
    blinkCount = 1;
    count = 1;
  }
};

export default blinkHandler;
