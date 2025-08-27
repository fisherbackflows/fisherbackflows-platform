import React, { useEffect } from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

// Logo integrity validation function
async function assertLogoIntegrity(dataUri: string, expectedSha256Hex: string) {
  try {
    const b64 = dataUri.split(",")[1];
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const hash = await crypto.subtle.digest("SHA-256", raw);
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    
    if (hex !== expectedSha256Hex) {
      console.warn("Logo hash mismatch — possible alteration.", { expectedSha256Hex, hex });
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Logo integrity check failed:", error);
    return false;
  }
}

export default function Logo({ 
  className = "", 
  width, 
  height,
  priority = false 
}: LogoProps) {
  const DATA_URI = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJ3YXRlckdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzNiODJmNiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzFkNGVkOCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxZTQwYWYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJnbG93Ij4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMiIgcmVzdWx0PSJjb2xvcmVkQmx1ciIvPgogICAgICA8ZmVNZXJnZT4gCiAgICAgICAgPGZlTWVyZ2VOb2RlIGluPSJjb2xvcmVkQmx1ciIvPgogICAgICAgIDxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPgogICAgICA8L2ZlTWVyZ2U+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgCiAgPCEtLSBXYXRlciBkcm9wbGV0IGljb24gLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOCw4KSI+CiAgICA8cGF0aCBkPSJNMjIgNEMyMiA0IDEwIDE2IDEwIDI4QzEwIDM0LjYyNyAxNS4zNzMgNDAgMjIgNDBDMjguNjI3IDQwIDM0IDM0LjYyNyAzNCAyOEMzNCAxNiAyMiA0IDIyIDRaIiAKICAgICAgICAgIGZpbGw9InVybCgjd2F0ZXJHcmFkaWVudCkiIGZpbHRlcj0idXJsKCNnbG93KSIvPgogICAgPGVsbGlwc2UgY3g9IjE4IiBjeT0iMjQiIHJ4PSI0IiByeT0iNiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPgogICAgPHJlY3QgeD0iMjAiIHk9IjQwIiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ1cmwoI3dhdGVyR3JhZGllbnQpIi8+CiAgPC9nPgogIAogIDwhLS0gQ29tcGFueSB0ZXh0IC0tPgogIDx0ZXh0IHg9IjUwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFlNDBhZiI+RmlzaGVyPC90ZXh0PgogIDx0ZXh0IHg9IjUwIiB5PSI0MiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0ibm9ybWFsIiBmaWxsPSIjNjQ3NDhiIj5CYWNrZmxvd3M8L3RleHQ+Cjwvc3ZnPg==";
  const W = 200;  // natural pixel width
  const H = 60;   // natural pixel height
  const EXPECTED_SHA256 = "a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789a";  // will be calculated
  
  // Validate logo integrity on mount (only in production or when logo is set)
  useEffect(() => {
    if (DATA_URI !== "data:image/png;base64,PASTE_YOUR_EXACT_BASE64_LOGO_HERE" && 
        EXPECTED_SHA256 !== "PASTE_EXPECTED_SHA256_HEX") {
      assertLogoIntegrity(DATA_URI, EXPECTED_SHA256);
    }
  }, []);
  
  // Use provided dimensions or fall back to natural dimensions
  const displayWidth = width || W;
  const displayHeight = height || H;
  
  // If no logo is provided, show text fallback with water theme
  if (DATA_URI === "data:image/png;base64,PASTE_YOUR_EXACT_BASE64_LOGO_HERE") {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="relative">
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none"
            className="glow-blue-sm"
          >
            {/* Water droplet shape */}
            <path 
              d="M16 2C16 2 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 2 16 2Z" 
              fill="currentColor"
              className="text-blue-400"
            />
            {/* Inner highlight */}
            <ellipse 
              cx="13" 
              cy="16" 
              rx="3" 
              ry="4" 
              fill="currentColor"
              className="text-white/20"
            />
            {/* Pipe connection */}
            <rect 
              x="14" 
              y="26" 
              width="4" 
              height="4" 
              fill="currentColor"
              className="text-blue-400"
            />
          </svg>
          {/* Pulsing animation */}
          <div className="absolute inset-0 animate-ping opacity-30">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 32 32" 
              fill="none"
            >
              <path 
                d="M16 2C16 2 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 2 16 2Z" 
                fill="currentColor"
                className="text-blue-400"
              />
            </svg>
          </div>
        </div>
        <div className="text-xl font-bold">
          <span className="gradient-text">Fisher Backflows</span>
        </div>
      </div>
    );
  }

  return (
    <img
      alt="Fisher Backflows"
      width={displayWidth}
      height={displayHeight}
      decoding="sync"
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      className={`max-w-full h-auto w-auto ${className}`}
      style={{
        display: "block",
        maxWidth: "100%",
        height: "auto",
        imageRendering: "auto",
        objectFit: "contain",
        objectPosition: "left top",
        WebkitUserDrag: "none",
        userSelect: "none",
      }}
      src={DATA_URI}
    />
  );
}