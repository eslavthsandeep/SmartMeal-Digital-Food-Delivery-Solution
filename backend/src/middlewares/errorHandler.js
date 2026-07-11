export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
export default errorHandler;
