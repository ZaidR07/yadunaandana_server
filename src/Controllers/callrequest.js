import mongoose from "mongoose";
import { Resend } from "resend";

const resend = new Resend("re_ccuAZtfq_qWsMFDrWjLSwX1vt6qm5GFCp");

export const RequestCallback = async (req, res) => {
  try {
    const {useremail} = req.body;

    if(!useremail){
        return res.status(400).json({
            message : "Required Fields are Missing"
        })
    }

    const db = mongoose.connection.db;

    const user = await db.collection("users").findOne({email : useremail});

    
    
    const email = "tiwarimohan522@gmail.com";
    // const email = "zaidrahman342@gmail.com";

    const {  error } = await resend.emails.send({
      from: "Yadunandana <no-reply@t-rexinfotech.in>",
      to: [email],
      subject: "Request for CallBack from Yadunandana Website",
      html: `<p>Call Back Request made by - ${user.name}</p><br/><p>Email - ${user.email} , mobile - ${user.mobile}</p>`,
    });

    if (error) {
      return res.status(500).json({ message: "Failed to send OTP", error });
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
