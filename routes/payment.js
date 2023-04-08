const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { readFileSync } = require("fs");
const prisma = require("../lib/prisma");
const path = require("path");

router.post("/razorpay/create", async (req, res) => {
  const {
    item,
    shipping,
    mobile,
    email,
    name,
    address,
    pincode,
    discount,
    description,
  } = req.body;

  const data = readFileSync(
    path.join(__dirname, "../upload/products.json"),
    "utf-8"
  );
  const products = JSON.parse(data);

  const total = item.reduce((acc, itm) => {
    const selectedProduct = products.find((product) => product.id === itm.id);

    const amtSum = Math.round(
      parseFloat(selectedProduct.sale_price) * parseInt(itm.quantity)
    ).toFixed(2);

    return acc + amtSum;
  }, 0);

  const netAmount = Math.round(
    parseFloat(total) + parseFloat(shipping)
  ).toFixed(2);

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

  try {
    await prisma.order.create({
      data: {
        orderNumber: order_number,
        email: email,
        name: name,
        address: address,
        mobile: mobile,
        pincode: pincode,
        description: description,
        amount: total,
        discount: discount == 0 ? "0" : discount,
        shipping: shipping == 0 ? "free" : shipping,
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
    res.status(500).send(error);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.post("/razorpay/verify", async (req, res) => {
  let body = req.body.orderId + "|" + req.body.paymentId;

  let expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  try {
    if (expectedSignature === req.body.signature) {
      await prisma.order.update({
        where: {
          orderNumber: req.body.orderNumber,
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
