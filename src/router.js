import { Router } from "express";
import { adminlogin } from "./Controllers/admin.js";
import multer from "multer";
import { addcarouselimages, getcarouselimages, getgalleryimages } from "./Controllers/images.js";
import { addDestination } from "./Controllers/destination.js";


// Initialize multer for file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

const approuter = Router();

approuter.post("/api/adminlogin",adminlogin);
approuter.post("/api/addcarouselimages",upload.array("images") , addcarouselimages);
approuter.get("/api/getcarouselimages",getcarouselimages);
approuter.get("/api/getgalleryimages",getgalleryimages);

approuter.post(
  "/api/adddestination",
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "blogs", maxCount: 10 }
  ]),
  addDestination
);





export default approuter;
