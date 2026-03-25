import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.model";

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGODB_URI is not defined");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const email = "admin@test.com";
    const password = "Password123!";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User ${email} already exists. Updating to verified admin...`);
      existingUser.isEmailVerified = true;
      existingUser.role = "admin";
      await existingUser.save();
    } else {
      console.log(`Creating new verified admin: ${email}`);
      await User.create({
        name: "Test Admin",
        email,
        password,
        role: "admin",
        isEmailVerified: true,
      });
    }

    console.log("Seed successful!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seedAdmin();
