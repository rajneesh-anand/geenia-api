const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { readFileSync } = require("fs");
const prisma = require("../lib/prisma");
const path = require("path");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { default: axios } = require("axios");
const dayjs = require("dayjs");

// function sortArrayOfObjects(items) {
//   const result = items.reduce((acc, item) => {
//     let itm = {
//       name: item.name,
//       sku: "sku-1",
//       units: item.quantity,
//       selling_price: item.itemTotal,
//       discount: "",
//       tax: "",
//       hsn: 441122,
//     };
//     acc.push(itm);
//     return acc;
//   }, []);

//   return result;
// }

// async function CreateShipRocketOrder(orderNumber) {
//   const result = await prisma.order.findUnique({
//     where: {
//       orderNumber: orderNumber,
//     },
//   });
//   const { data } = await axios.post(
//     "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
//     {
//       order_id: result.orderNumber,
//       order_date: dayjs(result.orderDate).format("YYYY-MM-DD"),
//       pickup_location: "Delhi",
//       billing_customer_name: result.name,
//       billing_address: result.address,
//       billing_city: result.city,
//       billing_pincode: result.pincode,
//       billing_state: result.state,
//       billing_country: "India",
//       billing_email: result.email,
//       billing_phone: result.mobile,
//       shipping_is_billing: true,
//       order_items: sortArrayOfObjects(JSON.parse(result.orderItem)),
//       payment_method: "Prepaid",
//       shipping_charges: Number(result.shipping),
//       length: 10,
//       breadth: 15,
//       height: 20,
//       weight: 2.5,
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.SHIPROCKET_TOKEN}`,
//       },
//     }
//   );
//   // console.log(data);
// }

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
  const sheet = doc.sheetsByTitle[sheetTitle];
  const rows = await sheet.getRows();

  const products = rows?.map(({ id, name, slug, price, sale_price }) => ({
    id,
    name,
    slug,
    price,
    sale_price,
  }));
  return products;
}

router.post("/razorpay/create", async (req, res) => {
  const {
    item,
    mobile,
    email,
    name,
    address,
    pincode,
    discount,
    description,
    city,
    state,
  } = req.body;

  // console.log(req.body);

  // console.log(item);
  try {
    const products = await getProducts("all_items");
    // console.log(products);

    const total = item.reduce((acc, itm) => {
      const selectedProduct = products.find((product) => {
        return product.slug === itm.slug;
      });

      const amtSum = Math.round(
        Number(selectedProduct.sale_price) * Number(itm.quantity)
      ).toFixed(2);

      return Number(acc) + Number(amtSum);
    }, 0);

    const shipping = Number(total) > 500 ? 0 : 99;
    const netAmount = Math.round(Number(total) + shipping).toFixed(2);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    let orderDate = new Date();

    let order_number = `GNID${Math.floor(
      Math.random(4) * 100000
    )}-${orderDate.getFullYear()}${
      orderDate.getMonth() + 1
    }${orderDate.getDate()}`;

    const payment_capture = 1;
    const currency = "INR";
    const options = {
      amount: (netAmount * 100).toString(),
      currency,
      receipt: order_number,
      payment_capture,
    };

    await prisma.order.create({
      data: {
        orderNumber: order_number,
        email: email,
        name: name,
        address: address,
        city: city,
        state: state,
        mobile: mobile,
        pincode: pincode,
        description: description,
        amount: JSON.stringify(total),
        discount: discount == 0 ? "0" : discount,
        shipping: shipping > 0 ? JSON.stringify(shipping) : "0",
        totalAmount: netAmount,
        orderItem: JSON.stringify(item),
        orderStatus: "Pending",
      },
    });
    const response = await razorpay.orders.create(options);
    res.status(200).json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
      orderNumber: order_number,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.post("/razorpay/verify", async (req, res) => {
  const { orderId, paymentId, signature, orderNumber } = req.body;

  let body = orderId + "|" + paymentId;

  let expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  try {
    if (expectedSignature === signature) {
      // await CreateShipRocketOrder(orderNumber);
      await prisma.order.update({
        where: {
          orderNumber: orderNumber,
        },
        data: {
          orderStatus: "Created",
          paymentId: req.body.paymentId,
          paymentStatus: "success",
        },
      });

      res.status(200).json({
        message: "success",
      });
    } else {
      throw new Error("failed");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

module.exports = router;
