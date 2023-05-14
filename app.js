const cluster = require("cluster");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const totalCPUs = require("os").cpus().length;

const user = require("./routes/user");
const auth = require("./routes/auth");
const test = require("./routes/test");
const order = require("./routes/order");
const file = require("./routes/file");
const payment = require("./routes/payment");

require("dotenv").config();


// app.use(
//   cors({
//     origin: "*",
//   })
// );


if (cluster.isMaster) {
  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  const app = express();
  const port = process.env.PORT || 8080;
  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());


let allowedDomains = [
  "https://geenia.vercel.app",
  "https://geenia.in",
  "http://localhost:3000",
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

  app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
  });
  app.use("/api/auth", auth);
  app.use("/api/user", user);
  app.use("/api/test", test);
  app.use("/api/order", order);
  app.use("/api/payment", payment);
  app.use("/api", file);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
