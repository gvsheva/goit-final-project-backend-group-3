export class ServiceError extends Error {
    status: number;
    code: string;

    constructor(message: string, status = 400, code = "SERVICE_ERROR") {
        super(message);
        this.name = "ServiceError";
        this.status = status;
        this.code = code;
    }
}
