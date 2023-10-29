const sinon = require("sinon");
const expect = require("chai").expect;
const jwt = require("jsonwebtoken");

const AuthMiddleware = require("../../middlewares/is-auth");

describe("Authorization Middleware", function () {
  it("should reject authorization if not authenticated", function () {
    const req = {
      get: () => null,
    };

    expect(() => AuthMiddleware(req, {}, () => {})).to.throw();
  });

  it("should reject authorization if token is not verified", function () {
    const req = {
      get: () => "Bearer asd",
    };

    sinon.stub(jwt, "verify");
    jwt.verify.throws();

    expect(() => AuthMiddleware(req, {}, () => {})).to.throw();
    jwt.verify.restore();
  });
});
