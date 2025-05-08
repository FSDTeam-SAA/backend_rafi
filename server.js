const dotenv = require("dotenv").config();
const dbConnection = require("./db/dbConnection");
const app = require("./app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
  await dbConnection();
  console.log(`Server is running on http://localhost:${PORT}`);
});
