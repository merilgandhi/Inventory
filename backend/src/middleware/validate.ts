import { Request, Response, NextFunction } from "express";

export const validate = (schema) => async (req, res, next) => {
  try {
    const validated = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, 
    });

    req.body = validated; 
    next();
    
  } catch (err) {
    const errors = {};
    if (err.inner) {
      err.inner.forEach((e) => {
        errors[e.path] = e.message;
      });
    }
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }
};
