import "reflect-metadata";
import { Context } from 'aws-lambda';
import {dispatchEvent, DispatchRoutes} from 'aws-events-adapter';
import { httpRouter } from '../../infrastructure/http/HTTPRouter';
import { withJsonBodyParser } from "../../infrastructure/http/withJsonBodyParser";
import { withCors } from "../../infrastructure/http/withCors";
import { eventsRouter } from '../../infrastructure/events/EventsRouter';
import { queueRouter } from '../../infrastructure/queue/QueueRouter';

const handlers:DispatchRoutes = {
  apigateway: withCors(withJsonBodyParser(httpRouter)),
  eventbridge: eventsRouter,
  lambda: {},
  sqs: queueRouter,
}

export const handler = async (
  event: any,
  context: Context
): Promise<any> => {
  const resp = await dispatchEvent(event, handlers);
  return resp;
}

