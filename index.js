const express = require("express");
const cors = require("cors");
const path = require("path");
const user = require("./routes/user");
const product = require("./routes/product");
const message = require("./routes/message");
const feedback = require("./routes/feedback");
const post = require("./routes/post");

require("dotenv").config();
const {
  initializeRedisClient,
  redisCachingMiddleware,
} = require("./middleware/redis");

async function initializeExpressServer() {
  const app = express();
  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.json());
  app.use(
    express.urlencoded({
      parameterLimit: 100000,
      limit: "50mb",
      extended: true,
    })
  );

  let allowedDomains = [
    "http://localhost:3000",
    "http://localhost:4000",
    "https://geenia.in",
    "https://admin.geenia.in",
    "https://api.geenia.in",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedDomains.indexOf(origin) === -1) {
          var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
    })
  );

  // connect to Redis
  await initializeRedisClient();

  app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
  });

  app.use("/api/user", user);
  app.use("/api/product", product);
  app.use("/api/message", message);
  app.use("/api/feedback", feedback);
  app.use("/api/post", post);

  app.listen(8800, () => {
    console.log(`Server is running on port http://localhost:8800`);
  });
}

initializeExpressServer()
  .then()
  .catch((e) => console.error(e));

// const app = express();
// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.json());
// app.use(
//   express.urlencoded({ parameterLimit: 100000, limit: "50mb", extended: true })
// );

// let allowedDomains = [
//   "http://localhost:3000",
//   "http://localhost:4000",
//   "https://admin.yasha64.ru",
//   "https://app.yasha64.ru",
//   "https://yasha64.ru",
//   "https://www.yasha64.ru",
//   "http://185.46.11.105:4000",
//   "http://185.46.11.105:5000",
//   "http://185.46.11.105:8800",
//   "http://185.46.11.105:3000",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedDomains.indexOf(origin) === -1) {
//         var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//   })
// );

// app.use((req, res, next) => {
//   console.log(req.path, req.method);
//   next();
// });

// app.use("/api/user", user);
// app.use("/api/coin", coin);
// app.use("/api/product", product);
// app.use("/api/message", message);
// app.use("/api/feedback", feedback);
// app.use("/api/item", item);
// app.use("/api/blog", blog);

// var server = app.listen(8800, () => {
//   console.log(`Server is running on port 8800`);
// });

// server.setTimeout(1000 * 60 * 5);
