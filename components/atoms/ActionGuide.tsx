import Image from "next/image";
import React from "react";
import { assetPrefix } from "../../next.config";
import i18n from "i18";

type ActionGuide1Props = {
  actionList: any[];
  currentIndex: string;
  failedMessage: string;
  actionText: (text: string) => any;
  currentActionIndex: number;
};

type ActionGuide2Props = {
  currentIndex: string;
  isGenerateAction: boolean;
  isStepDone: boolean;
  isMustReload: boolean;
};

export const ActionGuide1 = (props: ActionGuide1Props) => {
  const { t }: any = i18n;
  return (
    <div className="flex gap-5 mx-2 mt-5">
      <div className="mt-1">
        {props.actionList.length === 2 && (
          <Image
            src={`${assetPrefix}/images/${props.currentIndex}.svg`}
            width={50}
            height={50}
            alt="2"
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-poppins font-medium">
          {props.actionText(props.actionList[props.currentActionIndex])}
        </span>
        {props.failedMessage ? (
          <span className="font-poppins text-sm text-red300">
            {props.failedMessage}
          </span>
        ) : (
          <span className="font-poppins text-sm text-neutral">
            {props.actionList.length > 1 && t("dontMove")}
          </span>
        )}
      </div>
    </div>
  );
};

export const ActionGuide2 = (props: ActionGuide2Props) => {
  const { t }: any = i18n;
  return (
    <div className="flex gap-5 mx-2 mt-5">
      <div className="mt-1">
        {!props.isGenerateAction && (
          <Image
            src={`${assetPrefix}/images/${
              !props.isStepDone ? "hadap-depan" : props.currentIndex
            }.svg`}
            width={50}
            height={50}
            alt="1"
            layout="fixed"
          />
        )}
      </div>
      <div className="flex items-center justify-center flex-col">
        <span className={`font-poppins w-full font-medium`}>
          {t("lookStraight")}
        </span>
        <span
          id={props.isMustReload ? "" : "log"}
          className=" font-poppins text-sm w-full  text-neutral"
        >
          {t("dontMove")}
        </span>
      </div>
    </div>
  );
};
