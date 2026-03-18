// utils/index.ts
import { sendResponse } from "./api.response";
import { CustomError, ErrorCode, HTTP_STATUS, SuccessCode, ERROR_MESSAGES, SUCCESS_MESSAGES } from "./customError.utility";
import { isValidEmail } from "./email.validator";
import { generateToken } from "./generate.token";
import { generateOTP, setUserOtp } from "./otp.utils";
import { generateBarcode } from "./barcode.generator";
import { deleteSingleFile, deleteFolderByPrefix } from "./cloundinary.delete";

export {
  // Response helpers
  sendResponse,

  // Error class + enums (sourced from constants via customError.utility)
  CustomError,
  ErrorCode,
  SuccessCode,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,

  // Validation
  isValidEmail,

  // Authentication / JWT
  generateToken,

  // OTP
  generateOTP,
  setUserOtp,

  // Barcode
  generateBarcode,

  // Cloudinary
  deleteSingleFile,
  deleteFolderByPrefix,
};
