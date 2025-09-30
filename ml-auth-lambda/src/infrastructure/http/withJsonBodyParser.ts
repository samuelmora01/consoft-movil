import { HttpRouter } from "aws-events-adapter";

function tryParseJsonBody(rawBody: unknown, isBase64Encoded?: boolean): any {
  if (!rawBody) return {};
  if (typeof rawBody !== 'string') return rawBody;
  try {
    const decoded = isBase64Encoded ? Buffer.from(rawBody, 'base64').toString('utf8') : rawBody;
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

export function withJsonBodyParser(router: HttpRouter): HttpRouter {
  const wrapHandler = (handler: Function) => async (event: any) => {
    if (event?.payload) {
      event.payload.body = tryParseJsonBody(event.payload.body, event.payload.isBase64Encoded);
    }
    return handler(event);
  };

  const wrapMethod = (methodObj?: Record<string, { handler: Function }>) => {
    if (!methodObj) return methodObj;
    const wrapped: Record<string, { handler: Function }> = {};
    Object.keys(methodObj).forEach((path) => {
      const route = methodObj[path];
      wrapped[path] = { handler: wrapHandler(route.handler) };
    });
    return wrapped;
  };

  return {
    get: wrapMethod(router.get),
    post: wrapMethod(router.post),
    put: wrapMethod(router.put),
    patch: wrapMethod(router.patch),
    delete: wrapMethod(router.delete)
  } as HttpRouter;
}


