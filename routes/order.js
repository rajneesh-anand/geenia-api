const express = require("express");
const prisma = require("../lib/prisma");
const router = express.Router();
const { redisCachingMiddleware } = require("../middleware/redis");

router.get("/list", redisCachingMiddleware(), async (req, res) => {
  let page = req.query.page || 1;
  let limit = req.query.limit || 25;

  try {
    const totalItems = await prisma.order.count();
    const items = await prisma.order.findMany({
      skip: page == 1 ? 0 : Number(page) * 50,
      take: Number(limit),
      orderBy: {
        orderDate: "desc",
      },
    });

    return res.status(200).json({
      data: items,
      totalRecords: totalItems,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.get("/detail/:id", async (req, res) => {
  const order_number = req.params.id;

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: order_number },
    });

    return res.status(200).json({
      data: order,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ message: error.message });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.post("/neworder", async (req, res) => {
  const { user, item, amount, status, address } = req.body;
  try {
    await prisma.order.create({
      data: {
        orderNumber: status.ORDERID,
        email: user.email ? user.email : "",
        name: user.name ? user.name : "",
        address: address.address,
        city: address.city,
        state: address.state,
        pin: address.pin,
        mobile: user.mobile ? user.mobile : "",
        amount: JSON.stringify(amount),
        orderItem: JSON.stringify(item),
        paymentId: status.TXNID,
        paymentStatus: status.STATUS,
        paymentStatusDetail: JSON.stringify(status),
      },
    });
    return res.status(200).json({
      msg: "success",
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

router.post("/customer/:id", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await prisma.order.findMany({
      where: {
        email: email,
      },
    });
    return res.status(200).json({
      msg: "success",
      orders: result,
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

router.post("/status", async (req, res) => {
  const { orderNumber, status } = req.body;
  try {
    await prisma.order.update({
      where: {
        orderNumber: orderNumber,
      },
      data: {
        orderStatus: status,
      },
    });
    return res.status(200).json({
      msg: "success",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

module.exports = router;
