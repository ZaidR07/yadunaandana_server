import mongoose from "mongoose";

// Constants
const REQUIRED_FIELDS = ["fullName", "mobile", "email", "adults"];
const ADVANCE_PAYMENT = 1000;

export const addNewBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payload } = req.body;

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter((field) => !payload[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
        success: false,
      });
    }

    // Generate booking ID (B + 10 digits from timestamp)
    const timestampStr = Date.now().toString();
    const bookingId = `B${timestampStr.slice(-10)}`; // Takes last 10 digits

    // Validate database connection
    const db = mongoose.connection;
    if (!db?.name) {
      throw new Error("Database connection not established");
    }

    // Prepare booking data
    const bookingData = {
      bookingId, // Add the generated booking ID
      fullName: payload.fullName,
      mobile: payload.mobile,
      email: payload.email,
      adults: payload.adults,
      children: payload.children || 0,
      tripname: payload.destination?.tripname || "",
      price: payload.pricingDetails?.totalAmount || 0,
      balance: Math.max(
        0,
        parseInt(payload.pricingDetails?.totalAmount || 0) - ADVANCE_PAYMENT
      ),
      advancePaid: ADVANCE_PAYMENT,
      createdAt: new Date(),
    };

    // Insert booking with transaction
    await db.collection("bookings").insertOne(bookingData, { session });
    await session.commitTransaction();

    return res.status(201).json({
      message: "Booking successful",
      data: {
        bookingId, // Return the generated booking ID
        balanceDue: bookingData.balance,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking error:", error);

    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  } finally {
    session.endSession();
  }
};

export const getBookings = async (req, res) => {
  try {
    const db = mongoose.connection;

    if (!db.name) {
      return res.status(500).json({
        message: "Internal Server Error/db",
      });
    }

    const bookings = await db.collection("bookings").find({}).toArray();

    if (bookings.length == 0) {
      return res.status(404).json({
        message: "No Booking Found",
      });
    }

    return res.status(200).json({
      bookings: bookings,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
