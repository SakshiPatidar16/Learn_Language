import { body, param } from "express-validator";

export const signupRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
];

export const loginRules = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
];

export const languageRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required")
];

export const unitRules = [
  param("languageId").trim().notEmpty().withMessage("Language id is required"),
  body("name").trim().notEmpty().withMessage("Unit name is required")
];

export const programRules = [
  param("unitId").trim().notEmpty().withMessage("Unit id is required"),
  body("question").trim().notEmpty().withMessage("Question is required"),
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("output").trim().notEmpty().withMessage("Output is required")
];
