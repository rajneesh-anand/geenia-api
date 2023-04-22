const express = require("express");
const path = require("path");
const { readFileSync } = require("fs");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const router = express.Router();

async function getProducts(sheetTitle) {
  if (
    !(
      process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      process.env.GOOGLE_SPREADSHEET_PRODUCTS
    )
  ) {
    throw new Error("forbidden");
  }

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_PRODUCTS);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
      /\\n/gm,
      "\n"
    ),
  });
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[sheetTitle]; // or use doc.sheetsById[id]
  const rows = await sheet.getRows(); // can pass in { limit, offset }

  const products = rows?.map(
    ({
      id,
      name,
      slug,
      image,
      gallery,
      description,
      price,
      sale_price,
      unit,
      quantity_in_stock,
      tags,
      category,
    }) => ({
      id,
      name,
      slug,
      image,
      gallery,
      description,
      price,
      sale_price,
      unit,
      quantity_in_stock,
      tags,
      category,
    })
  );
  return products;
}

router.get("/categories", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "../upload/categories.json"));
});

router.get("/products/bodycare", async (req, res) => {
  try {
    const data = await getProducts("body_care");
    console.log(data);
    return res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ products: null });
  }
});

router.get("/products/skincare", async (req, res) => {
  try {
    const data = await getProducts("skin_care");
    console.log(data);
    return res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ products: null });
  }
});

router.get("/products/haircare", async (req, res) => {
  try {
    const data = await getProducts("hair_care");
    console.log(data);
    return res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ products: null });
  }
});

router.get("/products/makeup", async (req, res) => {
  try {
    const data = await getProducts("makeup");
    console.log(data);
    return res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ products: null });
  }
});

router.get("/products/phy", async (req, res) => {
  try {
    const data = await getProducts("phy");
    console.log(data);
    return res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ products: null });
  }
});

router.get("/product/bodycare/:slug", async (req, res) => {
  const product_slug = req.params.slug;
  try {
    const data = await getProducts("body_care");
    const selectedProduct = data.find((item) => item.slug === product_slug);

    res.status(200).json({ product: selectedProduct });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/product/skincare/:slug", async (req, res) => {
  const product_slug = req.params.slug;
  try {
    const data = await getProducts("skin_care");
    const selectedProduct = data.find((item) => item.slug === product_slug);
    res.status(200).json({ product: selectedProduct });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/product/haircare/:slug", async (req, res) => {
  const product_slug = req.params.slug;
  try {
    const data = await getProducts("hair_care");
    const selectedProduct = data.find((item) => item.slug === product_slug);
    res.status(200).json({ product: selectedProduct });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/product/makeup/:slug", async (req, res) => {
  const product_slug = req.params.slug;
  try {
    const data = await getProducts("makeup");
    const selectedProduct = data.find((item) => item.slug === product_slug);
    res.status(200).json({ product: selectedProduct });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/product/phy/:slug", async (req, res) => {
  const product_slug = req.params.slug;
  try {
    const data = await getProducts("phy");
    const selectedProduct = data.find((item) => item.slug === product_slug);
    res.status(200).json({ product: selectedProduct });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

module.exports = router;
