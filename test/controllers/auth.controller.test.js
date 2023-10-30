const chai = require("chai");
const expect = chai.expect;
const env = require("dotenv").config();
const { validationResult } = require("express-validator");

const AuthController = require("../../controllers/auth");
const User = require("../../models/user");
const mongoose = require("mongoose");

describe("Login Tests", function () {
  before(async function () {
    try {
      await mongoose.connect(process.env.MONGOTESTDB_URI);

      const dummyUser = User({
        email: "dummy@example.com",
        password: "dummy",
        name: "Dummy",
      });

      return dummyUser.save();
    } catch (err) {
      throw err;
    }
  });

  it("should reject authentication if user is not found", async function () {
    const req = {
      body: {
        email: "notexistent@example.com",
        password: "notexistent",
      },
    };

    const next = (error) => {
      expect(error).to.be.an("error");
      expect(error.message).to.equal("User could not be found");
      expect(error).to.have.property("statusCode", 404);
    };

    await AuthController.logIn(req, {}, next);
  });

  it("should reject authentication if user is found, but the password is wrong", async function () {
    const req = {
      body: {
        email: "dummy@example.com",
        password: "notexistent",
      },
    };

    const next = (error) => {
      expect(error).to.be.an("error");
      expect(error.message).to.equal("Wrong password");
      expect(error).to.have.property("statusCode", 403);
    };

    await AuthController.logIn(req, {}, next);
  });

  it("should accept authentication if user is found, and password is correct", async function () {
    const req = {
      body: {
        email: "dummy@example.com",
        password: "dummy",
      },
    };

    const res = {
      status: (statusCode) => {
        expect(statusCode).to.equal(200);
        return res;
      },
      json: (data) => {
        expect(data.message).to.equal("Successfully logged in");
        expect(data.userId).to.be.a("string");
        expect(data.token).to.be.a("string");
      },
    };

    await AuthController.logIn(req, res, () => {});
  });

  after(async function () {
    try {
      await User.deleteMany({});
      await mongoose.disconnect();
    } catch (err) {
      throw err;
    }
  });
});

describe("Register Tests", function () {
  before(async function () {
    try {
      await mongoose.connect(process.env.MONGOTESTDB_URI);

      const dummyUser = User({
        email: "dummy@example.com",
        password: "dummy",
        name: "Dummy",
      });

      await dummyUser.save();
    } catch (err) {
      throw err;
    }
  });

  it("should reject creating users if email exists", async function () {
    const req = {
      body: {
        name: "Dummy",
        email: "dummy@example.com",
        password: "dummy",
      },
    };

    const next = (error) => {
      expect(error).to.be.an("error");
      expect(error.message).to.equal("User has already registered");
      expect(error).to.have.property("statusCode", 409);
    };

    await AuthController.createUser(req, {}, next);
  });

  it("should accept creating users if email does not exist and validation is accepted", async function () {
    const req = {
      body: {
        name: "Marshall",
        email: "marshall@example.com",
        password: "marshall",
      },
    };

    const res = {
      status: (statusCode) => {
        expect(statusCode).to.equal(201);
        return res;
      },
      json: (data) => {
        expect(data.message).to.include(" successfully created");
      },
    };

    await AuthController.createUser(req, res, () => {});
  });

  after(async function () {
    try {
      await User.deleteMany({});
      await mongoose.disconnect();
    } catch (err) {
      throw err;
    }
  });
});
