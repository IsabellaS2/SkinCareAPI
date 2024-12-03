const express = require('express');
const app = express ();
const db = require("./database.js")



app.use(express.json());
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
   console.log("Server Listening on PORT:", PORT);
 });


 app.get("/status", (request, response) => {
   const status = {
      'Status': 'Running'
   };
   
   response.send(status);
});



app.get("/products", (req, res, next) => {
   var sql = "select * from user"
   var params = []
   db.all(sql, params, (err, rows) => {
       if (err) {
         res.status(400).json({"error":err.message});
         return;
       }
       res.json({
           "message":"success",
           "data":rows
       })
     });
});