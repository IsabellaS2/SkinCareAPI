const request = require('supertest');
const app = require('../app');

describe('Products API', () => {
    it('should get all products', async () => {
    const response = await request(app).get('/products');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('success');
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });

  it('should get products by their product type', async () => {
    const response = await request(app).get('/products/by-type?product_type=Cleansing%20Oil');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('success');
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0); 
  });

  it('should return empty array if no products match type', async () => {
    const response = await request(app).get('/products/by-type?product_type=NonexistentType');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('success');
    expect(response.body.products).toEqual([]);
  });

  it('should get a product by ID', async () => {
    const response = await request(app).get('/products/1');
    expect(response.status).toBe(200);
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].product_id).toBe(1);
  });

  it('should return 404 if product ID does not exist', async () => {
    const response = await request(app).get('/products/9999'); 
    expect(response.status).toBe(404);
  });

});
