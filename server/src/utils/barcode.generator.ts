import crypto from "crypto";

export const generateBarcode = (length = 4): string => {
  const random = crypto.randomBytes(length).toString("hex").toUpperCase();
  return `DIA-${random}`;
};