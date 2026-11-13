
import mongoose from "mongoose";
import dotenv from "dotenv";
import School from "./src/models/School.js";
import { seedSecondarySchool } from "./src/services/seedSchool.js";

dotenv.config();

const upgradeSchool = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB...");

    // 👈 CHANGE THIS to the email of the school you want to upgrade
    // (Use the email you registered with, e.g., the one from your new test school)
    const schoolEmail = "test@school.com"; 
    
    const school = await School.findOne({ email: schoolEmail });
    if (!school) {
      console.log("❌ School not found! Check the email.");
      process.exit(1);
    }

    // If tracks doesn't exist yet (old schools), initialize it
    if (!school.tracks) {
      school.tracks = ["nursery_primary"];
    }

    // Add secondary track if it's not there
    if (!school.tracks.includes("secondary")) {
      school.tracks.push("secondary");
      await school.save();
      console.log(`✅ Added secondary track to ${school.name}`);
    } else {
      console.log(`ℹ️ ${school.name} already has the secondary track.`);
    }

    // Run the seed (this will create JSS1-SSS3 classes & subjects)
    console.log("🌱 Seeding secondary classes and subjects...");
    await seedSecondarySchool(school._id);
    
    console.log("🎉 Upgrade complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

upgradeSchool();
