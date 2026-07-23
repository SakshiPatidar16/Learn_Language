import { validationResult } from "express-validator";

/**
 * Run after express-validator chains.
 * Returns 422 with the first error message if validation fails.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg });
  }
  next();
}
