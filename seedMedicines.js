import mongoose from "mongoose";
import dotenv from "dotenv";
import Medicine from "./src/models/Medicine.js";
import { medicines } from "./seedData.js";

dotenv.config();

const seedMedicines = async () => {
  try {
    await mongoose.connect("mongodb://172.20.41.69:27017/medicinefinder");

    console.log("✅ MongoDB connected");

    await Medicine.deleteMany({
      name: { $in: medicines.map((m) => m.name) },
    });

    await Medicine.insertMany(medicines);

    console.log(`🌱 ${medicines.length} medicines seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedMedicines();
