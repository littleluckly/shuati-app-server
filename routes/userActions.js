// routes/userActions.js
const express = require("express");
const router = express.Router();
const {
  recordUserAction,
  getUserStats,
  resetDeletedQuestions,
  undeleteQuestions,
  getDeletedQuestions,
} = require("../controllers/userActionController");

router.post("/", recordUserAction);
router.get("/stats", getUserStats);
router.post("/reset-deleted", resetDeletedQuestions);
router.post("/undelete", undeleteQuestions);
router.post("/deleted-questions", getDeletedQuestions);

module.exports = router;
