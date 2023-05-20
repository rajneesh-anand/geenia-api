const express = require("express");
const { hashSync, genSaltSync } = require("bcrypt");
const { IncomingForm } = require("formidable");
const prisma = require("../lib/prisma");
const { userSignupValidator } = require("../helper/user-validator");
const jwt = require("jsonwebtoken");
const util = require("util");
const jwtVerifyAsync = util.promisify(jwt.verify);
const emailMailer = require("../helper/email");
const { default: axios } = require("axios");
const router = express.Router();

router.post("/register", async (req, res) => {
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
  console.log(data);
  let emailExist = await prisma.user.count({
    where: {
      email: data.fields.email,
    },
  });

  if (emailExist > 0) {
    return res.status(403).json({
      message: "Email address is already registered !",
    });
  }

  const salt = genSaltSync(10);
  const hashedPassword = hashSync(data.fields.password, salt);

  try {
    await prisma.user.create({
      data: {
        email: data.fields.email,
        name: data.fields.name,
        password: hashedPassword,
        mobile: data.fields.name,
        userType: data.fields.userType,
        userStatus: "Active",
      },
    });
    // return res.status(200).json(
    //   await emailMailer.sendRegistrationEmail({
    //     email: data.fields.email,
    //     firstName: data.fields.fname,
    //   })
    // );
    return res.status(200).json({
      msg: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(503).send(error);
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
      .json({ message: "You are not regsitered with this email address !" });
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

  let resetToken = jwt.sign({ email: email }, process.env.PWD_TOKEN_SECRET, {
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
  const { email } = jwt.verify(accessToken, process.env.PWD_TOKEN_SECRET);

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
    await jwtVerifyAsync(accessToken, process.env.PWD_TOKEN_SECRET);
    return res.status(200).json({ message: "success" });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Your password reset token is expired ! " });
  }
});

// router.get("/create/shiprocket-token", async (req, res) => {
//   const { data } = await axios.post(
//     "https://apiv2.shiprocket.in/v1/external/auth/login",
//     {
//       email: process.env.SHIPROCKET_EMAIL,
//       password: process.env.SHIPROCKET_PASSWORD,
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   try {
//     await prisma.shiprocketToken.deleteMany();
//     await prisma.shiprocketToken.create({
//       data: {
//         token: data.token,
//       },
//     });
//     return res.status(200).json({ message: "token generated !" });
//   } catch (error) {
//     console.log(error);
//     return res.status(403).json({ message: "Token generation failed " });
//   } finally {
//     async () => {
//       await prisma.$disconnect();
//     };
//   }
// });

// router.get("/find/shiprocket-token", async (req, res) => {
//   try {
//     const result = await prisma.shiprocketToken.findFirst({
//       select: {
//         token: true,
//       },
//     });

//     return res.status(200).json({ token: result.token });
//   } catch (error) {
//     console.log(error);
//     return res.status(403).json({ message: "Token not available ! " });
//   } finally {
//     async () => {
//       await prisma.$disconnect();
//     };
//   }
// });

module.exports = router;
