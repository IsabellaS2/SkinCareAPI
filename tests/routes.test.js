import request from "supertest";
import app from "../app";
import jest from "jest";

describe("GET /status", () => {
  it('should return status "Running"', async () => {
    const response = await request(app).get("/status");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Running");
  });
});



describe("GET /products", () => {
  it("should get all products", async () => {
    const response = await request(app).get("/products");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });
});

describe("GET /products/id", () => {
  it("should get a product by ID", async () => {
    const response = await request(app).get("/products/1");
    expect(response.status).toBe(200);
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].product_id).toBe(1);
  });

    //Product ID
    it("should return 400 if product ID is not a valid number", async () => {
      const response = await request(app).get("/products/abc");
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid product ID");
    });
  
    it("should return 404 if product id does not exist", async () => {
      const response = await request(app).get("/products/9999");
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Product with ID 9999 not found");
    });
});

describe("GET /products/product-type", () => {
  it("should get products by their product type", async () => {
    const response = await request(app).get(
      "/products/by-type?product_type=Cleansing%20Oil"
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });

  it("should return 400 if product_type query parameter is missing", async () => {
    const response = await request(app).get("/products/by-type");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing product_type query parameter");
  });

  it("should return empty array if no products match type", async () => {
    const response = await request(app).get(
      "/products/by-type?product_type=NonexistentType"
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toEqual([]);
  });
});

describe("GET /products/by-skin-type", () => {
  it("should get products by 1 recommended skin type", async () => {
    const response = await request(app).get(
      "/products/by-skin-type?recommended_skin_type=oily"
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });

  it("should get products by more than 1 recommended skin type", async () => {
    const response = await request(app).get(
      "/products/by-skin-type?recommended_skin_type=oily,dry"
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });


  it("should return 404 if no products match the skin types", async () => {
    const response = await request(app).get(
      "/products/by-skin-type?recommended_skin_type=apples"
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toEqual([]);
  });

  it("should handle an empty recommended_skin_type query parameter gracefully", async () => {
    const response = await request(app).get(
      "/products/by-skin-type?recommended_skin_type="
    );
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Missing recommended_skin_type query parameter"
    );
  });
});

describe("GET /products/by-brand", () => {
  it("should get products by their brand", async () => {
    const response = await request(app).get("/products/brand/cosrx");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });

  it("should return 404 if brand does not exist", async () => {
    const response = await request(app).get("/products/brand/NonexistentBrand");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "Brand NonexistentBrand does not exist in our database."
    );
  });
});

describe("GET /products/ingredient", () => {
  it("should get products by their ingredient", async () => {
    const response = await request(app).get("/products/ingredient/water");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("success");
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });

  it("should return 404 if brand does not exist", async () => {
    const response = await request(app).get("/products/ingredient/nonexistentingredient");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "No products found with the specified ingredients."
    );
  });
});