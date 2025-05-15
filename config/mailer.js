const nodemailer = require('nodemailer')


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'fsdteam.saa@gmail.com',
    pass: process.env.EMAIL_PASS || 'ndhe htek sdoz skfc',
  },
})

 const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  })
}

module.exports = { sendMail } 
