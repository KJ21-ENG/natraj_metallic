const { readCSV, writeCSV, generateId } = require('./csvService');

// Constants
const CUSTOMERS_FILE = 'customers.csv';

// Get all customers
const getAllCustomers = async () => {
  return await readCSV(CUSTOMERS_FILE);
};

// Get customer by ID
const getCustomerById = async (customerId) => {
  const customers = await getAllCustomers();
  return customers.find(customer => customer.customer_id === customerId);
};

// Get customer by name
const getCustomerByName = async (customerName) => {
  const customers = await getAllCustomers();
  return customers.find(customer => 
    customer.customer_name.toLowerCase() === customerName.toLowerCase()
  );
};

// Create a new customer
const createCustomer = async (customerData) => {
  const customers = await getAllCustomers();
  
  // Check if customer with same name already exists
  const existingCustomer = customers.find(
    c => c.customer_name.toLowerCase() === customerData.customer_name.toLowerCase()
  );
  
  if (existingCustomer) {
    throw new Error(`Customer with name "${customerData.customer_name}" already exists`);
  }
  
  // Generate a new customer ID
  const customerId = await generateId('CUST');
  
  // Create a new customer object
  const newCustomer = {
    customer_id: customerId,
    customer_name: customerData.customer_name,
    contact_person: customerData.contact_person || '',
    contact_number: customerData.contact_number || '',
    address: customerData.address || '',
    email: customerData.email || '',
    notes: customerData.notes || ''
  };
  
  // Add to the array
  customers.push(newCustomer);
  
  // Write back to the file
  await writeCSV(CUSTOMERS_FILE, customers);
  
  return newCustomer;
};

// Update a customer
const updateCustomer = async (customerId, updatedProperties) => {
  const customers = await getAllCustomers();
  
  // Find the customer to update
  const customerIndex = customers.findIndex(customer => customer.customer_id === customerId);
  
  if (customerIndex === -1) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }
  
  // If name is being updated, check for duplicates
  if (updatedProperties.customer_name) {
    const nameExists = customers.some(
      (c, i) => i !== customerIndex && 
      c.customer_name.toLowerCase() === updatedProperties.customer_name.toLowerCase()
    );
    
    if (nameExists) {
      throw new Error(`Customer with name "${updatedProperties.customer_name}" already exists`);
    }
  }
  
  // Update the properties
  customers[customerIndex] = {
    ...customers[customerIndex],
    ...updatedProperties
  };
  
  // Write back to the file
  await writeCSV(CUSTOMERS_FILE, customers);
  
  return customers[customerIndex];
};

// Delete a customer
const deleteCustomer = async (customerId) => {
  const customers = await getAllCustomers();
  
  // Find the customer to delete
  const customerIndex = customers.findIndex(customer => customer.customer_id === customerId);
  
  if (customerIndex === -1) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }
  
  // Remove the customer
  customers.splice(customerIndex, 1);
  
  // Write back to the file
  await writeCSV(CUSTOMERS_FILE, customers);
  
  return true;
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerByName,
  createCustomer,
  updateCustomer,
  deleteCustomer
}; 