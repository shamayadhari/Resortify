import multer from "multer";
import { ZodError } from "zod";

import { env } from "../config/env.js";

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Validate req.body (or any value) with a zod schema; throws a 400 with a readable message. */
export function parse(schema, value) {
  const result = schema.safeParse(value ?? {});
  if (!result.success) throw zodToHttp(result.error);
  return result.data;
}

function zodToHttp(error) {
  const fieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return new HttpError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Check the details and try again.", {
    fieldErrors,
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "That endpoint doesn't exist.", details: {} } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let e = err;

  if (e instanceof ZodError) e = zodToHttp(e);
  else if (e instanceof multer.MulterError) {
    e =
      e.code === "LIMIT_FILE_SIZE"
        ? new HttpError(413, "FILE_TOO_LARGE", "Image must be 2 MB or smaller.")
        : new HttpError(400, "INVALID_FILE", "That file couldn't be uploaded. Use a JPG, PNG or WebP image.");
  } else if (e?.type === "entity.parse.failed") {
    e = new HttpError(400, "INVALID_JSON", "The request body isn't valid JSON.");
  } else if (e?.type === "entity.too.large") {
    e = new HttpError(413, "PAYLOAD_TOO_LARGE", "That request is too large.");
  } else if (e?.code === 11000) {
    e = new HttpError(409, "DUPLICATE", "That value is already in use.");
  } else if (e?.message === "CORS_NOT_ALLOWED") {
    e = new HttpError(403, "CORS_NOT_ALLOWED", "This origin isn't allowed to use the Resortify API.");
  }

  if (!(e instanceof HttpError)) {
    if (!env.isTest) console.error("[error]", err);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again.", details: {} },
    });
  }

  res.status(e.status).json({ error: { code: e.code, message: e.message, details: e.details ?? {} } });
}
