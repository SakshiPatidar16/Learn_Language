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
