const express = require("express");
const prisma = require("../lib/prisma");
const emailMailer = require("../helper/email");
const { redisCachingMiddleware } = require("../middleware/redis");
const { messaging } = require("../lib/firebase");
const jwt = require("jsonwebtoken");
const { hash, genSalt } = require("bcrypt");

const { IncomingForm } = require("formidable");
const fs = require("fs");
const path = require("path");
const DatauriParser = require("datauri/parser");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

const parser = new DatauriParser();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = (file) => cloudinary.uploader.upload(file);

const generateToken = (_id, name, email) => {
  const jwtClaims = {
    id: _id,
    name: name,
    email: email,
    iat: Date.now() / 1000,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };
  return jwt.sign(jwtClaims, process.env.SECRET, {
    algorithm: "HS256",
  });
};

router.post("/register", async (req, res) => {
  const { mobile, email, password, name } = req.body;

  try {
    const userExits = await prisma.user.count({
      where: {
        mobile: mobile,
      },
    });

    if (userExits > 0) {
      return res.status(403).json({
        message: "Mobile number is already registered !",
      });
    } else {
      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);

      const result = await prisma.user.create({
        data: {
          email: email,
          name: name,
          password: hashedPassword,
          mobile: mobile,
          image:
            "https://res.cloudinary.com/dlywo5mxn/image/upload/v1689572976/afed80130a2682f1a428984ed8c84308_wscf7t.jpg",
          userType: "Customer",
          userStatus: "Active",
        },
      });

      const token = generateToken(result.id, name, email);
      // console.log(token);

      return res.status(200).json({
        user: {
          id: result.id,
          username: result.name,
          email: result.email,
          mobile: result.mobile,
          image: result.image,
        },
        token,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ message: "Something went wrong !" });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  let user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res
      .status(422)
      .json({ message: "Email address is not registered !" });
  }

  let token = await prisma.verificationToken.findFirst({
    where: {
      user: { email: email },
    },
  });

  if (token) {
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
  }

  let resetToken = jwt.sign({ email: email }, process.env.SECRET, {
    expiresIn: "10m",
  });

  try {
    await prisma.verificationToken.create({
      data: {
        token: resetToken,
        user: { connect: { email: email } },
      },
    });

    const link = `${process.env.WEBSITE_URL}/auth/reset-password?access=${resetToken}`;

    await emailMailer.sendPasswordResetEmail({
      pwdLink: link,
      email: email,
    });
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(error);
    return res.status(503).json({ message: "Something went wrong !" });
  }
});

router.post("/reset-password/reset/:access", async (req, res) => {
  const accessToken = req.params.access;
  const { password } = req.body;
  const { email } = jwt.verify(accessToken, process.env.SECRET);

  const salt = genSaltSync(10);
  const hashedPassword = hashSync(password, salt);

  try {
    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(error);
    return res
      .status(403)
      .json({ message: "Your password reset token is expired ! " });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.get("/reset-password/:access", async (req, res) => {
  const accessToken = req.params.access;

  try {
    await jwtVerifyAsync(accessToken, process.env.SECRET);
    return res.status(200).json({ message: "success" });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Your password reset token is expired ! " });
  }
});

router.post("/profile/update", async (req, res) => {
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  // console.log(data);
  try {
    if (Object.keys(data.files).length > 0) {
      const docContent = await fs.promises
        .readFile(data.files.image.path)
        .catch((err) => console.error("Failed to read file", err));

      let doc64 = parser.format(
        path.extname(data.files.image.name).toString(),
        docContent
      );
      const uploadResult = await cloudinaryUpload(doc64.content);

      await prisma.user.update({
        where: {
          mobile: data.fields.userMobile,
        },
        data: {
          image: uploadResult.secure_url,
          name: data.fields.userName,
        },
      });
      return res.status(200).json({
        image_url: uploadResult.secure_url,
        name: data.fields.userName,
      });
    } else {
      const imageUrl = await prisma.user.findFirst({
        where: {
          mobile: data.fields.userMobile,
        },
        select: {
          image: true,
        },
      });
      // console.log(imageUrl.image);
      await prisma.user.update({
        where: {
          mobile: data.fields.userMobile,
        },
        data: {
          name: data.fields.userName,
        },
      });
      return res
        .status(200)
        .json({ image_url: imageUrl.image, name: data.fields.userName });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Something went wrong" });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.get("/list", redisCachingMiddleware(), async (req, res) => {
  let page = req.query.page || 1;
  let limit = req.query.limit || 50;

  try {
    const result = await prisma.user.findMany({
      skip: page == 1 ? 0 : Number(page) * 50,
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      totalCount: result.length,
      users: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.post("/message", async (req, res) => {
  const { title, mobile, description } = req.body;

  try {
    const userExits = await prisma.user.findUnique({
      where: {
        mobile: mobile,
      },
    });

    if (userExits != null) {
      const message = {
        notification: {
          title: `${title}`,
          body: `${description}`,
        },
        token: userExits.fcmToken,
      };

      const response = await messaging.send(message);
      console.log(response);
      return res.status(200).json({
        message: "success",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.get("/admin", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        userType: "Administrator",
      },
      select: {
        email: true,
      },
    });
    return res.status(200).json({
      msg: "success",
      data: users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

module.exports = router;
