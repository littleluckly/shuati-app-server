// routes/userActions.js
const express = require("express");
const router = express.Router();
const {
  recordUserAction,
  getUserStats,
  resetDeletedQuestions,
  undeleteQuestions,
  getDeletedQuestions,
  selectSubject,
  getCurrentSubject,
  login,
  logout
} = require("../controllers/userActionController");

router.post("/", recordUserAction);
router.get("/stats", getUserStats);
router.post("/reset-deleted", resetDeletedQuestions);
router.post("/undelete", undeleteQuestions);
router.post("/deleted-questions", getDeletedQuestions);
// 新增的路由
router.post("/select-subject", selectSubject);
router.get("/current-subject", getCurrentSubject);
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
