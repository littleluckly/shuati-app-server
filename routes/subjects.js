// routes/subjects.js
const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  getAllSubjects,
  getTagsBySubjectId,
  addUserTag,
  updateUserTag,
  deleteUserTag,
} = require("../controllers/subjectController");

router.get("/", getSubjects);
router.get("/all", getAllSubjects);
router.get("/:id", getSubjectById);
router.get("/:id/tags", getTagsBySubjectId);

// User-defined tag management routes
router.post("/:id/user-tags", addUserTag);
router.put("/:id/user-tags/:tagName", updateUserTag);
router.delete("/:id/user-tags/:tagName", deleteUserTag);

module.exports = router;
