const groupDao = require("../dao/groupDao");
const userDao = require("../dao/userDao"); // 🔥 Added (P3)

const groupController = {

  /* ================= CREATE GROUP ================= */
  create: async (request, response) => {
    try {
      const user = request.user;
      const { name, description, membersEmail, thumbnail } = request.body;

      const userInfo = await userDao.findByEmail(user.email);

     
      if (userInfo.credits === undefined) {
        userInfo.credits = 1;
      }

      if (Number(userInfo.credits) === 0) {
        return response.status(400).json({
          message: "You do not have enough credits to perform this operation",
        });
      }

      let allMembers = [user.email];

      if (membersEmail && Array.isArray(membersEmail)) {
        allMembers = [...new Set([...allMembers, ...membersEmail])];
      }

      const newGroup = await groupDao.createGroup({
        name,
        description,
        adminEmail: user.email,
        membersEmail: allMembers,
        thumbnail,
        paymentStatus: {
          amount: 0,
          currency: "INR",
          date: Date.now(),
          isPaid: false,
        },
      });

      // 🔥 Deduct 1 credit after successful creation (P3)
      userInfo.credits -= 1;
      await userInfo.save();

      response.status(201).json({
        message: "Group created successfully",
        groupId: newGroup._id,
      });

    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Internal server error" });
    }
  },

  /* ================= UPDATE GROUP ================= */
  updateGroup: async (request, response) => {
    try {
      const updatedGroup = await groupDao.updateGroup(request.body);
      if (!updatedGroup) {
        return response.status(404).json({ message: "Group not found" });
      }
      response.status(200).json(updatedGroup);
    } catch (error) {
      response.status(500).json({ message: "Error updating group" });
    }
  },

  update: async (request, response) => {
    return groupController.updateGroup(request, response);
  },

  /* ================= ADD MEMBERS ================= */
  addMembers: async (request, response) => {
    try {
      const { groupId, emails } = request.body;
      const updatedGroup = await groupDao.addMembers(groupId, ...emails);
      response.status(200).json(updatedGroup);
    } catch (error) {
      response.status(500).json({ message: "Error adding members" });
    }
  },

  /* ================= REMOVE MEMBERS ================= */
  removeMembers: async (request, response) => {
    try {
      const { groupId, emails } = request.body;
      const updatedGroup = await groupDao.removeMembers(groupId, ...emails);
      response.status(200).json(updatedGroup);
    } catch (error) {
      response.status(500).json({ message: "Error removing members" });
    }
  },

  /* ================= GET GROUPS BY EMAIL ================= */
  getGroupByEmail: async (request, response) => {
    try {
      const email = request.params.email;
      const groups = await groupDao.getGroupByEmail(email);
      response.status(200).json(groups);
    } catch (error) {
      response.status(500).json({ message: "Error fetching groups" });
    }
  },

  /* ================= GET GROUPS BY USER (PAGINATED) ================= */
  getGroupsByUser: async (request, response) => {
    try {
      const user = request.user;
      const ownerEmail = user.email;

      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 10;
      const skip = (page - 1) * limit;

      const { groups, totalCount } =
        await groupDao.getGroupsPaginated(ownerEmail, limit, skip);

      response.status(200).json({
        groups,
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Error fetching groups" });
    }
  },

  /* ================= FILTER BY STATUS ================= */
  getGroupByStatus: async (request, response) => {
    try {
      const status = request.params.status === "true";
      const groups = await groupDao.getGroupByStatus(status);
      response.status(200).json(groups);
    } catch (error) {
      response.status(500).json({ message: "Error filtering groups" });
    }
  },

  getGroupsByPaymentStatus: async (request, response) => {
    try {
      const { isPaid } = request.query;
      const status = isPaid === "true";
      const groups = await groupDao.getGroupByStatus(status);
      response.status(200).json(groups);
    } catch (error) {
      response.status(500).json({ message: "Error filtering groups" });
    }
  },

  /* ================= AUDIT ================= */
  getAuditLog: async (request, response) => {
    try {
      const { groupId } = request.params;
      const lastSettled = await groupDao.getAuditLog(groupId);
      response.status(200).json({ lastSettled });
    } catch (error) {
      response.status(500).json({ message: "Error fetching audit log" });
    }
  },

  getAudit: async (request, response) => {
    return groupController.getAuditLog(request, response);
  },
};

module.exports = groupController;
