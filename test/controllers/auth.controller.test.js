const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const env = require("dotenv").config;
const bcrypt = require("bcryptjs");

const AuthController = require("../../controllers/auth");
const User = require("../../models/user");

chai.use(chaiHttp);

describe("Authentication Controller", function () {
  it("should reject authentication if user is not found", function () {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "notexistent@example.com",
        password: "notexistent",
      },
    };

    expect(() => AuthController.logIn(req, {}, () => {})).to.not.have.property(
      "token",
    );

    User.findOne.restore();
  });

  it("should reject authentication if user is found, but the password is wrong", function () {
    sinon.stub(User, "findOne");
    sinon.stub(bcrypt, "compare");

    const req = {
      body: {
        email: "existent@example.com",
        password: "existent",
      },
    };

    User.findOne.returns({
      _id: "Thisistheid",
      email: "existent@example.com",
      password: "existent",
    });
    bcrypt.compare.returns(undefined);

    expect(() => AuthController.logIn(req, {}, () => {})).to.not.have.property(
      "token",
    );

    User.findOne.restore();
    bcrypt.compare.restore();
  });

  it("should accept authentication if user is found, and password is correct", function () {});
});
