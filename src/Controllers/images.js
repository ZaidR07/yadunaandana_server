import { PutObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import s3Client from "../utils/s3Client.js";

export const addcarouselimages = async (req, res) => {
  const files = req.files;

  if (!files?.length) {
    return res.status(400).json({ message: "No files provided" });
  }

  try {
    // Upload images to S3 in parallel
    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const fileKey = `carousel/${Date.now()}_${file.originalname}`;
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
      })
    );

    // Prepare documents for MongoDB
    const documents = imageUrls.map((url) => ({
      imageUrl: url,
      createdAt: new Date(),
      imageid: `${Math.floor(100000 + Math.random() * 900000)}${Date.now()}`,
    }));

    // Insert documents into MongoDB
    const result = await mongoose.connection.db
      .collection("carousel")
      .insertMany(documents);

    return res.status(201).json({
      message: "Images uploaded successfully",
      images: result.insertedIds,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    return res.status(500).json({ message: "Failed to upload images" });
  }
};


export const getcarouselimages = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const images = await db.collection("carousel").find({}).toArray();


    if (images.length < 0) {
      return res.status(404).json({
        message: "No Carousel Images Found",
      });
    }

    return res.status(200).json({
      payload: images,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getgalleryimages = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const images = await db.collection("gallery").find({}).toArray();

    if (images.length < 0) {
      return res.status(404).json({
        message: "No Gallery Images Found",
      });
    }

    return res.status(200).json({
      payload: images,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


