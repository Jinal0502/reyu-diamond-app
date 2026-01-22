import mongoose from "mongoose"
import dotenv from "dotenv"
import { User } from "../models/User.model"

dotenv.config()

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI as string)

  const email = "jinaljain56811@gmail.com"

  const exists = await User.findOne({ email })
  if (exists) {
    process.exit(0)
  }

  await User.create({
    name: "Jinal Jain",
    email,
    password: "Admin@123",
    role: "admin",
    isEmailVerified: true,
    isKycVerified: true,
  })

  process.exit(0)
}

seedAdmin().catch(() => process.exit(1))
