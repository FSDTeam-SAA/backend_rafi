const dotenv = require("dotenv").config();
const { app,server } = require("./app");
const dbConnection = require("./db/dbConnection");

const PORT = process.env.PORT || 5001;

server.listen(PORT, async () => {
  await dbConnection();
  console.log(`Server is running on http://localhost:${PORT}`);
});
