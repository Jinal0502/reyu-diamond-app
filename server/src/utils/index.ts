// utils/index.ts
import { sendResponse } from "./api.response";
import { CustomError } from "./customError.utility";
import { isValidEmail } from "./email.validator";
import { generateToken } from "./generate.token";
import { generateOTP, setUserOtp } from "./otp.utils";
import { generateBarcode } from "./barcode.generator";
import { deleteSingleFile, deleteFolderByPrefix } from "./cloundinary.delete";

export {
  // Response helpers
  sendResponse,

  // Error class
  CustomError,

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