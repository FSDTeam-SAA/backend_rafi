const { sendMail } = require("../config/mailer");
const Notification = require("../models/notificatiuon.model");
const PaymentInfo = require("../models/payment.model");
const User = require("../models/user.model");
const { uploadOnCloudinary } = require("../utils/cloudnary");


exports.updateUser = async (req, res) => {
  try {
    const { id, email, phoneNumber, address,fullName } = req.body

    if (!fullName || !email) {
      return res.status(400).send({
        succuss: false,
        message: "Please enter all fields",

      })
    }
    let imageLink
    if (req.file) {
      try {
        const image = await uploadOnCloudinary(req.file.buffer);
        imageLink = image.secure_url;
      } catch (error) {
        console.log( error);
        return res.status(400).json({
          status: false,
          message: 'Failed to upload image',
        });
      }
    }
    const user = await User.findByIdAndUpdate(id, { $set: { fullName, phoneNumber, address, profilePhoto: imageLink } }, { new: true })


    return res
      .status(201).send({
        success: true,
        message: "User updated successfully",
        data: user
      })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message
    })
  }
}

// exports.GetAllReffer = async (req, res) => {
//   try {
//     const user = await User.find().select('userName email refferCount')
//     res.status(200).send({
//       status: true,
//       message: 'success',
//       data: user
//     })

//   } catch (error) {
//     res.status(500).send({
//       status: false,
//       message: 'server error',
//       error: error.message
//     })

//   }
// }

// const User = require('../models/User');
// const PaymentInfo = require('../models/paymentInfo');

exports.GetAllReffer = async (req, res) => {
  try {
    const users = await User.find().select('userName email refferCount');

    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const latestPayment = await PaymentInfo.findOne({
        userId: user._id,
        paymentStatus: 'complete',
        expiryDate: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      const isPaidUser = !!latestPayment;

      return {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        refferCount: user.refferCount,
        status: isPaidUser ? 'Paid' : 'Unpaid',
        isPaidUser,
      };
    }));

    // Split into paid and unpaid users
    const paidUsers = enrichedUsers.filter(user => user.isPaidUser);
    const unpaidUsers = enrichedUsers.filter(user => !user.isPaidUser);

    res.status(200).send({
      status: true,
      message: 'success',
      totalUsers: enrichedUsers.length,
      totalPaidUsers: paidUsers.length,
      totalUnpaidUsers: unpaidUsers.length,
      data: {
        user: enrichedUsers,
        paidUsers,
        unpaidUsers
      }
    });

  } catch (error) {
    res.status(500).send({
      status: false,
      message: 'server error',
      error: error.message
    });
  }
};



exports.singleUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }

    // Get the most recent completed payment
    const payment = await PaymentInfo.find({
      userId: id,
      paymentStatus: 'complete',
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('subscriptionId');

    const latestPayment = payment[0];
    const currentDate = new Date();

    // Check if payment is valid (i.e., not expired)
    const isPaymentValid =
      latestPayment && latestPayment.expiryDate > currentDate;

    res.status(200).send({
      status: true,
      message: 'success',
      data: user,
      payment: isPaymentValid ? latestPayment.subscriptionId?.title : 'free',
      expiryDate: latestPayment?.expiryDate || null,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: 'server error',
      error: error.message,
    });
  }
};


exports.support = async (req, res) => {
  try {
    const { firstName, lastName, email, message, subject, phoneNumber } = req.body;

    const fullName = `${firstName} ${lastName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2>New Support Request</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber || 'N/A'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">
          ${message}
        </div>
      </div>
    `;

    await sendMail(process.env.SUPPORT_EMAIL, `Support Request: ${subject}`, htmlContent);

    res.status(200).json({ message: 'Support request sent successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send support request.' });
  }
};

exports.getNotification = async (req, res) =>{
  try {
    const userId = req.user._id
    const notification = await Notification.find({userId: userId})
    res.status(200).send(notification)
  } catch (error) {
    res.status(500).send({error: 'Failed to get notification.'})
  }
}
