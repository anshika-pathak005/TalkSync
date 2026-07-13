import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    cancelConnectionRequest,
    removeConnection,
    getMyConnections,
    getPendingRequests,
    getSentRequests,
    getConnectionStatusWith,
} from "../controller/connectionControllers.js";

const router = express.Router();

router.route("/send").post(protect, sendConnectionRequest);
router.route("/accept").put(protect, acceptConnectionRequest);
router.route("/reject").put(protect, rejectConnectionRequest);
router.route("/cancel").put(protect, cancelConnectionRequest);
router.route("/remove").put(protect, removeConnection);

router.route("/my-connections").get(protect, getMyConnections);
router.route("/pending").get(protect, getPendingRequests);
router.route("/sent").get(protect, getSentRequests);
router.route("/status/:userId").get(protect, getConnectionStatusWith);

export default router;