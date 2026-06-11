import { getDb } from "../api/queries/connection";

async function fix() {
  const db = getDb();
  try {
    await db.execute("DROP TABLE IF EXISTS `communications`");
    await db.execute("DROP TABLE IF EXISTS `debt_notes`");
    await db.execute("DROP TABLE IF EXISTS `debt_cases`");
    await db.execute("DROP TABLE IF EXISTS `family_members`");
    await db.execute("DROP TABLE IF EXISTS `custom_categories`");
    await db.execute("DROP TABLE IF EXISTS `budgets`");
    await db.execute("DROP TABLE IF EXISTS `finance_entries`");
    await db.execute("DROP TABLE IF EXISTS `inbox_items`");
    await db.execute("DROP TABLE IF EXISTS `tasks`");
    await db.execute("DROP TABLE IF EXISTS `documents`");
    await db.execute("DROP TABLE IF EXISTS `user_settings`");
    console.log("All synapse tables dropped");
  } catch (e) {
    console.error("Error:", e);
  }
}

fix();
