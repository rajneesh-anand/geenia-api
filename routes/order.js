const express = require("express");
const prisma = require("../lib/prisma");
const router = express.Router();

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

router.post("/order-list", async (req, res) => {
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

module.exports = router;
