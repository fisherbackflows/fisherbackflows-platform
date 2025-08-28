const bcrypt = require('bcryptjs');

// Create a known password hash for admin
async function createAdminPassword() {
    const password = 'admin123';
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Test the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash validation:', isValid);
    
    // Test against existing hash
    const existingHash = '$2b$12$iSDWpeuhS8wOhLAfiun1aebJISsjGFU/dAj/kiScx0dpEToRXTTii';
    const existingTest = await bcrypt.compare('admin123', existingHash);
    console.log('Existing hash test with admin123:', existingTest);
    
    // Try common passwords
    const commonPasswords = ['password', 'admin', '123456', 'fisherbackflows'];
    for (const pwd of commonPasswords) {
        const test = await bcrypt.compare(pwd, existingHash);
        console.log(`Testing "${pwd}":`, test);
    }
}

createAdminPassword().catch(console.error);