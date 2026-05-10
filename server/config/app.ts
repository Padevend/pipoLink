import { type Context } from "hono";
import type { VineValidator } from "@vinejs/vine";

type AnyValidator = VineValidator<any, any>;

type InferValidator<T extends AnyValidator> = Awaited<
  ReturnType<T["validate"]>
>;

export interface HttpContext extends Context {
  validateUsing: <T extends AnyValidator>(
    validator: T,
  ) => Promise<InferValidator<T>>;
}

// capture des erreurs de validations

export class ValidationException extends Error {
  status: number;
  code: string;
  messages: any;

  constructor(errors: any) {
    super("Validation failed");
    this.status = errors.status || 422;
    this.code = errors.code || "VALIDATION_ERROR";
    this.messages = errors.messages || errors;
  }
}

// ----------------------------------
// Gestion des controllers
// ----------------------------------

export function callAction<T>(
  Controller: new () => T,
  method: keyof T,
  data?: object,
) {
  return async (c: Context) => {
    const instance = new Controller();

    const action = instance[method];

    if (typeof action !== "function") {
      throw new Error(
        `Méthode ${String(method)} introuvable dans ${Controller.name}`,
      );
    }

    const validateUsing = async <T extends AnyValidator>(
      validator: T,
    ): Promise<InferValidator<T>> => {
      return await validateData(c, validator);
    };

    try {
      const extendedContext = c as HttpContext;
      extendedContext.validateUsing = validateUsing;

      return await (action as any).call(instance, extendedContext, data);
    } catch (error: any) {
      if (error instanceof ValidationException) {
        return c.json(
          {
            code: error.code,
            messages: error.messages,
          },
          402,
        );
      }

      // autres erreurs
      console.log(error);
      return c.json(
        {
          code: "INTERNAL_ERROR",
          message: error.message,
        },
        500,
      );
    }
  };
}

// ----------------------------------
// Validation automatique
// ----------------------------------

export async function validateData<T extends AnyValidator>(
  context: Context,
  validator: T,
): Promise<InferValidator<T>> {
  let body: Record<string, any> = {}
  const contentType = context.req.header("Content-Type");

  if(contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")){
    body = await context.req.parseBody({dot: true, all: true })
  }
  
  if(contentType?.startsWith("application/json")){
    body = await context.req.json()
  }

  try {
    const valid = await validator.validate(body);
    return valid as InferValidator<T>;
  } catch (errors: unknown) {
    throw new ValidationException(errors);
  }
}
