import mongoose from "mongoose";

export const sendcontactmessage = async (req, res) => {
  try {
    const data = req.body.payload;

    const db = mongoose.connection.db;

    await db.collection("queries").insertOne(data);

    return res.status(200).json({
        message : "Message Sent Successfully"
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
