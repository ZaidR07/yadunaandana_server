import mongoose from "mongoose";
import { generateInvoice } from "../utils/receiptgenerator.js";

export const getReceipts = async (req, res) => {
  try {
    const db = mongoose.connection;

    if (!db.name) {
      return res.status(500).json({
        message: "Internal Server Error/db",
      });
    }

    const receipts = await db.collection("receipts").find({}).toArray();

    if (receipts.length == 0) {
      return res.status(404).json({
        message: "No Receipts Found",
      });
    }

    return res.status(200).json({
      payload: receipts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Updated CreateReceipt function in receipts.js
export const CreateReceipt = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      tripname,
      amount,
      totalAmount,
      balance,
      date,
      remark,
      noOfTravellers,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !mobile ||
      !tripname ||
      !amount ||
      !totalAmount ||
      !balance ||
      !noOfTravellers
    ) {
      return res.status(400).json({
        message: "Required Fields are Missing",
      });
    }

    // Get the last invoice number
    const db = mongoose.connection;
    const lastReceipt = await db
      .collection("receipts")
      .findOne({}, { sort: { _id: -1 } });

    // Generate invoice number (format: YA-YYYY-NNN)
    const currentYear = new Date().getFullYear();
    let sequenceNumber = 1;
    
    if (lastReceipt && lastReceipt.invoiceno) {
      const lastNumberParts = lastReceipt.invoiceno.split('-');
      if (lastNumberParts.length === 3 && lastNumberParts[2]) {
        sequenceNumber = parseInt(lastNumberParts[2]) + 1;
      }
    }

    const invoiceno = `YA-${currentYear}-${sequenceNumber.toString().padStart(3, '0')}`;

    // Prepare data for invoice generation
    const bookingData = {
      customerEmail: email,
      bookingId: invoiceno,
      customerName: fullName,
      companyName: "YADUNANDANA ADVENTURES",
      tripName: tripname,
      noOfTravelers: noOfTravellers,
      totalAmount: parseFloat(totalAmount),
      balance: parseFloat(balance),
      tripDate: date || new Date(),
      contact: "9330542026, 8777208318",
      email: "info@yadunandanaadventures.com",
      address: "Street Number 622, Action Area IIB, Newtown, Kolkata, West Bengal 700161",
      remark : remark
      
    };

    const templateData = {
      headerColor: '#4a7043'
    };

    // Generate PDF invoice and send email
    const { pdfUrl } = await generateInvoice(bookingData, templateData);

    // Store receipt in database
    const receiptData = {
      invoiceno,
      fullName,
      mobile,
      email,
      tripname,
      noOfTravellers: parseInt(noOfTravellers),
      amount: parseFloat(amount),
      totalAmount: parseFloat(totalAmount),
      balance: parseFloat(balance),
      date: date || new Date(),
      remark,
      pdfUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.collection("receipts").insertOne(receiptData);

    if (!insertResult.acknowledged) {
      return res.status(500).json({
        message: "Failed to save receipt to database"
      });
    }

    // Send response with PDF URL
    return res.status(200).json({
      success: true,
      pdfUrl,
      bookingId: invoiceno
    });

  } catch (error) {
    console.error("Error creating receipt:", error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};