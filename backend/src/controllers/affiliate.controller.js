import User from "../models/User.js";
import School from "../models/School.js";

// GET /api/affiliates/me
export const getAffiliateStats = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 👈 Auto-heal: Generate a referral code if the user doesn't have one
    if (!user.referralCode) {
      let isUnique = false;
      let code = "";
      
      while (!isUnique) {
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const namePart = user.fullName.split(" ")[0].substring(0, 3).toUpperCase();
        code = `${namePart}${randomStr}`;

        const existing = await User.findOne({ referralCode: code });
        if (!existing) isUnique = true;
      }
      user.referralCode = code;
      await user.save();
    }

    // Find all schools referred by this user
    const referrals = await School.find({ referredByAffiliate: user._id })
      .select("name status createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        balance: user.affiliateBalance || 0,
        earnings: user.affiliateEarnings || [],
        referrals: referrals.map(r => ({
          _id: r._id,
          schoolName: r.name,
          status: r.status,
          date: r.createdAt,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
