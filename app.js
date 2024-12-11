const express = require('express');
const app = express ();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

app.use(express.json());
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
   console.log("Server Listening on PORT:", PORT);
 });


 app.get('/status', (req, res) => {
  res.json({ status: 'Running' });
});

const SQLCommandGetAll = `
SELECT 
    p.id AS product_id,
    p.product_name,
    p.product_type,
    p.brand,
    p.url,
    p.price,
    -- Format recommended skin types as JSON array
    json_group_array(DISTINCT rst.skin_type) AS recommended_skin_types,
    -- Format ingredient list as JSON array
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
  var sql = SQLCommandGetAll;  
  var params = [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({"error": err.message});
      return;
    }

    // Parse JSON strings into arrays
    rows = rows.map(row => {
      row.recommended_skin_types = JSON.parse(row.recommended_skin_types);
      row.ingredient_list = JSON.parse(row.ingredient_list);
      return row;
    });

    res.json({
      "message": "success",
      "products": rows
    });
  });
});
