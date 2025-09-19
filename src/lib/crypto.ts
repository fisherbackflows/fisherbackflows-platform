// Web Crypto API-based password hashing for serverless compatibility
// This replaces bcryptjs which has issues in Edge Runtime/Serverless Functions

export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Create password buffer
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Convert to base64
  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Decode base64 hash
    const combined = new Uint8Array(
      atob(hash).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract salt (first 16 bytes) and stored hash (remaining bytes)
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // Create password buffer
    const passwordBuffer = new TextEncoder().encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    // Derive key using same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const hashArray = new Uint8Array(derivedBits);
    
    // Compare hashes in constant time
    if (hashArray.length !== storedHash.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < hashArray.length; i++) {
      result |= hashArray[i] ^ storedHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}