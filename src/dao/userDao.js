const User = require('../model/User');

const userDao = {
  findByEmail: async (email) => {
    const user = await User.findOne({ email });
    return user;
  },

  // ADD THIS FUNCTION
  findById: async (id) => {
    const user = await User.findById(id);
    return user;
  },

  create: async (userData) => {
    const newUser = new User(userData);
    try {
      return await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        const err = new Error('User already exists');
        err.code = 'USER_EXIST';
        throw err;
      } else {
        console.log(error);
        throw new Error(error?.message || String(error));
      }
    }
  },
};

module.exports = userDao;