require("dotenv").config();

const sendEmail = require("./utils/sendEmail");

sendEmail({
  to: "YOUR_PERSONAL_EMAIL@gmail.com",
  subject: "AssetWise Email Test",
  html: `
    <h2>Welcome to AssetWise</h2>
    <p>Your email configuration is working successfully!</p>
  `
})
.then(() => {
  console.log("Email sent successfully!");
})
.catch((error) => {
  console.error("Email error:", error);
});