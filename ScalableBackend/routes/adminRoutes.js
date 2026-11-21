const express = require("express");
const router = express.Router();

const {
  getPendingUsers,
  getAllClients,
  viewIdentityDocument,
  approveUser,
  rejectUser,
  updateClientBalance
} = require("../controllers/adminController");

const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

// All admin routes require authentication and administrator privileges
router.use(protect, adminOnly);

router.get("/pending-users", getPendingUsers);

// NEW: Retrieve all clients and dashboard statistics
router.get("/clients", getAllClients);

router.get("/users/:id/document", viewIdentityDocument);

router.patch("/users/:id/approve", approveUser);

router.patch("/users/:id/reject", rejectUser);

router.patch("/users/:id/balance", updateClientBalance);

module.exports = router;