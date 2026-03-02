import validator from "validator";

export const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email.trim(), { allow_utf8_local_part: false });
};