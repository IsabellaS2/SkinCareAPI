import express from "express";
import dotenv from "dotenv";
import db from "./database.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/status", (req, res) => res.json({ status: "Running" }));

const parseJsonFields = (rows) =>
  rows.map((row) => ({
    ...row,
    recommended_skin_types: row.recommended_skin_types
      ? JSON.parse(row.recommended_skin_types)
      : [],
    ingredient_list: row.ingredient_list ? JSON.parse(row.ingredient_list) : [],
  }));

// Get all products
app.get("/products", (req, res) => {
  const sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM Products p
    LEFT JOIN RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN Ingredients i ON p.id = i.product_id
    GROUP BY p.id;
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({
      product_length: rows.length,
      message: "success",
      products: parseJsonFields(rows),
    });
  });
});

// By product type
app.get("/products/product-type", (req, res) => {
  const productType = req.query.product_type;
  if (!productType) {
    return res
      .status(400)
      .json({ error: "Missing product_type query parameter" });
  }
  const sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM Products p
    LEFT JOIN RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN Ingredients i ON p.id = i.product_id
    WHERE LOWER(p.product_type) = LOWER(?)
    GROUP BY p.id;
  `;
  db.all(sql, [productType], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({
      product_length: rows.length,
      message: "success",
      products: parseJsonFields(rows),
    });
  });
});

// By brand
app.get("/products/brand/:brand", (req, res) => {
  const brand = req.params.brand;
  if (!brand)
    return res.status(500).json({ error: "Brand parameter is required" });

  const checkBrandSQL = `SELECT 1 FROM Products p WHERE LOWER(p.brand) = LOWER(?) LIMIT 1;`;
  db.get(checkBrandSQL, [brand], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row)
      return res
        .status(404)
        .json({ error: `Brand ${brand} does not exist in our database.` });

    const sql = `
      SELECT 
        p.id AS product_id,
        p.product_name,
        p.product_type,
        p.brand,
        p.url,
        p.price,
        json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
        json_group_array(DISTINCT i.ingredient) AS ingredient_list
      FROM Products p
      LEFT JOIN RecommendedSkinTypes rst ON p.id = rst.product_id
      LEFT JOIN Ingredients i ON p.id = i.product_id
      WHERE LOWER(p.brand) = LOWER(?) 
      GROUP BY p.id;
    `;
    db.all(sql, [brand], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: `No products found for brand "${brand}".` });
      }
      res.json({
        product_length: rows.length,
        message: "success",
        products: parseJsonFields(rows),
      });
    });
  });
});

// By skin type(s)
app.get("/products/skin-type", (req, res) => {
  const skinTypes = req.query.recommended_skin_type;
  if (!skinTypes) {
    return res
      .status(400)
      .json({ error: "Missing recommended_skin_type query parameter" });
  }
  const skinTypeArray = skinTypes.split(",").map((t) => t.trim().toLowerCase());

  const sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM Products p
    LEFT JOIN RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN Ingredients i ON p.id = i.product_id
    GROUP BY p.id;
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    const filtered = rows
      .filter((row) => {
        const rec = row.recommended_skin_types
          ? JSON.parse(row.recommended_skin_types)
          : [];
        return rec.some((t) => t && skinTypeArray.includes(t.toLowerCase()));
      })
      .map((row) => ({
        ...row,
        recommended_skin_types: row.recommended_skin_types
          ? JSON.parse(row.recommended_skin_types)
          : [],
        ingredient_list: row.ingredient_list
          ? JSON.parse(row.ingredient_list)
          : [],
      }));
    res.json({
      message: "success",
      product_length: filtered.length,
      products: filtered,
    });
  });
});

// By ingredient(s)
app.get("/products/ingredient/:ingredients", (req, res) => {
  const ingredients = req.params.ingredients;
  if (!ingredients)
    return res
      .status(400)
      .json({ error: "Missing ingredient query parameter" });

  const ingredientArray = ingredients
    .split(",")
    .map((i) => i.trim().toLowerCase());
  const sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM Products p
    LEFT JOIN Ingredients i ON p.id = i.product_id
    GROUP BY p.id;
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    let matched = rows.filter((row) => {
      const list = row.ingredient_list ? JSON.parse(row.ingredient_list) : [];
      return (
        Array.isArray(list) &&
        ingredientArray.every((ing) =>
          list.some((x) => x && x.toLowerCase() === ing)
        )
      );
    });
    if (matched.length === 0) {
      return res
        .status(404)
        .json({ error: "No products found with the specified ingredients." });
    }
    matched = matched.map((row) => ({
      ...row,
      ingredient_list: row.ingredient_list
        ? JSON.parse(row.ingredient_list)
        : [],
    }));
    res.json({
      message: "success",
      product_length: matched.length,
      products: matched,
    });
  });
});

// By price
app.get("/products/price/:operator/:price", (req, res) => {
  const { operator, price } = req.params;
  const valid = { lt: "<", gt: ">", eq: "=" };
  if (!valid[operator])
    return res
      .status(400)
      .json({ error: "Invalid price operator. Use lt, gt, or eq." });

  const priceValue = Number(price);
  if (!Number.isFinite(priceValue))
    return res.status(400).json({ error: "Invalid price value." });

  const sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM Products p
    LEFT JOIN RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN Ingredients i ON p.id = i.product_id
    WHERE p.price ${valid[operator]} ?
    GROUP BY p.id;
  `;
  db.all(sql, [priceValue], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    if (rows.length === 0)
      return res
        .status(404)
        .json({ error: "No products found with the specified price filter." });
    res.json({
      message: "success",
      product_length: rows.length,
      products: parseJsonFields(rows),
    });
  });
});

// By ID
app.get("/products/:id", (req, res) => {
  const product_id = Number(req.params.id);
  if (!Number.isInteger(product_id) || product_id <= 0) {
    return res.status(400).json({ error: "Invalid product ID" });
  }
  const sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      COALESCE(GROUP_CONCAT(DISTINCT rst.skin_type), '') AS recommended_skin_types,
      COALESCE(GROUP_CONCAT(DISTINCT i.ingredient), '') AS ingredient_list
    FROM Products p
    LEFT JOIN RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN Ingredients i ON p.id = i.product_id
    WHERE p.id = ?
    GROUP BY p.id;
  `;
  db.all(sql, [product_id], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    if (rows.length === 0)
      return res
        .status(404)
        .json({ error: `Product with ID ${product_id} not found` });

    const out = rows.map((row) => ({
      ...row,
      recommended_skin_types: row.recommended_skin_types
        ? row.recommended_skin_types.split(",")
        : [],
      ingredient_list: row.ingredient_list
        ? row.ingredient_list.split(",")
        : [],
    }));
    res.json({ product_length: out.length, products: out });
  });
});

export default app;
