export async function validatePayload<T>(schema: { validate: (payload: any) => Promise<T> }, payload: unknown): Promise<T> {
  try {
    return await schema.validate(payload);
  } catch (error: any) {
    throw {
      code: "VALIDATION_ERROR",
      status: 422,
      message: "Erreur de validation",
      details: error?.messages ?? error,
    };
  }
}
