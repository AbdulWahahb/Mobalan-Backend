import { Request, Response, Router } from "express";
import connection from "../../../db";
import { RowDataPacket } from "mysql2";
import { validationResult } from "express-validator";
import { handleDatabaseError } from "../../../middlewares/databaseErrorHandler";
import { cleanRegex } from "zod/v4/core/util.cjs";
interface Customer extends RowDataPacket {
  id: number;
  name: string;
  phone: string;
  age: string;
  created_at: string;
}
const router = Router();
// get data

const modulaName = "Accounts";
// fetch

export const fetchAccountTypes = async (req: Request, res: Response) => {
  try {
    const [accounts] = await connection.execute("SELECT * FROM account_subtypes");
    const [accountTypes] = await connection.execute(
      "SELECT * FROM account_types"
    );
    // Build nested structure
    const formattedAccounts = (accountTypes as any[]).map((type) => {
      // For each account type, find all matching accounts
      const children = (accounts as any[]).filter(
        (acc) => acc.account_type_id === type.id
      );
      // Return parent + its children
      return {
        id: type.id,
        label: type.account_name.trim(),
        value: type.id,
        account_name: type.account_name.trim(),
        account_mode: type.account_mode,
        account_catagory: type.account_catagory,
        account_subtypes: children,
      };
    });

    if (formattedAccounts) {
      res.status(200).json({
        message: `${modulaName} Fetch Successfully`,
        data: formattedAccounts,
      });
    }
  } catch (error) {
    console.log("here is error", error);
    res.status(500).json({ error: `Failed to fetch ${modulaName}` });
  }
};

// // account Types;
export const fetchAccounts = async (req: Request, res: Response) => {
  try {
    const accountName = req.query.filter as string | undefined; // e.g., "Cash"
    if (accountName) {
      if (!accountName) {
        return res.status(400).json({ error: "Account name is required" });
      }

      const [accountTypeResult]: any = await connection.execute(
        `SELECT account_type_id FROM accounts WHERE name = ?`,
        [accountName]
      );

      if (!accountTypeResult || accountTypeResult.length === 0) {
        return res
          .status(404)
          .json({ error: `Account type "${accountName}" not found` });
      }

      const accountTypeId = accountTypeResult[0]?.account_type_id;

      //  Fetch all chart_of_accounts with that account_type
      const [accounts]: any = await connection.execute(
        `SELECT * FROM chart_of_accounts WHERE account_type = ?`,
        [accountTypeId]
      );
      res.status(200).json({
        message: `Accounts for type "${accountName}" fetched successfully`,
        data: accounts,
      });
    } else {
      const [accounts]: any = await connection.execute(
        `SELECT * FROM chart_of_accounts`
      );
      res.status(200).json({
        message: `Accounts for type "${accountName}" fetched successfully`,
        data: accounts,
      });
    }
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ error: `Failed to fetch ${modulaName}` });
  }
};

// SHOW
export const fetchAccount = async (
  req: Request,
  res: Response
) => {

  const account_id =
    Number(req.params.id);

  if (
    !account_id ||
    isNaN(account_id)
  ) {
    return res.status(400)
      .json({
        error:
          "Invalid Account ID"
      });
  }

  try {

    const [accounts]: any =
      await connection.execute(
        `
      SELECT *
      FROM chart_of_accounts
      WHERE id=?
      `,
        [account_id]
      );


    if (!accounts.length) {
      return res.status(404)
        .json({
          message:
            `${modulaName} not found`
        });
    }


    const account =
      accounts[0];


    const [subtype]: any =
      await connection.execute(
        `
      SELECT *
      FROM account_subtypes
      WHERE id=?
      `,
        [account.subtype_id]
      );


    const [transactions]: any =
      await connection.execute(

        `
      SELECT

      jl.id,
      jl.debit,
      jl.credit,

      je.date,
      je.reference,
      je.description

      FROM journal_lines jl

      INNER JOIN journal_entries je
      ON je.id=
      jl.journal_entry_id

      WHERE jl.account_id=?

      ORDER BY je.date DESC
      `,

        [account_id]
      );


    const totalDebit =
      transactions.reduce(
        (
          sum: number,
          item: any
        ) =>

          sum +
          Number(item.debit),

        0
      );



    const totalCredit =
      transactions.reduce(
        (
          sum: number,
          item: any
        ) =>

          sum +
          Number(item.credit),

        0
      );


    res.status(200).json({

      message:
        `${modulaName} Fetch successfully`,

      data: {

        ...account,

        subtype:
          subtype[0] || null,

        transactions,

        totals: {

          debit:
            totalDebit,

          credit:
            totalCredit
        }
      }

    });

  } catch (error) {

    const errorResponse =
      handleDatabaseError(error);

    return res.status(
      errorResponse.statusCode
    ).json({

      success: false,

      message:
        `Failed to fetch ${modulaName}`,

      error:
        errorResponse.error,
    });

  }

};
//fetc custome account 
export const fetchCustomAccounts = async (
  req: Request,
  res: Response
) => {
  try {
    const { types } = req.query;

    console.log('Here is req.querey=====>,', types)
    let query = `
      SELECT
        coa.*,
        ast.name AS subtype_name
      FROM chart_of_accounts coa
      INNER JOIN account_subtypes ast
        ON ast.id = coa.subtype_id
    `;

    const params: any[] = [];

    if (types) {
      const requestedTypes = String(types)
        .split(",")
        .map((type) => type.trim().toLowerCase())
        .filter(Boolean);

      const conditions: string[] = [];

      for (const type of requestedTypes) {
        switch (type) {
          case "expense":
            conditions.push(`
              ast.account_type_id = 2000
            `);
            break;
          case "cogs":
            conditions.push(`
              ast.account_type_id = 7000
            `);
            break;

          case "asset":
            conditions.push(`
              ast.account_type_id = 1000
            `);
            break;

          case "Drawing":
            conditions.push(`
              ast.account_type_id = 3000
            `);
            break;

          case "equity":
            conditions.push(`
              ast.account_type_id = 5000
            `);
            break;

          case "Liability":
            conditions.push(`
              ast.account_type_id = 4000
            `);
            break;

          case "Revenue":
            conditions.push(`
              ast.account_type_id = 6000
            `);
            break;

        }
      }

      if (conditions.length > 0) {
        query += `
          WHERE ${conditions.join(" OR ")}
        `;
      }
    }

    query += `
      ORDER BY coa.id DESC
    `;

    const [accounts]: any =
      await connection.execute(
        query,
        params
      );

    return res.status(200).json({
      success: true,
      message: `${modulaName}s fetched successfully`,
      data: accounts,
    });

  } catch (error) {
    console.error(
      "FETCH ACCOUNTS ERROR:",
      error
    );

    const errorResponse =
      handleDatabaseError(error);

    return res.status(
      errorResponse.statusCode
    ).json({
      success: false,
      message: `Failed to fetch ${modulaName}s`,
      error: errorResponse.error,
    });
  }
};
// Fetch account subtypes with their Chart of Accounts accounts
export const fetchCustomSubAccounts = async (
  req: Request,
  res: Response
) => {
  try {
    const { types } = req.query;

    if (!types) {
      return res.status(400).json({
        success: false,
        message: "Account subtypes are required",
      });
    }

    const requestedTypes = String(types)
      .split(",")
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean);

    if (requestedTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid account subtypes provided",
      });
    }

    const placeholders = requestedTypes
      .map(() => "?")
      .join(",");

    /*
     * First get the requested account subtypes
     * together with their Chart of Accounts records.
     */
    const query = `
      SELECT
        ast.*,
        coa.id AS account_id,
        coa.account_name AS account_name,
        coa.subtype_id AS account_subtype_id
      FROM account_subtypes ast
      LEFT JOIN chart_of_accounts coa
        ON coa.subtype_id = ast.id
      WHERE LOWER(ast.name) IN (${placeholders})
      ORDER BY ast.id DESC, coa.id DESC
    `;

    const [rows]: any =
      await connection.execute(
        query,
        requestedTypes
      );

    /*
     * Group Chart of Accounts records
     * under their account subtype.
     */
    const grouped = rows.reduce(
      (result: any[], row: any) => {
        let subtype = result.find(
          (item) => item.id === row.id
        );

        if (!subtype) {
          subtype = {
            id: row.id,
            name: row.name,
            account: [],
          };

          result.push(subtype);
        }

        if (row.account_id) {
          subtype.account.push({
            id: row.account_id,
            name: row.account_name,
            subtype_id: row.account_subtype_id,
          });
        }

        return result;
      },
      []
    );

    return res.status(200).json({
      success: true,
      message: "Custom sub accounts fetched successfully",
      data: grouped,
    });

  } catch (error) {
    console.error(
      "FETCH CUSTOM SUB ACCOUNTS ERROR:",
      error
    );

    const errorResponse =
      handleDatabaseError(error);

    return res.status(
      errorResponse.statusCode
    ).json({
      success: false,
      message: "Failed to fetch custom sub accounts",
      error: errorResponse.error,
    });
  }
};
// CREATE
export const createAccount = async (
  req: Request,
  res: Response
) => {

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    return res.status(422).json({
      success: false,
      status: 422,
      message: "Validation error",
      errors: validation.array(),
    });
  }

  try {

    const {
      account_code,
      account_name,
      subtype_id,
      normal_balance,
      description,
      current_balance,
      is_active,
    } = req.body;


    // get account type from subtype
    const [subTypeRows]: any =
      await connection.execute(
        `
        SELECT account_type_id
        FROM account_subtypes
        WHERE id=?
        `,
        [subtype_id]
      );


    if (!subTypeRows.length) {
      return res.status(404).json({
        success: false,
        message: "Invalid subtype_id"
      });
    }


    const account_type =
      subTypeRows[0].account_type_id;


    const [result]: any =
      await connection.execute(

        `
        INSERT INTO chart_of_accounts
        (
          account_code,
          account_name,
          account_type,
          subtype_id,
          normal_balance,
          description,
          current_balance,
          is_active
        )

        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
        `,

        [
          account_code,
          account_name,
          account_type,
          subtype_id,
          normal_balance,
          description || null,
          current_balance || 0,
          is_active ?? 1
        ]
      );


    return res.status(200).json({
      success: true,
      status: 200,
      message: `${modulaName} created successfully`,
      data: {
        id: result.insertId
      }
    });

  } catch (err: any) {

    console.error(
      "Database error:",
      err
    );

    const errorResponse =
      handleDatabaseError(err);

    return res.status(
      errorResponse.statusCode
    ).json({

      success: false,

      status:
        errorResponse.statusCode,

      message:
        errorResponse.message,

      error:
        errorResponse.error,
    });
  }
};

// DELETE
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const account_id = parseInt(req.params.id); // Explicitly parse as integer

    if (!account_id || isNaN(account_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the todo exists
    const [existing]: any = await connection.execute(
      "SELECT id FROM chart_of_accounts WHERE id = ?",
      [account_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    // Then proceed with deletion
    const [result]: any = await connection.execute(
      "DELETE FROM chart_of_accounts WHERE id = ?",
      [account_id]
    );

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: account_id,
      status: 200,
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    console.error("Delete error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// BULK DELETE
export const deleteBulkAccount = async (req: Request, res: Response) => {
  try {
    const { accountIdes } = req.body[0]; // Explicitly parse as integer
    if (!accountIdes) {
      return res
        .status(404)
        .json({ error: `${modulaName} No Account Selected` });
    }
    // Then proceed with deletion
    for (let i = 0; i < accountIdes.length; i++) {
      const element = accountIdes[i];
      const [result]: any = await connection.execute(
        "DELETE FROM chart_of_accounts WHERE id = ?",
        [element]
      );
    }

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: accountIdes,
      status: 200,
      // affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    console.error("Delete error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// CHANGE BULK STATUS
export const changeBulkStatus = async (req: Request, res: Response) => {
  try {
    const { accountsId, status } = req.body;
    if (accountsId?.length == 0) {
      return res.status(404).json({ error: "No Account Is Selected" });
    }
    for (let i = 0; i < accountsId.length; i++) {
      const element = accountsId[i];
      const [result]: any = await connection.execute(
        "UPDATE chart_of_accounts SET  is_active = ? WHERE id = ?",
        [status, element]
      );
    }
    res.status(201).json({
      message: `${modulaName} Status Sucssufully Changed to `,
      status: 200,
      data: accountsId,
    });
    // Fetch the updated todo to return it
  } catch (error) {
    console.error("Delete error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// UPDATE
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const {
      account_code,
      account_name,
      account_type,
      normal_balance,
      description,
      current_balance,
      is_active,
    } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      "UPDATE chart_of_accounts SET account_code = ?, account_name = ?, account_type = ? ,normal_balance = ? , description = ?, current_balance = ?, is_active = ? WHERE id = ?",
      [
        account_code,
        account_name,
        account_type,
        normal_balance,
        description,
        current_balance,
        is_active,
        id,
      ]
    );
    // Check if any row was actually updated;
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Fetch the updated todo to return it
    const [updateAccount]: any = await connection.execute(
      "SELECT * FROM chart_of_accounts WHERE id = ?",
      [id]
    );
    res.status(200).json({
      message: `${modulaName} updated successfully`,
      data: updateAccount[0],
      status: 200,
    });
  } catch (error) {
    console.error("Delete error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
export default router;
