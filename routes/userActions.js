// routes/userActions.js
const express = require("express");
const router = express.Router();
const {
  recordUserAction,
  getUserStats,
} = require("../controllers/userActionController");

router.post("/", recordUserAction);
router.get("/stats", getUserStats);

module.exports = router;
