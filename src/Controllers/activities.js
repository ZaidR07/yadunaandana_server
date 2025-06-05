import mongoose from "mongoose";
import s3Client from "../utils/s3Client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const addActivities = async (req, res) => {
  try {
    const data = req.body;

    const photos = req.files?.photos || [];
    const displayphoto = req.files?.displayphoto?.[0] || null;



    const db = mongoose.connection.db;

    const parseJSONField = (field) => {
      try {
        return typeof field === "string" ? JSON.parse(field) : field || [];
      } catch (error) {
        return [];
      }
    };

    data.highlights = parseJSONField(data.highlights);

    let activityId = parseInt(data.activity_id);

    // If activity_id not present, assign new one
    if (!activityId) {
      const lastActivity = await db
        .collection("activities")
        .findOne({}, { sort: { activity_id: -1 } });

      activityId = lastActivity
        ? lastActivity.activity_id + 1
        : 100001;
    }

    const photoUrls = [];
    if (photos.length > 0) {
      await Promise.all(
        photos.map(async (file) => {
          const fileKey = `activities/${activityId}/${Date.now()}_${file.originalname}`;
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

   
    let displayPhotoUrl = "";
    if (displayphoto) {
      const fileKey = `activities/${activityId}/cover_${Date.now()}_${displayphoto.originalname}`;
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: displayphoto.buffer,
        ContentType: displayphoto.mimetype,
      };
      try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        displayPhotoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
      } catch (uploadError) {
        console.error("AWS S3 Upload Error (displayphoto):", uploadError);
      }
    }

    // ✅ Prepare the fields to update or insert
    const activityData = {
      ...data,
      activity_id: activityId,
      active: true,
    };

    if (photoUrls.length > 0) activityData.photos = photoUrls;
    if (displayPhotoUrl) activityData.displayphoto = displayPhotoUrl;

    // ✅ Check if it's an update or insert
    const existing = await db
      .collection("activities")
      .findOne({ activity_id: activityId });

    if (existing) {
      // Update only the fields provided
      await db.collection("activities").updateOne(
        { activity_id: activityId },
        { $set: activityData }
      );
      return res.status(200).json({ message: "Activity Updated Successfully" });
    } else {
      const insertStatus = await db
        .collection("activities")
        .insertOne(activityData);

      if (!insertStatus.acknowledged) {
        return res.status(500).json({ message: "Failed to Add Activity" });
      }

      return res.status(200).json({
        message: "Activity Added Successfully",
      });
    }
  } catch (error) {
    console.error("Error in addActivities:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getActivities = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const activities = await db.collection("activities").find({}).toArray();

    if (activities.length < 0) {
      return res.status(404).json({
        message: "No Activities Found",
      });
    }

    return res.status(200).json({
      payload: activities,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
