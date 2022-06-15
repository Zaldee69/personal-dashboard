import axios from "axios";
import { resolve } from "path";
import {
  TKycCheckStepRequestData,
  TKycCheckStepResponseData,
  TKycFinalFormRequestData,
  TKycFinalFormResponseData,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://dev-register.tilaka.id";

export const RestKycCheckStep = ({
  payload,
}: {
  payload: TKycCheckStepRequestData;
}): Promise<TKycCheckStepResponseData> => {
  return axios
    .post<TKycCheckStepResponseData>(`${BASE_URL}/api/kyc/checkstep`, payload, {
      headers: {},
    })
    .then((res) => {
      console.log(res.data);
      if (res.data.data?.token) {
        localStorage.setItem("kyc_checkstep_token", res.data.data.token);
      } else {
        localStorage.removeItem("kyc_checkstep_token");
      }
      return res.data;
    })
    .catch((err) => {
      throw err;
    });
};

export const RestKycFinalForm = ({
  payload,
}: {
  payload: TKycFinalFormRequestData;
}): Promise<TKycFinalFormResponseData> => {
  return axios
    .post<TKycFinalFormResponseData>(`${BASE_URL}/api/kyc/finalform`, payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kyc_checkstep_token")}`,
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};