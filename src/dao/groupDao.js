const Group = require("../model/group");

const groupDao = {

 
  createGroup: async (data) => {
    const newGroup = new Group(data);
    return await newGroup.save();
  },

  createdGroup: async (data) => {
    return await groupDao.createGroup(data);
  },

  
  updateGroup: async (data) => {
    const { groupId, name, description, thumbnail, adminEmail, paymentStatus } =
      data;

    return await Group.findByIdAndUpdate(
      groupId,
      { name, description, thumbnail, adminEmail, paymentStatus },
      { new: true }
    );
  },

  
  addMembers: async (groupId, ...membersEmail) => {
    return await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { membersEmail: { $each: membersEmail } } },
      { new: true }
    );
  },

  removeMembers: async (groupId, ...membersEmail) => {
    return await Group.findByIdAndUpdate(
      groupId,
      { $pull: { membersEmail: { $in: membersEmail } } },
      { new: true }
    );
  },

  
  getGroupByEmail: async (email) => {
    return await Group.find({ membersEmail: email });
  },

  getGroupByStatus: async (status) => {
    return await Group.find({ "paymentStatus.isPaid": status });
  },

  
  getAuditLog: async (groupId) => {
    return await Group.findById(groupId).select({
      paymentStatus: 1,
      _id: 0,
    });
  },

  getPaymentStatusDate: async (groupId) => {
    const group = await Group.findById(groupId).select(
      "paymentStatus.date"
    );
    return group ? group.paymentStatus.date : null;
  },

  getGroupsPaginated: async (email, limit, skip) => {
    const [groups, totalCount] = await Promise.all([
      Group.find({ membersEmail: email })
        .sort({ createdAt: -1 }) // stable pagination
        .skip(skip)
        .limit(limit),

      Group.countDocuments({ membersEmail: email }),
    ]);

    return { groups, totalCount };
  },
};

module.exports = groupDao;
