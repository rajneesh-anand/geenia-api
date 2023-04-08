const sendGridMail = require("@sendgrid/mail");
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

function getRegistrationEmailHtml(user) {
  return `
  <html>
    <head>
      <title>welcome</title>
    </head>
    <body>
    <div style="margin-top:32px; text-align: center">
     <img src="https://res.cloudinary.com/dlywo5mxn/image/upload/v1672851891/logo_swhdyi.png" alt="logo" width="100" height="40" />
     </div>
     <div style="font-family: sans-serif;  margin-top:32px; text-align: center"><span style="font-size: 24px"><strong>Welcome ${user.firstName}  &nbsp;</strong></span></div>
<div style="font-family: sans-serif; text-align: inherit"><br></div>
<div style="font-family: sans-serif; text-align: center">We are glad to see you at Geenia E-Commerce</div>
<div style="border-radius:6px; font-family: sans-serif; margin-top:32px;font-size:16px; text-align:center; background-color:inherit;">
                  <a href="https://www.geenia.in" style="background-color:#4fbaba; border:1px solid #ffffff; border-color:#ffffff; border-radius:6px; border-width:1px; color:#ffffff; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 18px 12px 18px; text-align:center; text-decoration:none; border-style:solid;" target="_blank">Welcome To Geenia</a>
                </div>
    </body>
  </html>
`;
}

function setResetPasswordTemplate(params) {
  return `
  <html>
    <head>
      <title>welcome</title>
    </head>
    <body>
    <div style="margin-top:32px; text-align: center">
    <img src="https://res.cloudinary.com/dlywo5mxn/image/upload/v1672851891/logo_swhdyi.png" alt="logo" width="100" height="40" />
     </div>
   
    <div style="font-family: sans-serif; text-align: inherit"><br></div>
    <div style="font-family: sans-serif; text-align: center">${params.pwdLink}</div>
    <div style="border-radius:6px; font-family: sans-serif; margin-top:32px;font-size:16px; text-align:center; background-color:inherit;">
        <a href=${params.pwdLink} style="background-color:#4fbaba; border:1px solid #ffffff; border-color:#ffffff; border-radius:6px; border-width:1px; color:#ffffff; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 18px 12px 18px; text-align:center; text-decoration:none; border-style:solid;" target="_blank">Reset Password</a>
    </div>
    </body>
  </html>
`;
}

function registrationUserEmail(user) {
  return {
    to: user.email,
    from: "anand.k.rajneesh@hotmail.com",
    subject: "Welcome to Geenia Ecommerce ",
    text: `Welcome ${user.firstName} , We are glad to see you at Geenia E-Commerce`,
    html: getRegistrationEmailHtml(user),
  };
}

function resetPasswordMessage(emailParams) {
  return {
    to: emailParams.email,
    from: "anand.k.rajneesh@hotmail.com",
    subject: "Satyal Digital Learning Reset Password Link",
    text: "Click here to reset your password",
    html: setResetPasswordTemplate(emailParams),
  };
}

async function sendRegistrationEmail(params) {
  try {
    await sendGridMail.send(registrationUserEmail(params));
    return {
      message: "success",
    };
  } catch (error) {
    console.error(error.response.body);
    return error.response.body;
  }
}

async function sendPasswordResetEmail(emailParams) {
  try {
    await sendGridMail.send(resetPasswordMessage(emailParams));
    return {
      message: "success",
    };
  } catch (error) {
    console.error(error.response.body);

    return error.response.body;
  }
}

module.exports = {
  sendRegistrationEmail,
  sendPasswordResetEmail,
};
