import { Router } from "express";
import { adminlogin } from "./Controllers/admin.js";
import multer from "multer";
import { addcarouselimages, addgalleryimages, addleftad, addrightad, deletecarouselimage, deletegalleryimage, getcarouselimages, getgalleryimages, getHeroImages } from "./Controllers/images.js";
import { addDestination, getDestinations, getSingleDestination } from "./Controllers/destination.js";


// Initialize multer for file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

const approuter = Router();

approuter.post("/api/adminlogin",adminlogin);

// Carousel
approuter.post("/api/addcarouselimages",upload.array("images"), addcarouselimages);
approuter.get("/api/getcarouselimages",getcarouselimages);
approuter.post("/api/deletecarousel",deletecarouselimage);


// Gallery
approuter.get("/api/getgalleryimages",getgalleryimages);
approuter.post("/api/addgalleryimages",upload.array("images"), addgalleryimages);
approuter.post("/api/deletegallery",deletegalleryimage);


approuter.post(
  "/api/adddestination",
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "blogs", maxCount: 10 }
  ]),
  addDestination
);
approuter.get("/api/getdestinations",getDestinations);
approuter.get("/api/getsingledestination",getSingleDestination);



// Image Routes
approuter.get("/api/getheroimages",getHeroImages);

approuter.post("/api/addleftad", upload.single("image"), addleftad);

approuter.post("/api/addrightad", upload.single("image"), addrightad);






export default approuter;
