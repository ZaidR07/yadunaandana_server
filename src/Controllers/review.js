import mongoose from "mongoose";

export const SubmitReview = async (req, res) => {
  try {
    const data = req.body;

    const db = mongoose.connection.db;

    data.createdAt = new Date();

    await db.collection("reviews").insertOne(data);

    return res.status(200).json({
      message: "Required Fields are missing",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getReviews = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const reviews = await db
      .collection("reviews")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (reviews.length < 0) {
      return res.status(404).json({
        message: "No reviews Found",
      });
    }

    return res.status(200).json({
      message: "Reviews Fetched Successfully",
      payload: reviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "internal Server Error",
    });
  }
};

export const getDestinationReviews = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      console.error("Required Fields are Missing");
      return res.status(400).json({
        message: "Required Fields are Missing",
      });
    }

    const db = mongoose.connection.db;

    // Convert cursor to array using toArray()
    const reviews = await db.collection("reviews").find({
      destination_id: parseInt(id),
    }).toArray();

    // Check if no reviews found (length === 0, not < 0)
    if (reviews.length === 0) {
      console.error("No reviews Found");
      return res.status(404).json({
        message: "No reviews Found",
      });
    }

    return res.status(200).json({
      message: "Reviews Fetched",
      payload: reviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
