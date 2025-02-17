import express from "express";
import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./db.sqlite");

import dotenv from "dotenv";
dotenv.config();

import process from "process";

const app = express();
app.use(express.json());
const PORT = process?.env?.PORT || 4000;

app.get("/status", (req, res) => {
  res.json({ status: "Running" });
});

const sql_get_all_products = `
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

app.get("/products", (req, res) => {
  var sql = sql_get_all_products;
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
      message: "success",
      products: rows,
    });
  });
});

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
      products: rows,
    });
  });
});

app.get("/products/:id", (req, res) => {
  const product_id = req.params.id;

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
      res.status(400).json({ error: err.message });
      return;
    }

    if (rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
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
      products: rows,
    });
  });
});

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

export default app;
