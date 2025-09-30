import { IResponse } from "serverless-request-manager";
import { IEvent } from "serverless-request-manager/dist/interfaces/IEvent";
import { container } from "../../infrastructure/container";

export const queueUseCases = {
    // Add your SQS queue handlers here
    // Example: 'YourQueueName': yourHandlerFunction
};