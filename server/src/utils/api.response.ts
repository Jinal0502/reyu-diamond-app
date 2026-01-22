import { Response } from "express";

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: any,
  errors?: any
) => {
  const response: any = {
    success,
    message,
  };

  if (data !== undefined) response.data = data;
  if (errors !== undefined) response.errors = errors;

  return res.status(statusCode).json(response);
};
