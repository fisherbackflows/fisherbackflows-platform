// Simple SHA-256 hashing that works in all environments
// This is a temporary solution to get production working

export async function hashPassword(password: string): Promise<string> {
  // Add a fixed salt for basic security (not ideal but works everywhere)
  const salt = 'fisherbackflows2024salt';
  const data = password + salt;
  
  // Use Web Crypto API SHA-256 (universally supported)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}