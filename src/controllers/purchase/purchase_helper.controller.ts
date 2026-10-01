export const calculateBillAmounts = (items: any[]) => {
  const totalAmount = (items || []).reduce(
    (total: number, item: any) => {
      const quantity = Number(item.quantity_value || 0);
      const rate = Number(item.rate_value || 0);

      return total + quantity * rate;
    },
    0
  );

  return {
    totalAmount,
    netAmount: totalAmount,
  };
};
