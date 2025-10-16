# SkinCareApp

### Running the app

use `nodemon app.js` to run it
use `npm test` to test it
use `npx eslint .` to lint it



| Action                                  |                                 Route                                  |
| --------------------------------------- | :--------------------------------------------------------------------: |
| Get all products                        |                    `http://localhost:4000/products`                    |
| Get products by product id              |                   `http://localhost:4000/products/5`                   |
| Get products by a specific product type  | `http://localhost:4000/products/product-type?product_type=Face%20Wash` |
| Get products by their brand             |         `http://localhost:4000/products/brand/the%20ordinary`          |
| Get products by their skin type         | `http://localhost:4000/products/skin-type?recommended_skin_type=oily`  |
| Get products by their ingredients       |           `http://localhost:4000/products/ingredient/Water`            |
| Get products by their price - less than |              `http://localhost:4000/products/price/lt/10`               |
| Get products by their price - equal to  |              `http://localhost:4000/products/price/eq/10`               |
| Get products by their price - more than |              `http://localhost:4000/products/price/gt/10`               |
