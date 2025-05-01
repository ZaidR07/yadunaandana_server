import mongoose from "mongoose";
import s3Client from "../utils/s3Client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const addDestination = async (req, res) => {
  try {
    const data = req.body;

    const photos = req.files?.photos || []; // Fallback to empty array if undefined
    const blogs = req.files?.blogs || [];

    const db = mongoose.connection.db;

    // ✅ Parse amenities & highlights if received as strings
    const parseJSONField = (field) => {
      try {
        return typeof field === "string" ? JSON.parse(field) : field || [];
      } catch (error) {
        return [];
      }
    };

    data.highlights = parseJSONField(data.highlights);
    data.included = parseJSONField(data.included);
    data.excluded = parseJSONField(data.excluded);
    data.itinerary = parseJSONField(data.itinerary);

    // ✅ Get the last property ID and increment it
    const lastDestination = await db
      .collection("destinations")
      .findOne({}, { sort: { destination_id: -1 } });

    const destinationId = lastDestination
      ? lastDestination.destination_id + 1
      : 100001;

    // ✅ Upload images to AWS S3
    const photoUrls = [];
    if (photos && photos.length > 0) {
      await Promise.all(
        photos.map(async (file) => {
          const fileKey = `destination/${destinationId}/${Date.now()}_${
            file.originalname
          }`;
          const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          try {
            await s3Client.send(new PutObjectCommand(uploadParams));
            const photourl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
            photoUrls.push(photourl);
          } catch (uploadError) {
            console.error("AWS S3 Upload Error:", uploadError);
          }
        })
      );
    }

    // ✅ Upload images to AWS S3
    const blogUrls = [];
    if (blogs && blogs.length > 0) {
      await Promise.all(
        blogs.map(async (file) => {
          const fileKey = `destination/${Date.now()}_${file.originalname}`;
          const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          try {
            await s3Client.send(new PutObjectCommand(uploadParams));
            const blogurl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
            blogUrls.push(blogurl);
          } catch (uploadError) {
            console.error("AWS S3 Upload Error:", uploadError);
          }
        })
      );
    }

    // ✅ Save property in DB
    const newDestination = {
      ...data,
      destination_id: destinationId,
      active: true,
      photos: photoUrls, // Store S3 image URLs
      blogs: blogUrls,
    };

    const insertStatus = await db
      .collection("destinations")
      .insertOne(newDestination);

    if (!insertStatus.acknowledged) {
      return res.status(500).json({ message: "Failed to Add Property" });
    }

    return res.status(200).json({
      message: "Destination Added Successfully",
    });
  } catch (error) {
    console.error("Error in addDestination:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
