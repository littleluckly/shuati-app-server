// routes/subjects.js
const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
} = require("../controllers/subjectController");

router.get("/", getSubjects);
router.get("/:id", getSubjectById);

module.exports = router;
