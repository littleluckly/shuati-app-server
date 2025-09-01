// routes/subjects.js
const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  getAllSubjects,
  getTagCountBySubjectId,
  getDifficultyLevelsBySubjectId,
  getDifficultyOptionsBySubjectId, // 新增的接口
  getAllTagsBySubjectId, // 新增的接口
  addUserTag,
  updateUserTag,
  deleteUserTag,
} = require("../controllers/subjectController");

router.get("/", getSubjects);
router.get("/all", getAllSubjects);
router.get("/:id", getSubjectById);
router.get("/:id/tags-count", getTagCountBySubjectId);
router.get("/:id/all-tags", getAllTagsBySubjectId); // 新增的路由
router.get("/:id/difficulty-levels", getDifficultyLevelsBySubjectId);
router.get("/:id/difficulty-options", getDifficultyOptionsBySubjectId); // 新增的路由

// User-defined tag management routes
router.post("/:id/user-tags", addUserTag);
router.put("/:id/user-tags/:tagName", updateUserTag);
router.delete("/:id/user-tags/:tagName", deleteUserTag);

module.exports = router;
