// routes/subjects.js
const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  getAllSubjects,
  getTagCountBySubjectId,
  getDifficultyLevelsBySubjectId,
  getDifficultyOptionsBySubjectId,
  getAllTagsBySubjectId,
  addUserTag,
  updateUserTag,
  deleteUserTag,
  createSubject,
  updateSubject,
  deleteSubject
} = require("../controllers/subjectController");

// 基本科目操作
router.post("/", createSubject);
router.get("/", getSubjects);
router.get("/all", getAllSubjects);
router.get("/:id", getSubjectById);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

// 科目详细信息和统计
router.get("/:id/tags-count", getTagCountBySubjectId);
router.get("/:id/all-tags", getAllTagsBySubjectId);
router.get("/:id/difficulty-levels", getDifficultyLevelsBySubjectId);
router.get("/:id/difficulty-options", getDifficultyOptionsBySubjectId);

// User-defined tag management routes
router.post("/:id/user-tags", addUserTag);
router.put("/:id/user-tags/:tagName", updateUserTag);
router.delete("/:id/user-tags/:tagName", deleteUserTag);

module.exports = router;
