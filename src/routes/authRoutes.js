const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const {
  loginValidator,
  resetPasswordValidator
} = require('../validator/authValidator');

const router = express.Router();

router.post('/register', authController.register);

router.post('/login', loginValidator, authController.login);

router.post('/logout', authController.logout);

router.post(
  '/is-user-logged-in',
  authMiddleware.protect,
  authController.isUserLoggedIn
);

router.post('/google-auth', authController.googleSso);

router.post('/reset-password', authController.resetPassword);

router.post(
  '/change-password',
  resetPasswordValidator,
  authController.changePassword
);

module.exports = router;
