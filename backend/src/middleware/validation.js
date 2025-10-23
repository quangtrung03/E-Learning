const mongoose = require('mongoose');

// Middleware để validate MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `ID không hợp lệ: ${id}`
      });
    }
    
    next();
  };
};

// Middleware để validate multiple ObjectIds in params
const validateMultipleObjectIds = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `ID không hợp lệ: ${id} (tham số: ${paramName})`
        });
      }
    }
    
    next();
  };
};

module.exports = {
  validateObjectId,
  validateMultipleObjectIds
};