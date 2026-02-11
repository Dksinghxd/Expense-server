const bcrypt = require('bcryptjs');
const rbacDao = require('../dao/rbacDao');
const { USER_ROLES } = require('../utility/userRoles');
const { generateTemporaryPassword } = require('../utility/passwordUtil');
const emailService = require('../service/emailService');

const rbacController = {
  create: async (req, res) => {
    try {
      const adminUser = req.user;
      const { name, email, role } = req.body;

      if (!name || !email || !role) {
        return res.status(400).json({ message: 'Name, email and role are required' });
      }

      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const tempPassword = generateTemporaryPassword(8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const adminId =
        adminUser?.adminId || adminUser?.userId || adminUser?._id;

      const user = await rbacDao.create(
        email,
        name,
        role,
        hashedPassword,
        adminId
      );

      let emailSent = false;
      let emailReason = null;
      try {
        if (emailService?.isEnabled) {
          await emailService.send(
            email,
            'Temporary Password',
            `Your password is: ${tempPassword}`
          );
          emailSent = true;
        } else {
          emailReason = 'Email service not configured';
        }
      } catch (emailErr) {
        emailReason = emailErr?.message || 'Failed to send email';
      }

      return res.status(201).json({
        message: emailSent ? 'User created' : 'User created (email not sent)',
        user,
        emailSent,
        emailReason,
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ message: 'User already exists' });
      }

      console.error('rbacController.create error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { userId, name, role } = req.body;
      const user = await rbacDao.update(userId, name, role);
      return res.json({ message: 'User updated', user });
    } catch (err) {
      console.error('rbacController.update error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  delete: async (req, res) => {
    try {
      const { userId } = req.body;
      await rbacDao.delete(userId);
      return res.json({ message: 'User deleted' });
    } catch (err) {
      console.error('rbacController.delete error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const adminId =
        req.user?.adminId || req.user?.userId || req.user?._id;

      if (!adminId) {
        return res.status(400).json({ message: 'Missing adminId' });
      }

      const users = await rbacDao.getUsersByAdminId(adminId);
      return res.json({ users });
    } catch (err) {
      console.error('rbacController.getAllUsers error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = rbacController;
