const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const user = require("./routes/user");
const auth = require("./routes/auth");
const order = require("./routes/order");
const file = require("./routes/file");
const payment = require("./routes/payment");

require("dotenv").config();

const app = express();
// const port = process.env.PORT || 8080;
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let allowedDomains = [
  "http://localhost:3000",
  "http://154.41.253.184:8800",
  "http://154.41.253.184:3000",
  "https://geenia.in",
  "https://www.geenia.in",
  "https://admin.geenia.in",
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
app.use("/api/order", order);
app.use("/api/payment", payment);
app.use("/api", file);

app.listen(8800, () => {
  console.log(`Server is running on port 8800`);
});
