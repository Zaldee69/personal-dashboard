// Step status description
// A -> upload ktp; OCR;
// B -> liveness
// C -> dalam proses (transisi antara B ke D kalau proses d B memakan waktu lama)
// D -> final form / PIN
// E -> eror (kalau pas ngecek dukcapil ada masalah)
// F -> failed  (gagal liveness 3 kali, pas dukcapil di blg foto dan nama dan nik tidak sama, expired)
// S -> sukses
export type TStepStatus = "D" | "A" | "E" | "F" | "S" | "B" | "C";

export type TReasonCode = "0" | "1" | "2" | "3" | null; // 0=sukses, 1=gagal Dukcapil, 2=Liveness gagal, 3=Register ID expired

export type TKycCheckStepRequestData = {
  registerId: string;
};

export type TKycCheckStepResponseData = {
  success: boolean;
  message: string;
  data: {
    status: TStepStatus;
    token?: string;
    pin_form?: boolean; // shown when status === 'D' || status === 'F'
    reason_code: TReasonCode;
  };
};

export type TKycFinalFormRequestData = {
  registerId: string;
  password?: string;
  tilakaName?: string;
};

export type TKycFinalFormResponseData = {
  success: boolean;
  message: string;
  data: {
    status: string;
    reason_code: TReasonCode;
  };
};

export type TKycGenerateActionRequestData = {
  registerId: string;
};

export type TKycGenerateActionResponseData = {
  success: boolean;
  message: string;
  data: {
    actionList: string[];
    reason_code: TReasonCode;
  };
};

export type TKycVerificationRequestData = {
  registerId: string;
  mode: string;
  image_selfie: string;
  image_action1: string;
  image_action2: string;
  image_action3: string;
};

export type TKycVerificationResponseData = {
  success: boolean;
  message: string;
  data: {
    nik: string;
    name: string;
    email: string;
    companyname: string;
    status: TStepStatus;
    pin_form: boolean;
    config_level: number;
    numFailedLivenessCheck?: number;
    reason_code: TReasonCode;
  };
};

export type TKycGenerateActionRevokeRequestData = {
  revokeId: string;
};

export type TKycGenerateActionRevokeResponseData = {
  success: boolean;
  message: string;
  data: {
    actionList: string[];
    token: string;
  };
};

export type TKycVerificationRevokeRequestData = {
  revokeId: string;
  image_selfie: string;
  image_action1?: string;
  image_action2?: string;
  image_action3?: string;
};

export type TKycVerificationRevokeResponseData = {
  success: boolean;
  message: string;
  data: {
    matchLiveness: boolean;
    matchSelfie: boolean;
    status: string;
    reason: string;
    user: string;
  };
};

export type TKycCheckStepIssueRequestData = {
  issueId: string;
};

export type TKycCheckStepIssueResponseData = {
  success: boolean;
  message: string;
  data: {
    status: TStepStatus;
    token?: string;
    reason_code: TReasonCode;
  };
};

export type TKycGenerateActionIssueRequestData = {
  issueId: string;
};

export type TKycGenerateActionIssueResponseData = {
  success: boolean;
  message: string;
  data: {
    actionList: string[];
    reason_code: TReasonCode;
  };
};

export type TKycVerificationIssueRequestData = {
  issueId: string;
  image_selfie: string;
  image_action1: string;
  image_action2?: string;
  image_action3?: string;
};

export type TKycVerificationIssueResponseData = {
  success: boolean;
  message: string;
  data: {
    status: string;
    reason_code: TReasonCode;
  };
};
