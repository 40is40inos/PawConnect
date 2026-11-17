// Validates req.body against a zod schema and replaces it with the parsed,
// trimmed result. Invalid input gets a 400 naming the first bad field.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || null,
      message: issue.message,
    }));
    const first = details[0];
    return res.status(400).json({
      error: first.field ? `${first.field}: ${first.message}` : first.message,
      details,
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
