import { HttpRouter } from "aws-events-adapter";

type LambdaHttpEvent = {
  payload?: {
    headers?: Record<string, any>;
    body?: any;
    isBase64Encoded?: boolean;
    httpMethod?: string;
    requestContext?: any;
  };
  // Some adapters might pass raw under a different key
  eventRaw?: any;
};

type HttpResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body?: any;
};

function normalizeHeaders(headers: Record<string, any> | undefined): Record<string, any> {
  const result: Record<string, any> = {};
  if (!headers) return result;
  for (const key of Object.keys(headers)) {
    result[key.toLowerCase()] = headers[key];
  }
  return result;
}

function getRequestMethod(event: LambdaHttpEvent): string | undefined {
  const payload = event.payload as any;
  const raw = (event as any).eventRaw || (event as any);
  return (
    payload?.httpMethod ||
    raw?.httpMethod ||
    raw?.requestContext?.http?.method ||
    raw?.requestContext?.httpMethod
  );
}

function buildCorsHeaders(originHeader?: string): Record<string, string> {
  const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allowedOrigins = envOrigins.length > 0
    ? envOrigins
    : "";

  const varyHeader = "Origin";
  let allowOrigin = "";
  if (originHeader && allowedOrigins.includes(originHeader)) {
    allowOrigin = originHeader;
  } else if (allowedOrigins.includes("*")) {
    allowOrigin = "*";
  }

  const headers: Record<string, string> = {
    Vary: varyHeader,
    "Access-Control-Allow-Credentials": "false",
    "Access-Control-Max-Age": "600",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,appVersion,app-version,platform,geo,x-forwarded-for,x-real-ip",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  return headers;
}

function mergeHeaders(existing: Record<string, string> | undefined, cors: Record<string, string>): Record<string, string> {
  return { ...(existing || {}), ...cors };
}

export function withCors(router: HttpRouter): HttpRouter {
  const wrapHandler = (handler: Function) => async (event: LambdaHttpEvent): Promise<HttpResponse> => {
    const rawHeaders =
      (event.payload?.headers as any) ||
      (event as any).eventRaw?.headers ||
      (event as any).headers ||
      {};
    const headersLc = normalizeHeaders(rawHeaders);
    const origin = headersLc["origin"]; // browsers send "Origin"

    const method = (getRequestMethod(event) || "").toUpperCase();
    const corsHeaders = buildCorsHeaders(typeof origin === "string" ? origin : undefined);

    // Handle preflight
    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: corsHeaders,
        body: "",
      };
    }

    const response = (await handler(event)) as HttpResponse;
    response.headers = mergeHeaders(response.headers, corsHeaders);
    return response;
  };

  const wrapMethod = (methodObj?: Record<string, { handler: Function }>) => {
    if (!methodObj) return methodObj as any;
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
    delete: wrapMethod(router.delete),
  } as HttpRouter;
}


