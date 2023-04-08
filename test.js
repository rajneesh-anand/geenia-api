const axios = require("axios");

async function sendSMS(number, text) {
  let encodedTextMessage = Buffer.from(text, "utf-8").toString();
  // console.log(encodedTextMessage);
  const { data } = await axios.get(
    `http://api.prostor-sms.ru/messages/v2/send/?phone=+7${number}&text=${encodedTextMessage}`,
    {
      auth: {
        username: "t79873321826",
        password: "176839",
      },
    }
  );
  return data;
}

sendSMS(9855472776, "я люблю тебя мой кролик")
  .then((res) => {
    // console.log(res);
  })
  .catch((err) => console.log(err));
// "postinstall": "npx prisma generate && npx prisma db push "
