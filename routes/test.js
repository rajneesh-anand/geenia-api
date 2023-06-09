const express = require("express");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { IncomingForm } = require("formidable");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const DatauriParser = require("datauri/parser");
const cloudinary = require("cloudinary").v2;
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendEmailVerification,
  sendPasswordResetEmail,
} = require("firebase/auth");

const app = require("../lib/firebase");

const router = express.Router();
const auth = getAuth(app);
// const parser = new DatauriParser();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const cloudinaryUpload = (file) => cloudinary.uploader.upload(file);

function setUpRecaptha(mobile) {
  const recaptchaVerifier = new RecaptchaVerifier(
    "recaptcha-container",
    { size: "invisible" },
    auth
  );
  // recaptchaVerifier.render();
  return signInWithPhoneNumber(auth, mobile, recaptchaVerifier);
}

router.post("/generate-otp", (req, res) => {
  const { mobile } = req.body;
  const result = setUpRecaptha(mobile);
  console.log(result);
});

// router.post("/kyc/:id", async (req, res) => {
//   const teacherId = req.params.id;

//   const data = await new Promise((resolve, reject) => {
//     const form = new IncomingForm();
//     form.parse(req, (err, fields, files) => {
//       if (err) return reject(err);
//       resolve({ fields, files });
//     });
//   });

//   try {
//     if (Object.keys(data.files).length !== 0) {
//       const docContent = await fs.promises
//         .readFile(data.files.document.path)
//         .catch((err) => console.error("Failed to read file", err));

//       let doc64 = parser.format(
//         path.extname(data.files.document.name).toString(),
//         docContent
//       );
//       const uploadResult = await cloudinaryUpload(doc64.content);

//       await prisma.user.update({
//         where: { id: Number(teacherId) },
//         data: {
//           kycDocumentType: data.fields.docType,
//           kycStatus: "KYC Under Review",
//           kycDocument: uploadResult.secure_url,
//         },
//       });
//       return res.status(200).json({
//         msg: "success",
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send(error);
//   } finally {
//     async () => {
//       await prisma.$disconnect();
//     };
//   }
// });

router.get("/hello", (req, res) => {
  const data = process.env.SECRET;
  return res.status(200).json({ message: "Hello World", data: data });
});

module.exports = router;
