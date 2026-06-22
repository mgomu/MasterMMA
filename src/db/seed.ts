import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) throw new Error("Uso: tsx src/db/seed.ts <email> <password> [name]");
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, passwordHash, name: name ?? "Admin" });
  console.log("Admin creado:", email);
}
main().then(() => process.exit(0));
