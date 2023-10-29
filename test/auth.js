const expect = require("chai").expect;
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

const authMiddleware = require("../middlewares/is-auth");

describe("Auth middleware", function () {
  it("Should throw an error if there is no authorization header is present", function () {
    const req = {
      get: function (headerName) {
        return null;
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw(
      "Not authenticated",
    );
  });

  it("Should throw an error if authorization header has only one string", function () {
    const req = {
      get: function (headerName) {
        return "xyz";
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it("Should throw an error if token can be verified", function () {
    const req = {
      get: function (headerName) {
        return "Bearer xyz";
      },
    };

    sinon.stub(jwt, "verify");
    jwt.verify.returns({ userId: "abc" });

    authMiddleware(req, {}, () => {});

    expect(req).to.have.property("userId", "abc");
    expect(jwt.verify.called).to.be.true;

    jwt.verify.restore();
  });
});
