// Validates part of the request against a zod schema. Invalid input gets a
// 400 naming the first bad field.
// - body: req.body is replaced with the parsed, trimmed result
// - query: the result goes to req.validQuery (req.query is read-only in Express 5)
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
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
  if (source === 'query') req.validQuery = result.data;
  else req.body = result.data;
  next();
};

module.exports = { validate };
