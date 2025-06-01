import mongoose from "mongoose";
import { Resend } from "resend";


const checkExisting = async (email, mobile) => {
  try {
    const db = mongoose.connection.db;

    const user = await db.collection("users").findOne({
      $or: [{ email: email }, { mobile: mobile }],
    });

    if (user) {
      return true;
    }

    return false

  } catch (error) {
    throw new Error(error.message);
  }
};

export const RegisterUser = async (req, res) => {
  try {
    const { name, mobile, email } = req.body.payload;

    const data = req.body.payload;

    if (!name || !mobile || !email) {
      return res.status(400).json({
        message: "Required Fields are Missing",
      });
    }

    const existing = await checkExisting(email, mobile);


    if (existing) {
      return res.status(400).json({
        message: "User already exists with this email or mobile",
      });
    }

    const db = mongoose.connection.db;

    data.createdAt = new Date();

    await db.collection("users").insertOne(data);

  
    return res.status(200).json({
      message: "User Registered Successfully",
    });


  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


const resend = new Resend("re_ccuAZtfq_qWsMFDrWjLSwX1vt6qm5GFCp");

export const sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "No email provided" });
    }

    const db = mongoose.connection.db;

    const existingUser = await db.collection("users").findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "Incorrect Email" });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in user doc with timestamp (optional: add expiry logic)
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          otp,
          otpGeneratedAt: new Date(),
        },
      }
    );

    const { data, error } = await resend.emails.send({
      from: "Yadunandana <no-reply@t-rexinfotech.in>",
      to: [email],
      subject: "Your OTP Code",
      html: `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 2 minutes.</p>`,
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

export const verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });


    }


    const db = mongoose.connection.db;

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || !user.otpGeneratedAt) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    // Check if OTP has expired (10 minutes expiry)
    const otpAge = (Date.now() - new Date(user.otpGeneratedAt).getTime()) / 1000; // in seconds
    if (otpAge > 600) {
      return res.status(410).json({ message: "OTP expired. Please request a new one." });
    }

    // Match OTP
    if (user.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // ✅ Success: Clear OTP and mark as verified
    await db.collection("users").updateOne(
      { email },
      {
        $unset: { otp: "", otpGeneratedAt: "" },
        $set: { isVerified: true }, // optional
      }
    );

    return res.status(200).json({ message: "OTP verified successfully" , name : user.name });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ message: "Internal server error"  });
  }
};

export const getUsers = async (req , res) => {
    try {
      const db = mongoose.connection.db;

      const users = await db.collection("users").find({}).sort({ _id: -1 }).toArray();


      if(users.length < 0){
        return res.status(404).json({
          message : "No users Found"
        })
      }

      return res.status(200).json({
        payload : users
      })

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message : "Internal Server Error"
      })
      
    }
}



