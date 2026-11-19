import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { usersCollection } from "../config/db.js";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../config/constants.js";
import { readUsersFromFile, writeUsersToFile } from "./fileStorage.js";

const SALT_ROUNDS = 10;

export const userService = {
  async findByEmail(email) {
    if (usersCollection) {
      const user = await usersCollection.findOne({ email });
      if (!user) return null;
      const { _id: _ignoredId, ...sanitized } = user;
      return sanitized;
    }
    const users = await readUsersFromFile();
    return users.find((u) => u.email === email) || null;
  },

  async comparePassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },

  async create({ name, email, phone, password, role = "user" }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = {
      id: randomUUID(),
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      updatedAt: new Date().toISOString()
    };

    if (usersCollection) {
      await usersCollection.insertOne(user);
      const { _id: _ignoredId, ...sanitized } = user;
      return sanitized;
    }

    const users = await readUsersFromFile();
    users.push(user);
    await writeUsersToFile(users);
    return user;
  },

  async setPasswordReset(email, passwordResetTokenHash, passwordResetExpiresAt) {
    if (usersCollection) {
      const result = await usersCollection.updateOne(
        { email },
        { $set: { passwordResetTokenHash, passwordResetExpiresAt } }
      );
      return result.matchedCount > 0;
    }

    const users = await readUsersFromFile();
    const user = users.find((item) => item.email === email);
    if (!user) return false;
    user.passwordResetTokenHash = passwordResetTokenHash;
    user.passwordResetExpiresAt = passwordResetExpiresAt;
    await writeUsersToFile(users);
    return true;
  },

  async clearPasswordReset(email, passwordResetTokenHash) {
    if (usersCollection) {
      await usersCollection.updateOne(
        { email, passwordResetTokenHash },
        { $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" } }
      );
      return;
    }

    const users = await readUsersFromFile();
    const user = users.find(
      (item) => item.email === email && item.passwordResetTokenHash === passwordResetTokenHash
    );
    if (!user) return;
    delete user.passwordResetTokenHash;
    delete user.passwordResetExpiresAt;
    await writeUsersToFile(users);
  },

  async resetPassword(passwordResetTokenHash, password) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();

    if (usersCollection) {
      const result = await usersCollection.updateOne(
        {
          passwordResetTokenHash,
          passwordResetExpiresAt: { $gt: now }
        },
        {
          $set: { password: passwordHash, updatedAt: now },
          $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" }
        }
      );
      return result.modifiedCount > 0;
    }

    const users = await readUsersFromFile();
    const user = users.find(
      (item) =>
        item.passwordResetTokenHash === passwordResetTokenHash &&
        Date.parse(item.passwordResetExpiresAt) > Date.parse(now)
    );
    if (!user) return false;
    user.password = passwordHash;
    user.updatedAt = now;
    delete user.passwordResetTokenHash;
    delete user.passwordResetExpiresAt;
    await writeUsersToFile(users);
    return true;
  },

  async ensureAdmin() {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const adminUser = {
      id: "admin-1",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      updatedAt: new Date().toISOString()
    };

    if (usersCollection) {
      await usersCollection.updateOne(
        { email: ADMIN_EMAIL },
        { $set: adminUser },
        { upsert: true }
      );
      return;
    }

    let users = [];
    try {
      users = await readUsersFromFile();
    } catch {
      users = [];
    }

    const index = users.findIndex((u) => u.email === ADMIN_EMAIL);
    if (index === -1) {
      users.push(adminUser);
    } else {
      users[index] = { ...users[index], ...adminUser, updatedAt: new Date().toISOString() };
    }

    await writeUsersToFile(users);
  }
};
