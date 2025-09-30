import { SqsRoutes } from "aws-events-adapter";
import { queueUseCases } from "../../interfaces/queue/queueUseCases";

export const queueRouter: SqsRoutes = {
    // Add your SQS queue handlers here
    // Example: "UserProcessingQueue": queueUseCases.processUser
};

