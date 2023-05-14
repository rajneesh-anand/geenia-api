const express = require("express");
const prisma = require("../lib/prisma");
const router = express.Router();

const APP_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.vedusone.com/api"
    : "http://localhost:8080/api";

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

router.get("/", async (req, res) => {
  const { orderBy, sortedBy } = req.query;

  const curPage = req.query.page || 1;
  const perPage = req.query.limit || 25;

  const url = `/order?limit=${perPage}`;

  const skipItems =
    curPage == 1 ? 0 : (parseInt(perPage) - 1) * parseInt(curPage);

  const totalItems = await prisma.order.count();

  try {
    const orders = await prisma.order.findMany({
      skip: skipItems,
      take: parseInt(perPage),
      orderBy: {
        orderDate: sortedBy,
      },
    });
    // console.log(product.length);
    res.status(200).json({
      msg: "success",
      data: orders,
      ...paginate(totalItems, curPage, perPage, orders.length, url),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
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
