export const createAccountValidationSchema: any = {
  account_code: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Account code is required",
    },
    isAlphanumeric: {
      errorMessage: "Account code must be alphanumeric",
    },
    isLength: {
      options: { min: 3, max: 20 },
      errorMessage: "Account code must be between 3-20 characters",
    },
  },
  account_name: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Account name is required",
    },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Account name must be between 2-100 characters",
    },
  },
  account_type: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Account type is required",
    },
    // isIn: {
    //   options: [["asset", "liability", "equity", "revenue", "expense"]],
    //   errorMessage:
    //     "Account type must be one of: asset, liability, equity, revenue, expense",
    // },
  },
  normal_balance: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Normal balance is required",
    },
    isIn: {
      options: [["debit", "credit"]],
      errorMessage: "Normal balance must be either debit or credit",
    },
  },
  description: {
    in: ["body"],
    optional: true,
    isLength: {
      options: { max: 255 },
      errorMessage: "Description cannot exceed 255 characters",
    },
  },
  current_balance: {
    in: ["body"],
    optional: true,
    isDecimal: {
      options: {
        decimal_digits: "0,2",
        force_decimal: false,
      },
      errorMessage: "Current balance must be a valid decimal number",
    },
    custom: {
      options: (value:any) => {
        if (value < 0) {
          throw new Error("Current balance cannot be negative");
        }
        return true;
      },
    },
  },
  is_active: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "is_active must be a boolean value",
    },
  },
};
export const createItemValidationSchema: any = {
  item_name: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Item  is required",
    },
    isLength: {
      options: { min: 3, max: 500 },
      errorMessage: "Item Name  must be between 3-20 characters",
    },
  },
  cost_price: {
    in: ["body"],
    isDecimal: {
      options: {
        decimal_digits: "0,2",
        force_decimal: false,
      },
      errorMessage: "Cost Price must be a valid decimal number",
    },
  },
  selling_price: {
    in: ["body"],
    isDecimal: {
      options: {
        decimal_digits: "0,2",
        force_decimal: false,
      },
      errorMessage: "selling Price must be a valid decimal number",
    },
  },
  unite_id: {
    notEmpty: {
      errorMessage: "Unite Id is required ",
    },
  },
};
export const changeStatusValidationSchema: any = {
  status: {
    in: ["body"],
    notEmpty: {
      errorMessage: "status is required",
    },
  },
};
export const createUniteValidationSchema: any = {
  unite_name: {
    in: ["body"],
    notEmpty: {
      errorMessage: "unite_name is required",
    },
  },
};
export const createCustomerValidationSchema: any = {
  display_name: {
    in: ["body"],
    notEmpty: {
      errorMessage: "unite_name is required",
    },
  },
};
