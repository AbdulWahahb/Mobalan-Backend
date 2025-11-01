// utils/databaseErrorHandler.js
export const handleDatabaseError = (err:any) => {
    if (err.code === 'ER_DUP_ENTRY') {
      const duplicateValueMatch = err.sqlMessage.match(/Duplicate entry '(.*?)' for key/);
      const duplicateValue = duplicateValueMatch ? duplicateValueMatch[1] : 'unknown';
      
      let fieldName = 'unknown';
      if (err.sqlMessage.includes('account_code')) fieldName = 'account_code';
      // Add more field checks as needed
      
      return {
        statusCode: 409,
        error: {
          type: "DUPLICATE_ENTRY",
          field: fieldName,
          value: duplicateValue,
          message: `The ${fieldName} '${duplicateValue}' already exists`
        }
      };
    }
    
    // Handle other error types...
    
    return {
      statusCode: 500,
      error: {
        type: "DATABASE_ERROR",
        message: "An unexpected database error occurred"
      }
    };
  };
  
