import { ErrorCode, HTTP_STATUS } from "../constants";

export { ErrorCode, SuccessCode, HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";

/* ================= CUSTOM ERROR CLASS ================= */
export class CustomError extends Error {
  statusCode: number;
  errorCode?: ErrorCode;
  errors?: any;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.BAD_REQUEST,
    errorCode?: ErrorCode,
    errors?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
