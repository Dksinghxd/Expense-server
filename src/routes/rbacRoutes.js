const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorizeMiddleware');
const rbacController = require('../controllers/rbacController');

const router = express.Router();

router.use(protect);

router.post('/', authorize('user:create'), rbacController.create);
router.patch('/', authorize('user:update'), rbacController.update);
router.post('/delete', authorize('user:delete'), rbacController.delete);
router.get('/', authorize('user:view'), rbacController.getAllUsers);

module.exports = router;
