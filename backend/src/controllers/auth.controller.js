user.lastLogin = new Date();
await user.save({ validateBeforeSave: false });

const token = generateToken(user._id); // 👈 THIS MUST BE HERE

res.json({
  success: true,
  message: "Login successful",
  data: {
    token, // 👈 AND IT MUST BE RETURNED HERE
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    },
  },
});
