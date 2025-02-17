import express from "express";
import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./db.sqlite");

import dotenv from "dotenv";
dotenv.config();

import process from "process";

const app = express();
app.use(express.json());
const PORT = process?.env?.PORT || 5000;

app.get("/status", (req, res) => {
  res.json({ status: "Running" });
});

// Get all products
app.get("/products", (req, res) => {
  var sql = `
  SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
  FROM 
      Products p
  LEFT JOIN 
      RecommendedSkinTypes rst ON p.id = rst.product_id
  LEFT JOIN 
      Ingredients i ON p.id = i.product_id
  GROUP BY 
      p.id;
  `;
  var params = [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    rows = rows.map((row) => {
      row.recommended_skin_types = JSON.parse(row.recommended_skin_types);
      row.ingredient_list = JSON.parse(row.ingredient_list);
      return row;
    });

    res.json({
      product_length: rows.length,
      message: "success",
      products: rows,
    });
  });
});

// Get products by their product type e.g. Cleansing Oil
app.get("/products/by-type", (req, res) => {
  let productType = req.query.product_type;

  if (!productType) {
    return res
      .status(400)
      .json({ error: "Missing product_type query parameter" });
  }

  let sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM 
      Products p
    LEFT JOIN 
      RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN 
      Ingredients i ON p.id = i.product_id
    WHERE LOWER(p.product_type) = LOWER(?)
    GROUP BY p.id;
  `;

  db.all(sql, [productType], (err, rows) => {
    if (err) {
      console.error("Error:", err.message);
      return res.status(400).json({ error: err.message });
    }

    if (rows.length === 0) {
      console.log("No products found for type:", productType);
    }

    rows = rows.map((row) => ({
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
      product_length: rows.length,
      products: rows,
    });
  });
});

// Get products by their brand e.g. The Ordinary
app.get("/products/brand/:brand", (req, res) => {
  let brand = req.params.brand;

  if (!brand) {
    return res.status(500).json({ error: "Brand parameter is required" });
  }

  let checkBrandSQL = `
    SELECT 1 FROM Products p WHERE LOWER(p.brand) = LOWER(?) LIMIT 1;
  `;

  db.get(checkBrandSQL, [brand], (err, row) => {
    if (err) {
      console.error("Error checking brand:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res
        .status(404)
        .json({ error: `Brand ${brand} does not exist in our database.` });
    }

    let sql = `
      SELECT 
        p.id AS product_id,
        p.product_name,
        p.product_type,
        p.brand,
        p.url,
        p.price,
        json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
        json_group_array(DISTINCT i.ingredient) AS ingredient_list
      FROM 
        Products p
      LEFT JOIN 
        RecommendedSkinTypes rst ON p.id = rst.product_id
      LEFT JOIN 
        Ingredients i ON p.id = i.product_id
      WHERE LOWER(p.brand) = LOWER(?) 
      GROUP BY p.id;
    `;

    db.all(sql, [brand], (err, rows) => {
      if (err) {
        console.error("Error fetching products:", err.message);
        return res.status(500).json({ error: err.message });
      }

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: `No products found for brand "${brand}".` });
      }

      rows = rows.map((row) => ({
        ...row,
        recommended_skin_types: row.recommended_skin_types
          ? JSON.parse(row.recommended_skin_types)
          : [],
        ingredient_list: row.ingredient_list
          ? JSON.parse(row.ingredient_list)
          : [],
      }));

      res.json({
        product_length: rows.length,
        message: "success",
        products: rows,
      });
    });
  });
});

// Get products by their recommended skin type e.g. Dry, Oily
app.get("/products/by-skin-type", (req, res) => {
  let skinTypes = req.query.recommended_skin_type;

  if (!skinTypes) {
    return res
      .status(400)
      .json({ error: "Missing recommended_skin_type query parameter" });
  }

  // Split the comma-separated list of skin types
  let skinTypeArray = skinTypes
    .split(",")
    .map((type) => type.trim().toLowerCase());

  let sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM 
      Products p
    LEFT JOIN 
      RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN 
      Ingredients i ON p.id = i.product_id
    GROUP BY p.id;
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error:", err.message);
      return res.status(400).json({ error: err.message });
    }

    if (rows.length === 0) {
      console.log("No products found.");
    }

    rows = rows.filter((row) => {
      let recommendedTypes = row.recommended_skin_types
        ? JSON.parse(row.recommended_skin_types)
        : [];

      return recommendedTypes.some(
        (type) => type && skinTypeArray.includes(type.toLowerCase())
      );
    });

    rows = rows.map((row) => ({
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
      product_length: rows.length,
      products: rows,
    });
  });
});

// Get products by their ingredients e.g. Hyaluronic Acid, Salicylic Acid
app.get("/products/ingredient/:ingredients", (req, res) => {
  let ingredients = req.params.ingredients;

  if (!ingredients) {
    return res
      .status(400)
      .json({ error: "Missing ingredient query parameter" });
  }

  // Split the comma-separated list of ingredients
  let ingredientArray = ingredients
    .split(",")
    .map((ingredient) => ingredient.trim().toLowerCase());

  let sql = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      json_group_array(DISTINCT i.ingredient) AS ingredient_list
    FROM 
      Products p
    LEFT JOIN 
      Ingredients i ON p.id = i.product_id
    GROUP BY p.id;
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error:", err.message);
      return res.status(400).json({ error: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "No products found with the given ingredients." });
    }

    rows = rows.filter((row) => {
      // Ensure ingredient_list is not null or undefined
      let ingredientsList = row.ingredient_list ? JSON.parse(row.ingredient_list) : [];

      // Check that ingredientsList is an array and proceed
      return Array.isArray(ingredientsList) && ingredientArray.every(
        (ingredient) => ingredientsList.some((item) => item && item.toLowerCase() === ingredient)
      );
    });

    // If no products match, return an error
    if (rows.length === 0) {
      return res.status(404).json({ error: "No products found with the specified ingredients." });
    }

    rows = rows.map((row) => ({
      ...row,
      ingredient_list: row.ingredient_list ? JSON.parse(row.ingredient_list) : [],
    }));

    res.json({
      message: "success",
      product_length: rows.length,
      products: rows,
    });
  });
});




// Get a product by its ID
app.get("/products/:id", (req, res) => {
  const product_id = req.params.id;

  // Check if the product_id is a valid number
  if (isNaN(product_id) || product_id <= 0) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  var get_product_by_id = `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.product_type,
      p.brand,
      p.url,
      p.price,
      COALESCE(GROUP_CONCAT(DISTINCT rst.skin_type), '') AS recommended_skin_types,
      COALESCE(GROUP_CONCAT(DISTINCT i.ingredient), '') AS ingredient_list
    FROM 
      Products p
    LEFT JOIN 
      RecommendedSkinTypes rst ON p.id = rst.product_id
    LEFT JOIN 
      Ingredients i ON p.id = i.product_id
    WHERE 
      p.id = ?
    GROUP BY 
      p.id;
  `;

  var params = [product_id];

  db.all(get_product_by_id, params, (err, rows) => {
    if (err) {
      console.error("Error fetching product by ID:", err.message);
      return res.status(400).json({ error: err.message });
    }

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: `Product with ID ${product_id} not found` });
    }

    rows = rows.map((row) => {
      row.recommended_skin_types = row.recommended_skin_types
        ? row.recommended_skin_types.split(",")
        : [];
      row.ingredient_list = row.ingredient_list
        ? row.ingredient_list.split(",")
        : [];
      return row;
    });

    res.json({
      product_length: rows.length,
      products: rows,
    });
  });
});

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

export default app;
