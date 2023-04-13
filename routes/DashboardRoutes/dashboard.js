const router = require("express").Router();
const User = require("../../models/User");
const Image = require("../../models/Image");
const Patient = require("../../models/Patient");

const {
  authenticateToken,
  checkPermissions,
} = require("../../middleware/auth");
require("dotenv").config();

// GET route to get the % of risk habits
router.get("/percentages", authenticateToken, async (req, res) => {
  if (!checkPermissions(req.permissions, [110])) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
  try {
    Patient.aggregate(
      [
        { $unwind: "$risk_factors" },
        { $group: { _id: "$risk_factors.habit", count: { $sum: 1 } } },
        { $project: { _id: 0, item: "$_id", count: 1 } },
      ],
      function (err, results) {
        if (err) {
          return res.status(500).json(err);
        } else {
          Patient.countDocuments({}, function (err, count) {
            if (err) {
              return res.status(500).json(err);
            } else {
              const arr = [];
              results.forEach((result) => {
                const percentage = (result.count / count) * 100;
                arr.push(`${result.item}: ${percentage}%`);
              });

              return res.status(200).json(arr);
            }
          });
        }
      }
    );
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET route to get the total number of doctors, images and patients
router.get("/totals", authenticateToken, async (req, res) => {
  if (!checkPermissions(req.permissions, [110])) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
  try {
    const patients = await Patient.countDocuments();
    const doctors = await User.countDocuments();
    const images = await Image.countDocuments();

    res
      .status(200)
      .json({ doctors: doctors, patients: patients, images: images });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
