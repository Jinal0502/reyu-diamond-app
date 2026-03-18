import { Response } from "express";

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: any,
  errors?: any,
  code?: string
) => {
  const response: any = {
    success,
    message,
  };

  if (code !== undefined) response.code = code;
  if (data !== undefined) response.data = data;
  if (errors !== undefined) response.errors = errors;

  return res.status(statusCode).json(response);
};
