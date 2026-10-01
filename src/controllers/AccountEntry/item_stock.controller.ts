import connection from "../../db";

interface IncreaseItemStockParams {
  item_id: number;
  quantity: number;
}

export const increaseItemStock = async ({
  item_id,
  quantity,
}: IncreaseItemStockParams) => {
  if (!item_id) {
    throw new Error("Item ID is required");
  }

  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  const [result]: any = await connection.execute(
    `
    UPDATE items
    SET available_stock = COALESCE(available_stock, 0) + ?
    WHERE id = ?
    `,
    [quantity, item_id]
  );

  if (result.affectedRows === 0) {
    throw new Error(
      `Item with ID ${item_id} not found`
    );
  }

  return {
    item_id,
    added_quantity: quantity,
  };
};
export const createStockTransaction = async ({
  item_id,
  quantity_change,
  reason,
  related_id,
  notes,
}: {
  item_id: number;
  quantity_change: number;
  reason:
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT";
  related_id?: number;
  notes?: string;
}) => {
  const [result]: any = await connection.execute(
    `
    INSERT INTO stock_transactions (
      item_id,
      quantity_change,
      reason,
      related_id,
      notes
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      item_id,
      quantity_change,
      reason,
      related_id ?? null,
      notes ?? null,
    ]
  );

  return result.insertId;
};
export const createInventoryLedger = async ({
  item_id,
  date,
  type,
  quantity,
  unit_cost,
  reference_id,
}: {
  item_id: number;
  date: string;
  type: "opening_stock" | "purchase" | "sale" | "adjustment";
  quantity: number;
  unit_cost: number;
  reference_id?: number;
}) => {
  const total_value =
    Number(quantity) * Number(unit_cost);

  const [result]: any = await connection.execute(
    `
    INSERT INTO inventory_ledger (
      item_id,
      date,
      type,
      quantity,
      unit_cost,
      total_value,
      reference_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      item_id,
      date,
      type,
      quantity,
      unit_cost,
      total_value,
      reference_id ?? null,
    ]
  );

  return result.insertId;
};
