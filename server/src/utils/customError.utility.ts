export class CustomError extends Error {
    statusCode: number;
    errors?: any; // optional extra error details

    constructor(message: string, statusCode: number = 400, errors?: any) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;

        // Fix prototype chain for instanceof checks
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}