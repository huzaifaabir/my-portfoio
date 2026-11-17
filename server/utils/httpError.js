// Errors with an HTTP status. Thrown in sanitizers / services; turned into JSON by errors.js
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
module.exports = HttpError;
