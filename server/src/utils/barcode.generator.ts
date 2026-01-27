import crypto from "crypto";

export const generateBarcode = (): string => {

    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `DIA-${random}`;
}