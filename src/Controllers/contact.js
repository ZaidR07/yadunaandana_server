import mongoose from "mongoose";
import { Resend } from "resend";

const resend = new Resend("re_BXs5E4r1_LtcKCnc8UvNSB2zRvnsUwWrh");

// re_BXs5E4r1_LtcKCnc8UvNSB2zRvnsUwWrh

const sendenquiryemail = async (data) => {
  try {
    const { name, subject, message } = data;
    const email = "zaidrahman342@gmail.com";

    if (!name || !subject || !message) {
      throw new Error("Required fields are missing");
    }

    const response = await resend.emails.send({
      from: "Yadunandana Adventures <no-reply@yadunandanaadventures.com>",
      to: [email],
      subject: subject,
      html: `<p>${message}</p>`,
    });

    if (response.error) {
      throw new Error(response.error);
    }

  } catch (error) {
    console.error("Email send error:", error);
    throw new Error(error.message || "Failed to send email");
  }
};


export const sendcontactmessage = async (req, res) => {
  try {
    const data = req.body.payload;

    const db = mongoose.connection.db;

    await sendenquiryemail(data);

    await db.collection("queries").insertOne(data);

    return res.status(200).json({
      message: "Message Sent Successfully",
    });
  } catch (error) {
    console.error("Contact message error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
