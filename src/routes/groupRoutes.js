const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get(
  '/my-groups',
  authorize('group:view'),
  groupController.getGroupsByUser
);
router.post(
  '/create',
  authorize('group:create'),
  groupController.create
);

router.put(
  '/update',
  authorize('group:update'),
  groupController.updateGroup
);

router.put(
  '/add-members',
  authorize('group:update'),
  groupController.addMembers
);

router.put(
  '/remove-members',
  authorize('group:update'),
  groupController.removeMembers
);

router.patch(
  '/members/add',
  authorize('group:update'),
  groupController.addMembers
);

router.patch(
  '/members/remove',
  authorize('group:update'),
  groupController.removeMembers
);

router.get(
  '/by-email/:email',
  authorize('group:view'),
  groupController.getGroupByEmail
);

router.get(
  '/by-status/:status',
  authorize('group:view'),
  groupController.getGroupByStatus
);

router.get(
  '/audit/:groupId',
  authorize('group:view'),
  groupController.getAuditLog
);

module.exports = router;
