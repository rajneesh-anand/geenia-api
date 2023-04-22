const express = require("express");
const { IncomingForm } = require("formidable");
const path = require("path");
const router = express.Router();
const { readFileSync } = require("fs");

// router.post("/pricing", async (req, res) => {
//   const data = await new Promise((resolve, reject) => {
//     const form = new IncomingForm();
//     form.parse(req, async (err, fields, files) => {
//       if (err) return reject(err);
//       resolve({ fields, files });
//     });
//   });

//   const rawData = fs.readFileSync(data.files.uploadedFile.path);

//   try {
//     fs.writeFile(
//       path.join(__dirname, `../upload/pricing.json`),
//       rawData,
//       function (err) {
//         if (err) console.log(err);
//         return res.status(200).json({
//           status: "success",
//           message: "File uploaded successfully",
//         });
//       }
//     );
//   } catch (error) {
//     console.log(error);
//     res.json(error);
//   }
// });

router.get("/categories", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/categories.json"));
});

router.get("/products", (req, res) => {
  const data = readFileSync(
    path.join(__dirname, "../upload/products.json"),
    "utf-8"
  );
  const products = JSON.parse(data);
  res.status(200).json({ msg: "success", products: products });
});

router.get("/related-products", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/related_products.json"));
});

router.get("/product/:slug", (req, res) => {
  const product_slug = req.params.slug;

  const data = readFileSync(
    path.join(__dirname, "../upload/products.json"),
    "utf-8"
  );
  const products = JSON.parse(data);

  const selectedProduct = products.find((item) => item.slug === product_slug);

  res.status(200).json({ msg: "success", product: selectedProduct });
});

router.get("/products/bodycare", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/bodycare.json"));
});

router.get("/products/skincare", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/skincare.json"));
});

router.get("/products/haircare", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/haircare.json"));
});

router.get("/products/makeup", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/makeup.json"));
});

router.get("/products/phy", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/phy.json"));
});

module.exports = router;
