import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app";

jest.doMock("sqlite3", () => {
  return {
    Database: jest.fn(() => ({
      get: jest.fn((sql, params, callback) => callback(new Error("Database error"))),
      all: jest.fn(),
    })),
  };
});

describe("Brand Error Handling", () => {
  it("should return 404 when a brand does not exist", async () => {
    const response = await request(app).get("/products/brand/TestBrand");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Brand TestBrand does not exist in our database.");
  });
});
