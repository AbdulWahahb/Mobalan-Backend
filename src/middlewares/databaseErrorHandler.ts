export const handleDatabaseError = (err: any) => {
  if (err.code === "ER_DUP_ENTRY") {
    const duplicateValueMatch = err.sqlMessage.match(
      /Duplicate entry '(.*?)' for key/
    );
    const duplicateValue = duplicateValueMatch
      ? duplicateValueMatch[1]
      : "unknown";

    let fieldName = "unknown";
    if (err.sqlMessage.includes("account_code")) fieldName = "account_code";

    const message = `The ${fieldName} '${duplicateValue}' already exists`;

    return {
      statusCode: 409,
      success: false,
      message,
      error: {
        type: "DUPLICATE_ENTRY",
        field: fieldName,
        value: duplicateValue,
        message,
      },
    };
  }

  return {
    statusCode: 500,
    success: false,
    message: "An unexpected database error occurred",
    error: {
      type: "DATABASE_ERROR",
      message: "An unexpected database error occurred",
    },
  };
};
