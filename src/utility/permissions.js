const { ADMIN_ROLE, MANAGER_ROLE, VIEWER_ROLE } = require('./userRoles');

const permissions = {
  [ADMIN_ROLE]: [
    // User permissions
    'user:create',
    'user:update',
    'user:delete',
    'user:view',

    // Group permissions
    'group:create',
    'group:update',
    'group:delete',
    'group:view',

    // 💳 Payment permissions
    'payment:create'
  ],

  [MANAGER_ROLE]: [
    // User permissions
    'user:view',

    // Group permissions
    'group:create',
    'group:update',
    'group:view',

    // 💳 Payment permissions (optional but realistic)
    'payment:create'
  ],

  [VIEWER_ROLE]: [
    'user:view',
    'group:view'
  ]
};

module.exports = permissions;
