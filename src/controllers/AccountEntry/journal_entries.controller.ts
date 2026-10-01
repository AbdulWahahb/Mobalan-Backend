import { Request, Response, Router } from "express";
const router = Router();
// get data
const modulaName = "journal_entries";
// INsert Journal Entry
import connection from "../../db";

export const createJournalEntry = async ({
  conn = connection,
  date,
  reference,
  description,
  created_by,
  lines,
}: any) => {
  // 1. Insert Journal Entry Header
  const [entryResult]: any = await conn.execute(
    `
    INSERT INTO journal_entries
    (
      date,
      reference,
      description,
      created_by
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      date,
      reference,
      description,
      created_by,
    ]
  );

  const journal_entry_id =
    entryResult.insertId;

  // 2. Insert Journal Lines
  for (const line of lines) {
    await conn.execute(
      `
      INSERT INTO journal_lines
      (
        journal_entry_id,
        account_id,
        item_id,
        debit,
        credit
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        journal_entry_id,
        line.account_id,
        line.item_id || null,
        line.debit || 0,
        line.credit || 0,
      ]
    );
  }

  return journal_entry_id;
};
export default router;
