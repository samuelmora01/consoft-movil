import { IResponse } from "serverless-request-manager";
import { IEvent } from "serverless-request-manager/dist/interfaces/IEvent";
import { container } from "../../infrastructure/container";
import { SignUp } from "../../application/use-cases/auth/SignUp";
import { ConfirmSignUp } from "../../application/use-cases/auth/ConfirmSignUp";
import { SignIn } from "../../application/use-cases/auth/SignIn";

async function signUp(event: IEvent): Promise<IResponse> {
  try {
    const signUpUseCase = container.resolve(SignUp);
    const signUpData = event.payload?.body || {};

    return await signUpUseCase.execute(signUpData);
  } catch (error) {
    console.error("Error in signUp HTTP handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error interno del servidor",
      }),
    };
  }
}

async function confirm(event: IEvent): Promise<IResponse> {
  try {
    const confirmSignUpUseCase = container.resolve(ConfirmSignUp);
    const confirmData = event.payload?.body || {};

    return await confirmSignUpUseCase.execute(confirmData);
  } catch (error) {
    console.error("Error in confirm HTTP handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error interno del servidor",
      }),
    };
  }
}

async function signIn(event: IEvent): Promise<IResponse> {
  try {
    const signInUseCase = container.resolve(SignIn);
    const signInData = event.payload?.body || {};

    // 🔹 Normalizar headers
    const rawHeaders: Record<string, any> =
      (event.payload?.headers as any) ||
      (event as any).eventRaw?.headers ||
      (event as any).headers ||
      {};
    const headersLc: Record<string, any> = {};
    for (const key of Object.keys(rawHeaders)) {
      headersLc[key.toLowerCase()] = rawHeaders[key];
    }

    // Helpers para obtener valores de headers
    const normalizeHeaderValue = (v: any): any => {
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item !== undefined && item !== null && item !== "") return item;
        }
        return v[0];
      }
      return v;
    };
    const getHeader = (...keys: string[]): any => {
      for (const k of keys) {
        const v = normalizeHeaderValue(headersLc[k.toLowerCase()]);
        if (v !== undefined && v !== null && v !== "") return v;
      }
      return undefined;
    };

    // 🔹 IP: priorizar x-forwarded-for → true-client-ip → cf-connecting-ip → x-real-ip → ip
    const toStringValue = (val: any): string | undefined => {
      if (typeof val === "string") return val;
      if (Array.isArray(val)) return toStringValue(val[0]);
      if (
        typeof val === "number" ||
        typeof val === "boolean" ||
        typeof val === "bigint"
      )
        return String(val);
      return undefined;
    };
    let ipRaw = getHeader(
      "x-forwarded-for",
      "true-client-ip",
      "cf-connecting-ip",
      "x-real-ip",
      "ip"
    );
    let ip = toStringValue(ipRaw);

    // Fallback a requestContext.sourceIp
    if (!ip) {
      const rc: any =
        (event as any).eventRaw?.requestContext ||
        (event as any).requestContext;
      ip = rc?.identity?.sourceIp || rc?.http?.sourceIp;
    }

    if (typeof ip === "string" && ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    if (!ip || typeof ip !== "string") {
      ip = "unknown";
    }

    // 🔹 Construcción de headers ya normalizados
    const headers = {
      appVersion: headersLc["app-version"] || headersLc["appversion"],
      platform: headersLc["platform"],
      ip,
      geo: (() => {
        try {
          const geoHeader = headersLc["geo"];
          return geoHeader ? JSON.parse(geoHeader) : {};
        } catch {
          return {};
        }
      })(),
    };

    return await signInUseCase.execute(signInData, headers);
  } catch (error) {
    console.error("Error in signIn HTTP handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error interno del servidor",
      }),
    };
  }
}

export const authUseCases = {
  signUp,
  confirm,
  signIn,
};
