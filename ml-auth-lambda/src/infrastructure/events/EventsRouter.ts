import { EventBridgeRoutes } from "aws-events-adapter";
import { eventUseCases } from "../../interfaces/events/eventUseCases";

export const eventsRouter: EventBridgeRoutes = {
    // Add your EventBridge event handlers here
    // Example: "user.created": eventUseCases.userCreated
};

