const  moment  = require("moment");
const PaymentInfo = require("../models/payment.model");
const User = require("../models/user.model");

exports.getDashboardStats = async (req, res) => {
  try {
    const monthNames = moment.months(); // ["January", "February", ..., "December"]

    const totalUsers = await User.countDocuments();
    const completedPayments = await PaymentInfo.find({ paymentStatus: "complete" });

    const totalEarnings = completedPayments.reduce((sum, p) => sum + p.price, 0);

    // Paid users
    const paidUserIds = [...new Set(completedPayments.map(p => p.userId.toString()))];
    const paidUsersCount = paidUserIds.length;
    const unpaidUsersCount = totalUsers - paidUsersCount;

    // Monthly earnings and user stats
    const monthlyEarnings = {};
    const monthlyPaidUsers = {};
    const monthlyFreeUsers = {};

    monthNames.forEach(month => {
      monthlyEarnings[month] = 0;
      monthlyPaidUsers[month] = 0;
      monthlyFreeUsers[month] = 0;
    });

    completedPayments.forEach(p => {
      const month = moment(p.createdAt).format('MMMM');
      monthlyEarnings[month] += p.price;
    });

    const users = await User.find({}, { createdAt: 1 });
    for (const user of users) {
      const month = moment(user.createdAt).format('MMMM');
      const isPaid = paidUserIds.includes(user._id.toString());
      if (isPaid) {
        monthlyPaidUsers[month]++;
      } else {
        monthlyFreeUsers[month]++;
      }
    }

    res.status(200).json({
      totalEarnings,
      totalUsers,
      paidUsers: paidUsersCount,
      unpaidUsers: unpaidUsersCount,
      earningsChart: monthlyEarnings,
      userChart: {
        paid: monthlyPaidUsers,
        free: monthlyFreeUsers
      }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Dashboard stats failed", error: err.message });
  }
};