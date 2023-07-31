import { ErrorRequestHandler } from "express";

const errorHandlerMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  return res.status(400).json({ message: "error", errors: err.errors });
};

export default errorHandlerMiddleware;
