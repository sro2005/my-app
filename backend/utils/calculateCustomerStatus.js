const calculateCustomerStatus = (lastActivityDate) => {
    const currentDate = new Date();
    const differenceInDays = (currentDate - lastActivityDate) / (1000 * 3600 * 24);
    return differenceInDays <= 30 ? 'Active' : 'Inactive';
  };
  
module.exports = { calculateCustomerStatus };