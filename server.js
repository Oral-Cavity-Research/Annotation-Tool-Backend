const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/dbconfig");
const cookieParser = require("cookie-parser");
const path = require("path");
const morgan = require("morgan");
const mongoose = require("mongoose");

//const PORT = process.env.PORT || 8000;
const PORT = 5000;

dotenv.config();
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "process.env.ORIGIN_URL" }));

// connect to the db
connectDB();

// listen on port
app.listen(PORT, () => {
  console.log(`Server is running on localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Welcome to server! this is server side test");
});

// import routes
const userAuthRoute = require("./routes/userAuth");
app.use("/api/auth", userAuthRoute);

const adminAuthRoute = require("./routes/adminAuth");
app.use("/api/admin/auth", adminAuthRoute);

const imagesRoute = require("./routes/image");
app.use("/api/image", imagesRoute);

const adminRoute = require("./routes/admin");
app.use("/api/admin", adminRoute);

const patientRoute = require("./routes/patient");
app.use("/api/user/patient", patientRoute);

const EntryRoute = require("./routes/entry");
app.use("/api/user/entry", EntryRoute);

const UploadRoute = require("./routes/upload");
app.use("/api/user/upload", UploadRoute);

const userRoute = require("./routes/user");
app.use("/api/user/self", userRoute);

const dashboardRoutes = require("./routes/DashboardRoutes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

app.use("/Storage", express.static(path.join(__dirname, "/Storage")));
app.use("/Storage/images",express.static(path.join(__dirname, "/Storage/images")));
app.use("/Storage/reports",express.static(path.join(__dirname, "/Storage/reports")));
