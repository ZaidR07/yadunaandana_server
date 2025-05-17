import mongoose from "mongoose";
import s3Client from "../utils/s3Client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const addDestination = async (req, res) => {
  try {
    const data = req.body;

    const photos = req.files?.photos || [];
    const blogs = req.files?.blogs || [];
    const accomodations = req.files?.accomodations || [];
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
    data.included = parseJSONField(data.included);
    data.excluded = parseJSONField(data.excluded);
    data.itinerary = parseJSONField(data.itinerary);

    let destinationId = parseInt(data.destination_id);

    // If destination_id not present, assign new one
    if (!destinationId) {
      const lastDestination = await db
        .collection("destinations")
        .findOne({}, { sort: { destination_id: -1 } });

      destinationId = lastDestination
        ? lastDestination.destination_id + 1
        : 100001;
    }

    const photoUrls = [];
    if (photos.length > 0) {
      await Promise.all(
        photos.map(async (file) => {
          const fileKey = `destination/${destinationId}/${Date.now()}_${file.originalname}`;
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

    const blogUrls = [];
    if (blogs.length > 0) {
      await Promise.all(
        blogs.map(async (file) => {
          const fileKey = `destination/${destinationId}/blogs/${Date.now()}_${file.originalname}`;
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

    const accomodationUrls = [];
    if (accomodations.length > 0) {
      await Promise.all(
        accomodations.map(async (file) => {
          const fileKey = `destination/${destinationId}/accomodations/${Date.now()}_${file.originalname}`;
          const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
          try {
            await s3Client.send(new PutObjectCommand(uploadParams));
            const accomodationurl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
            accomodationUrls.push(accomodationurl);
          } catch (uploadError) {
            console.error("AWS S3 Upload Error:", uploadError);
          }
        })
      );
    }

    let displayPhotoUrl = "";
    if (displayphoto) {
      const fileKey = `destination/${destinationId}/cover_${Date.now()}_${displayphoto.originalname}`;
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
    const destinationData = {
      ...data,
      destination_id: destinationId,
      active: true,
    };

    if (photoUrls.length > 0) destinationData.photos = photoUrls;
    if (blogUrls.length > 0) destinationData.blogs = blogUrls;
    if (accomodationUrls.length > 0) destinationData.accomodations = accomodationUrls;
    if (displayPhotoUrl) destinationData.displayphoto = displayPhotoUrl;

    // ✅ Check if it's an update or insert
    const existing = await db
      .collection("destinations")
      .findOne({ destination_id: destinationId });

    if (existing) {
      // Update only the fields provided
      await db.collection("destinations").updateOne(
        { destination_id: destinationId },
        { $set: destinationData }
      );
      return res.status(200).json({ message: "Destination Updated Successfully" });
    } else {
      const insertStatus = await db
        .collection("destinations")
        .insertOne(destinationData);

      if (!insertStatus.acknowledged) {
        return res.status(500).json({ message: "Failed to Add Destination" });
      }

      return res.status(200).json({
        message: "Destination Added Successfully",
      });
    }
  } catch (error) {
    console.error("Error in addDestination:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getDestinations = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const destinations = await db.collection("destinations").find({}).toArray();

    if (destinations.length < 0) {
      return res.status(404).json({
        message: "No Destinations Found",
      });
    }

    return res.status(200).json({
      payload: destinations,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getDestinationsName = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const destinations = await db.collection("destinations").find({}).toArray();

    if (destinations.length < 0) {
      return res.status(404).json({
        message: "No Destinations Found",
      });
    }

    const names = destinations.map((item) => item.tripname);

    return res.status(200).json({
      payload: names,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getSingleDestination = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: "No id is present",
      });
    }

    const db = mongoose.connection.db;

    const destinations = await db
      .collection("destinations")
      .find({ destination_id: parseInt(id) })
      .toArray();

    if (destinations.length < 0) {
      return res.status(404).json({
        message: "No Destinations Found",
      });
    }

    return res.status(200).json({
      payload: destinations[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteDestination = async (req, res) => {
  try {
    const { destination_id } = req.body;

    if (!destination_id) {
      return res.status(400).json({
        message: "Required Fields are Missing",
        status: false,
      });
    }

    const db = mongoose.connection.db;

    await db
      .collection("destinations")
      .deleteOne({ destination_id: destination_id });

    return res.status(200).json({
      message: "Deletion Successful",
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};
