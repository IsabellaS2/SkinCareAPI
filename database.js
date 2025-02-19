import sqlite3 from "sqlite3";

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE RecommendedSkinTypes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT,
                skin_type VARCHAR(255),
                FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
            )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created, creating some rows
                // var insert = 'INSERT INTO RecommendedSkinTypes (product_id, skin_type) VALUES (?,?)'
            }
        });  
    }
});

export default db;