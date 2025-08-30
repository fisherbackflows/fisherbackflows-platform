/* eslint-disable @typescript-eslint/no-var-requires */
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'password';
  const saltRounds = 12;
  
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log('Hashed password for admin@fisherbackflows.com:', hashedPassword);
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log('Password validation test:', isValid);
}

hashPassword().catch(console.error);