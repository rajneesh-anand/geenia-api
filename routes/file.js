const express = require("express");
const path = require("path");
const { readFileSync } = require("fs");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const router = express.Router();

// const APP_URL = "http://localhost:8800/api";
const APP_URL = "http://154.41.253.184:8800/api";

function paginate(totalItems, currentPage, pageSize, count, url) {
  const totalPages = Math.ceil(totalItems / pageSize);

  // ensure current page isn't out of range
  if (currentPage < 1) {
    currentPage = 1;
  } else if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  // calculate start and end item indexes
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  // return object with all pager properties required by the view
  return {
    total: totalItems,
    currentPage: +currentPage,
    count,
    lastPage: totalPages,
    firstItem: startIndex,
    lastItem: endIndex,
    perPage: pageSize,
    first_page_url: `${APP_URL}${url}&page=1`,
    last_page_url: `${APP_URL}${url}&page=${totalPages}`,
    next_page_url:
      totalPages > currentPage
        ? `${APP_URL}${url}&page=${Number(currentPage) + 1}`
        : null,
    prev_page_url:
      totalPages > currentPage ? `${APP_URL}${url}&page=${currentPage}` : null,
  };
}

async function getProductsSheetWise(sheetTitle) {
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
  const totalRecords = sheet.rowCount;

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
      sub_category,
      product_detailed_description,
      new_arrival,
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
      sub_category,
      product_detailed_description,
      new_arrival,
    })
  );

  return products;
}

async function getProducts(sheetTitle, skip, take) {
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
  const rows = await sheet.getRows({ offset: skip, limit: take }); // can pass in { limit, offset }
  const totalRecords = sheet.rowCount;

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
      sub_category,
      product_detailed_description,
      new_arrival,
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
      sub_category,
      product_detailed_description,
      new_arrival,
    })
  );

  return { products, totalRecords };
}

async function getProductsCategoryWise(sheetTitle, subcategory, page, limit) {
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
      sub_category,
      product_detailed_description,
      new_arrival,
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
      sub_category,
      product_detailed_description,
      new_arrival,
    })
  );

  const productListCategoryWise = products.reduce((acc, item) => {
    let subCategoryExist = JSON.parse(item.sub_category).find(
      (cat) => subcategory == cat
    );

    if (subCategoryExist) {
      acc.push(item);
    }
    return acc;
  }, []);

  console.log(productListCategoryWise);

  return productListCategoryWise;
}

async function getLimitedProducts(sheetTitle) {
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
  const rows = await sheet.getRows({ limit: 10 }); // can pass in { limit, offset }

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
      sub_category,
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
      sub_category,
    })
  );
  return products;
}

async function getProducstSlug() {
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
  const sheet = doc.sheetsByTitle["all_items"]; // or use doc.sheetsById[id]
  const rows = await sheet.getRows(); // can pass in { limit, offset }

  const products = rows?.map(({ slug, item_category }) => ({
    slug,
    category,
  }));
  return products;
}

router.get("/products/all", async (req, res) => {
  try {
    const data = await getProductsSheetWise("all_items");

    return res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ products: null });
  }
});

router.get("/products/bodycare", async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = req.query.limit || 12;

  const url = `/products/bodycare?limit=${perPage}`;

  const skipItems =
    curPage == 1 ? 0 : (parseInt(perPage) - 1) * parseInt(curPage);

  try {
    const result = await getProducts("bodycare", skipItems, parseInt(perPage));
    return res.status(200).json({
      msg: "success",
      data: result.products,
      ...paginate(
        result.totalRecords,
        curPage,
        perPage,
        result.products.length,
        url
      ),
    });
  } catch (e) {
    console.log(e.message);
    return res.status(404).json({ message: e.message });
  }
});

router.get("/products/skincare", async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = req.query.limit || 12;

  const url = `/products/skincare?limit=${perPage}`;

  const skipItems =
    curPage == 1 ? 0 : (parseInt(perPage) - 1) * parseInt(curPage);

  try {
    const result = await getProducts("skincare", skipItems, parseInt(perPage));
    return res.status(200).json({
      msg: "success",
      data: result.products,
      ...paginate(
        result.totalRecords,
        curPage,
        perPage,
        result.products.length,
        url
      ),
    });
  } catch (e) {
    console.log(e.message);
    return res.status(404).json({ message: e.message });
  }
});

router.get("/products/haircare", async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = req.query.limit || 12;

  const url = `/products/haircare?limit=${perPage}`;

  const skipItems =
    curPage == 1 ? 0 : (parseInt(perPage) - 1) * parseInt(curPage);

  try {
    const result = await getProducts("haircare", skipItems, parseInt(perPage));
    return res.status(200).json({
      msg: "success",
      data: result.products,
      ...paginate(
        result.totalRecords,
        curPage,
        perPage,
        result.products.length,
        url
      ),
    });
  } catch (e) {
    console.log(e.message);
    return res.status(404).json({ message: e.message });
  }
});

router.get("/products/makeup", async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = req.query.limit || 12;

  const url = `/products/makeup?limit=${perPage}`;

  const skipItems =
    curPage == 1 ? 0 : (parseInt(perPage) - 1) * parseInt(curPage);

  try {
    const result = await getProducts("makeup", skipItems, parseInt(perPage));
    return res.status(200).json({
      msg: "success",
      data: result.products,
      ...paginate(
        result.totalRecords,
        curPage,
        perPage,
        result.products.length,
        url
      ),
    });
  } catch (e) {
    console.log(e.message);
    return res.status(404).json({ message: e.message });
  }
});

router.get("/products/fragrance", async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = req.query.limit || 12;

  const url = `/products/fragrance?limit=${perPage}`;

  const skipItems =
    curPage == 1 ? 0 : (parseInt(perPage) - 1) * parseInt(curPage);

  try {
    const result = await getProducts("fragrance", skipItems, parseInt(perPage));
    return res.status(200).json({
      msg: "success",
      data: result.products,
      ...paginate(
        result.totalRecords,
        curPage,
        perPage,
        result.products.length,
        url
      ),
    });
  } catch (e) {
    console.log(e.message);
    return res.status(404).json({ message: e.message });
  }
});

router.get("/products/phy", async (req, res) => {
  const curPage = req.query.page || 1;
  const perPage = req.query.limit || 12;

  const url = `/products/phy?limit=${perPage}`;

  const skipItems =
    curPage == 1 ? 0 : (parseInt(perPage) - 1) * parseInt(curPage);

  try {
    const result = await getProducts("phy", skipItems, parseInt(perPage));
    return res.status(200).json({
      msg: "success",
      data: result.products,
      ...paginate(
        result.totalRecords,
        curPage,
        perPage,
        result.products.length,
        url
      ),
    });
  } catch (e) {
    console.log(e.message);
    return res.status(404).json({ message: e.message });
  }
});

router.get("/product/bodycare/:slug", async (req, res) => {
  const product_slug = req.params.slug;
  try {
    const data = await getProductsSheetWise("bodycare");
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
    const data = await getProductsSheetWise("skincare");
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
    const data = await getProductsSheetWise("haircare");
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
    const data = await getProductsSheetWise("makeup");
    const selectedProduct = data.find((item) => item.slug === product_slug);
    res.status(200).json({ product: selectedProduct });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/product/fragrance/:slug", async (req, res) => {
  const product_slug = req.params.slug;
  try {
    const data = await getProductsSheetWise("fragrance");
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
    const data = await getProductsSheetWise("phy");
    const selectedProduct = data.find((item) => item.slug === product_slug);
    res.status(200).json({ product: selectedProduct });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/related-product/:slug", async (req, res) => {
  const product_slug = req.params.slug;

  try {
    const data = await getLimitedProducts(product_slug);

    res.status(200).json({ data: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ data: null });
  }
});

router.get("/getslug-links", async (req, res) => {
  try {
    const data = await getProducstSlug();
    res.status(200).json({ data: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ data: null });
  }
});

router.get("/skincare", async (req, res) => {
  const { category, page, limit } = req.query;
  console.log(category);
  try {
    const data = await getProductsCategoryWise(
      "skincare",
      category,
      page,
      limit
    );

    res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/bodycare", async (req, res) => {
  const { category, page, limit } = req.query;
  console.log(category);
  try {
    const data = await getProductsCategoryWise(
      "bodycare",
      category,
      page,
      limit
    );

    res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/haircare", async (req, res) => {
  const { category, page, limit } = req.query;
  console.log(category);
  try {
    const data = await getProductsCategoryWise(
      "haircare",
      category,
      page,
      limit
    );

    res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/makeup", async (req, res) => {
  const { category, page, limit } = req.query;
  console.log(category);
  try {
    const data = await getProductsCategoryWise("makeup", category, page, limit);

    res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/phy", async (req, res) => {
  const { category, page, limit } = req.query;
  console.log(category);
  try {
    const data = await getProductsCategoryWise("phy", category, page, limit);

    res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/fragrance", async (req, res) => {
  const { category, page, limit } = req.query;
  console.log(category);
  try {
    const data = await getProductsCategoryWise(
      "fragrance",
      category,
      page,
      limit
    );

    res.status(200).json({ products: data });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ product: null });
  }
});

router.get("/search", async (req, res) => {
  const { product } = req.query;
  // console.log(product);
  try {
    const data = await getProductsSheetWise("all_items");

    const searchedData = data.reduce((acc, item) => {
      let productName = item.name;
      let position = productName.search(`${product}`);

      if (position != -1) {
        acc.push(item);
      }
      return acc;
    }, []);

    console.log(searchedData);

    return res.status(200).json({ data: searchedData });
  } catch (e) {
    console.log(e.message);
    return res.status(202).json({ message: e.message });
  }
});

router.get("/test", (req, res) => {
  return res.status(200).json({ message: "Hello World" });
});

module.exports = router;
