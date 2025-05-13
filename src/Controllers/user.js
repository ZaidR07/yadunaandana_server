import mongoose from "mongoose";

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


