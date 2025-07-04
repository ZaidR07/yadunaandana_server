import { Router } from "express";
import { adminlogin } from "./Controllers/admin.js";
import multer from "multer";
import {
  addcarouselimages,
  addgalleryimages,
  addleftad,
  addrightad,
  deletecarouselimage,
  deletegalleryimage,
  getcarouselimages,
  getgalleryimages,
  getHeroImages,
} from "./Controllers/images.js";
import {
  addDestination,
  deleteDestination,
  getDestinations,
  getDestinationsName,
  getSingleDestination,
} from "./Controllers/destination.js";
import {
  getUser,
  getUsers,
  RegisterUser,
  sendotp,
  verifyotp,
} from "./Controllers/user.js";
import { sendcontactmessage } from "./Controllers/contact.js";
import {
  getDestinationReviews,
  getReviews,
  SubmitReview,
} from "./Controllers/review.js";
import { RequestCallback } from "./Controllers/callrequest.js";
import { addVisitor, getDashboardNumbers } from "./Controllers/visitors.js";
import { addActivities, getActivities } from "./Controllers/activities.js";
import { addNewBooking, getBookings } from "./Controllers/bookings.js";
import { CreateReceipt, getReceipts } from "./Controllers/receipts.js";

// Initialize multer for file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

const approuter = Router();

approuter.post("/api/adminlogin", adminlogin);

// Carousel
approuter.post(
  "/api/addcarouselimages",
  upload.array("images"),
  addcarouselimages
);
approuter.get("/api/getcarouselimages", getcarouselimages);
approuter.post("/api/deletecarousel", deletecarouselimage);

// Gallery
approuter.get("/api/getgalleryimages", getgalleryimages);
approuter.post(
  "/api/addgalleryimages",
  upload.array("images"),
  addgalleryimages
);
approuter.post("/api/deletegallery", deletegalleryimage);

approuter.post(
  "/api/adddestination",
  upload.fields([
    { name: "displayphoto" },
    { name: "photos", maxCount: 10 },
    { name: "blogs", maxCount: 10 },
    { name: "accomodations", maxCount: 10 },
  ]),
  addDestination
);

approuter.get("/api/getdestinations", getDestinations);
approuter.get("/api/getdestinationsname", getDestinationsName);
approuter.post("/api/deletedestination", deleteDestination);

approuter.get("/api/getsingledestination", getSingleDestination);

// Image Routes
approuter.get("/api/getheroimages", getHeroImages);

approuter.post("/api/addleftad", upload.single("image"), addleftad);

approuter.post("/api/addrightad", upload.single("image"), addrightad);

// Login and Register Routes
approuter.post("/api/adduser", RegisterUser);
approuter.post("/api/sendotp", sendotp);
approuter.post("/api/verifyotp", verifyotp);
approuter.get("/api/getusers", getUsers);
approuter.get("/api/getuser", getUser);

// Contact Page
approuter.post("/api/sendcontactmessage", sendcontactmessage);

//Review
approuter.post("/api/submitreview", SubmitReview);
approuter.get("/api/getreviews", getReviews);
approuter.get("/api/getdestinationreview", getDestinationReviews);

//Call Request
approuter.post("/api/requestcallback", RequestCallback);

//visitor Routes
approuter.post("/api/addvisitor", addVisitor);
approuter.get("/api/getdashboardnumbers", getDashboardNumbers);

//Activities
approuter.post(
  "/api/addactivity",
  upload.fields([{ name: "displayphoto" }, { name: "photos", maxCount: 10 }]),
  addActivities
);
approuter.get("/api/getactivities", getActivities);

// Booking
approuter.post("/api/addnewbooking", addNewBooking);
approuter.get("/api/getbookings", getBookings);


//Receipts
approuter.get("/api/getreceipts" , getReceipts);
approuter.post("/api/createreceipt" , CreateReceipt);

export default approuter;
