import User from "../models/User.js";
import School from "../models/School.js";

// GET /api/affiliates/me
export const getAffiliateStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Find all schools referred by this user
    const referrals = await School.find({ referredByAffiliate: user._id })
      .select("name status createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        balance: user.affiliateBalance,
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
