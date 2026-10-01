import { Request, Response, Router } from "express";
import connection from "../../db";
import { handleDatabaseError } from "../../middlewares/databaseErrorHandler";
import { body, validationResult } from "express-validator";
import { cleanRegex } from "zod/v4/core/util.cjs";
import { createInventoryLedger, createStockTransaction, increaseItemStock } from "../AccountEntry/item_stock.controller";
import { createJournalEntry } from "../AccountEntry/journal_entries.controller";
import { calculateBillAmounts } from "./purchase_helper.controller";

const router = Router();
const modulaName = "bill";
const tableName = "bills";

// FETCH ALL
export const fetchBills = async (req: Request, res: Response) => {
  try {
    const [bills]: any = await connection.execute(
      `SELECT * FROM ${tableName}`
    );

    const [items]: any = await connection.execute(
      `SELECT * FROM bill_items`
    );

    // Get all unique vendor IDs from bills
    const vendorIds = [
      ...new Set(
        bills
          .map((bill: any) => bill.vendor_id)
          .filter(
            (id: any) => id !== null && id !== undefined
          )
      ),
    ];

    let vendors: any[] = [];

    // Fetch all vendors used by bills
    if (vendorIds.length > 0) {
      const placeholders = vendorIds.map(() => "?").join(",");

      const [vendorRows]: any = await connection.execute(
        `SELECT * FROM vendors WHERE id IN (${placeholders})`,
        vendorIds
      );

      vendors = vendorRows;
    }

    // Create vendor lookup map
    const vendorsMap = new Map(
      vendors.map((vendor: any) => [
        vendor.id,
        {
          id: vendor.id,
          name: vendor.display_name,
        },
      ])
    );

    // Build bills response
    const billsMap = bills.map((bill: any) => {
      const { vendor_id, ...billWithoutVendorId } = bill;

      const billItems = items.filter(
        (item: any) => item.bill_id === bill.id
      );

      const amount = billItems.reduce(
        (total: number, item: any) => {
          return (
            total +
            Number(item.quantity || 0) *
            Number(item.rate_value || 0)
          );
        },
        0
      );

      return {
        ...billWithoutVendorId,

        vendor: vendorsMap.get(vendor_id) || null,

        amount,

        items: billItems,
      };
    });


    res.status(200).json({
      message: `${modulaName}s fetched successfully`,
      data: billsMap,
    });
  } catch (error) {
    const errorResponse =
      handleDatabaseError(error);

    res
      .status(errorResponse.statusCode)
      .json(errorResponse);
  }
};
// // FETCH ONE
export const fetchBill = async (req: Request, res: Response) => {
  const bill_id = Number(req.params.id);

  if (!bill_id || isNaN(bill_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }
  try {
    const [bill]: any = await connection.execute(
      "SELECT * FROM bills WHERE id = ?",
      [bill_id]
    );
    if (bill.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    const [bill_items]: any = await connection.execute(
      "SELECT * FROM bill_items WHERE bill_id = ?",
      [bill_id]
    );

    const [vendor]: any = await connection.execute(
      "SELECT * FROM vendors WHERE `id` = ?",
      [bill[0]?.vendor_id]
    );

    // Get all unique vendor IDs from bills
    const bill_items_ides = [
      ...new Set(
        bill_items
          .map((bill: any) => bill.item_id)
          .filter(
            (id: any) => id !== null && id !== undefined
          )
      ),
    ];

    let items: any[] = [];

    // Fetch all vendors used by bills
    if (bill_items_ides.length > 0) {
      const placeholders = bill_items_ides.map(() => "?").join(",");

      const [itemRows]: any = await connection.execute(
        `SELECT * FROM items WHERE id IN (${placeholders})`,
        bill_items_ides
      );

      items = itemRows;
    }

    // Create vendor lookup map
    const itemMaps = new Map(
      items.map((item: any) => [
        item.id,
        {
          id: item.id,
          name: item.item_name,
        },
      ])
    );
    const formattedBillItems = bill_items.map((opt: { quantity: number; rate_value: number; item_id: number; }) => ({ ...opt, item: itemMaps.get(opt.item_id), amount: Number(opt.quantity) * Number(opt.rate_value), }));
    const payload = {
      ...bill[0],
      vendor: vendor[0],
      bill_items: formattedBillItems
    }
    delete payload.vendor_id
    res.status(200).json({
      message: `${modulaName} fetched successfully`,
      data: payload
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};

// // CREATE
// CREATE
// CREATE
export const createBill = async (
  req: Request,
  res: Response
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  const {
    vendor_id,
    bill_number,
    bill_date,
    due_date,
    tax_amount,
    discount_amount,
    discount_type,
    notes,
    status,
    items,
  } = req.body;

  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    // -----------------------------------------
    // 1. Calculate Bill Amounts
    // -----------------------------------------

    const {
      totalAmount,
      netAmount,
    } = calculateBillAmounts(items || []);

    // -----------------------------------------
    // 2. Insert Main Bill
    // -----------------------------------------

    const [result]: any = await conn.execute(
      `INSERT INTO bills(
  vendor_id,
  bill_number,
  bill_date,
  due_date,
  total_amount,
  tax_amount,
  discount_amount,
  discount_type,
  net_amount,
  notes,
  status
)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor_id ?? null,
        bill_number ?? null,
        bill_date ?? null,
        due_date ?? null,

        // Calculated by Backend
        totalAmount,

        tax_amount ?? 0,
        discount_amount ?? 0,
        discount_type ?? null,

        // Calculated by Backend
        netAmount,

        notes ?? null,
        status ?? "Draft",
      ]
    );

    const bill_id = result.insertId;

    // -----------------------------------------
    // 3. Insert Bill Items
    // -----------------------------------------

    if (items && items.length > 0) {
      for (const item of items) {
        await conn.execute(
          `INSERT INTO bill_items(
  item_id,
  bill_id,
  description,
  quantity,
  rate_value
)
VALUES(?, ?, ?, ?, ?)`,
          [
            item.item_id ?? null,
            bill_id,
            item.description ?? "No description",
            item.quantity_value ?? 0,
            item.rate_value ?? 0,
          ]
        );
      }
    }

    // -----------------------------------------
    // 4. Commit Transaction
    // -----------------------------------------

    await conn.commit();

    // -----------------------------------------
    // 5. Response
    // -----------------------------------------

    return res.status(201).json({
      message: "Bill created successfully",
      id: bill_id,

      // Return calculated amounts
      data: {
        total_amount: totalAmount,
        net_amount: netAmount,
      },
    });

  } catch (err) {

    console.log(
      "CREATE BILL ERROR:",
      err
    );

    await conn.rollback();

    const errorResponse =
      handleDatabaseError(err);

    return res
      .status(errorResponse.statusCode)
      .json(errorResponse);

  } finally {

    conn.release();

  }
};

// UPDATE
export const updateBill = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const {
    vendor_id,
    bill_number,
    bill_date,
    due_date,
    total_amount,
    tax_amount,
    discount_amount,
    discount_type,
    net_amount,
    notes,
    status,
    items,
  } = req.body;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    // Update bill
    const [result]: any = await conn.execute(
      `UPDATE bills
       SET vendor_id=?, bill_number=?, bill_date=?, due_date=?, 
           total_amount=?, tax_amount=?, discount_amount=?, 
           discount_type=?, net_amount=?, notes=?, status=?
       WHERE id=?`,
      [
        vendor_id ?? null,
        bill_number ?? null,
        bill_date ?? null,
        due_date ?? null,
        total_amount ?? 0,
        tax_amount ?? 0,
        discount_amount ?? 0,
        discount_type ?? null,
        net_amount ?? null,
        notes ?? null,
        status ?? "draft",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `Bill not found` });
    }

    // Delete old items & insert new ones
    await conn.execute("DELETE FROM bill_items WHERE bill_id = ?", [id]);

    if (items && items.length > 0) {
      for (const item of items) {
        await conn.execute(
          `INSERT INTO bill_items (
             item_id, bill_id, description, quantity, rate_value
           )
           VALUES (?, ?, ?, ?, ?)`,
          [
            item.item_id ?? null,
            id,
            item.description ?? "No description",
            item.quantity_value ?? 0,
            item.rate_value ?? 0,
          ]
        );
      }
    }

    await conn.commit();

    res.status(200).json({
      message: `Bill updated successfully`,
      id,
    });
  } catch (error) {
    await conn.rollback();
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  } finally {
    conn.release();
  }
};
// UPDATE BILL STATUS / APPROVE BILL

export const updateBillStatus = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "Draft",
    "Open",
    "Partial",
    "Paid",
    "Overdue",
    "Cancelled",
  ];

  // Connection must be outside try
  // so catch and finally can access it
  const conn = await connection.getConnection();

  try {
    // -----------------------------------------
    // 1. Validate status
    // -----------------------------------------

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill status",
        validStatuses,
      });
    }

    // -----------------------------------------
    // 2. Start Transaction
    // -----------------------------------------

    await conn.beginTransaction();

    // -----------------------------------------
    // 3. Get Bill
    // -----------------------------------------

    const [bills]: any = await conn.execute(
      `
      SELECT *
      FROM bills
      WHERE id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (bills.length === 0) {
      await conn.rollback();

      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    const bill = bills[0];

    // -----------------------------------------
    // 4. Prevent duplicate approval
    // -----------------------------------------

    if (
      bill.status !== "Draft" &&
      status === "Pending"
    ) {
      await conn.rollback();

      return res.status(400).json({
        success: false,
        message: `Bill cannot be approved because current status is ${bill.status}`,
      });
    }

    // -----------------------------------------
    // 5. Draft → Pending
    // -----------------------------------------

    if (
      bill.status === "Draft" &&
      status === "Pending"
    ) {
      const [billItems]: any = await conn.execute(
        `
        SELECT *
        FROM bill_items
        WHERE bill_id = ?
        `,
        [id]
      );

      if (billItems.length === 0) {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Cannot approve a bill without items",
        });
      }

      // -----------------------------------------
      // Process Bill Items
      // -----------------------------------------

      for (const item of billItems) {
        if (!item.item_id) {
          continue;
        }

        // 1. Increase Available Stock
        await increaseItemStock({
          conn,
          item_id: item.item_id,
          quantity: item.quantity,
        });

        // 2. Stock Transaction
        await createStockTransaction({
          conn,
          item_id: item.item_id,
          quantity_change: item.quantity,
          reason: "PURCHASE",
          related_id: Number(id),
          notes: `Stock received from Bill #${bill.bill_number}`,
        });

        // 3. Get Item
        const [items]: any = await conn.execute(
          `
          SELECT cost_price
          FROM items
          WHERE id = ?
          `,
          [item.item_id]
        );

        if (items.length === 0) {
          throw new Error(
            `Item ${item.item_id} not found`
          );
        }

        const unitCost =
          Number(item.rate_value || 0);

        // 4. Inventory Ledger
        await createInventoryLedger({
          conn,
          item_id: item.item_id,
          date: bill.bill_date,
          type: "purchase",
          quantity: item.quantity,
          unit_cost: unitCost,
          reference_id: Number(id),
        });
      }

      // -----------------------------------------
      // 6. Create Journal Entry
      // -----------------------------------------

      const totalAmount =
        Number(bill.net_amount || 0);

      if (totalAmount > 0) {
        const INVENTORY_ACCOUNT = 1060;
        const ACCOUNTS_PAYABLE = 1062;

        await createJournalEntry({
          conn,

          date: bill.bill_date,

          reference: `bill-${bill.id}`,

          description:
            `Purchase Bill #${bill.bill_number}`,

          created_by:
            bill.created_by || 1,

          lines: [
            {
              account_id:
                INVENTORY_ACCOUNT,

              debit: totalAmount,
              credit: 0,
            },
            {
              account_id:
                ACCOUNTS_PAYABLE,

              debit: 0,
              credit: totalAmount,
            },
          ],
        });
      }
    }

    // -----------------------------------------
    // 7. Update Bill Status
    // -----------------------------------------

    await conn.execute(
      `
      UPDATE bills
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    // -----------------------------------------
    // 8. Commit
    // -----------------------------------------

    await conn.commit();

    return res.status(200).json({
      success: true,
      message:
        "Bill status updated successfully",

      data: {
        id: bill.id,
        previous_status: bill.status,
        status,
      },
    });

  } catch (error) {

    console.log(
      "UPDATE BILL STATUS ERROR:",
      error
    );

    await conn.rollback();

    const errorResponse =
      handleDatabaseError(error);

    return res
      .status(errorResponse.statusCode)
      .json(errorResponse);

  } finally {

    conn.release();

  }
};
// DELETE
export const deleteBill = async (req: Request, res: Response) => {
  const bill_id = Number(req.params.id);

  if (!bill_id || isNaN(bill_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    const [existing]: any = await conn.execute(
      "SELECT * FROM bills WHERE id = ?",
      [bill_id]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    await conn.execute("DELETE FROM bill_items WHERE bill_id = ?", [
      bill_id,
    ]);
    const [result]: any = await conn.execute(
      "DELETE FROM bills WHERE id = ?",
      [bill_id]
    );

    await conn.commit();

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: bill_id,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    await conn.rollback();
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  } finally {
    conn.release();
  }
};

export default router;
