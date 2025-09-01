# Fisher Backflows Platform - Glassmorphism Design System

## Color Scheme Foundation

### Primary Background Colors
```css
/* Main page backgrounds */
bg-black                    /* Primary page background */
bg-slate-900               /* Secondary page background */
bg-slate-800               /* Card/section backgrounds */

/* Glass effects */
bg-black/80                /* Semi-transparent overlays */
bg-slate-900/90            /* Glass card backgrounds */  
bg-slate-800/70            /* Subtle glass overlays */
```

### Text Colors (White Scheme)
```css
/* Primary text colors */
text-white                 /* Primary headings and important text */
text-white/90              /* Secondary text */
text-white/80              /* Tertiary text and labels */
text-white/70              /* Subtle text and placeholders */
```

### Blue Accent System
```css
/* Blue outlines and accents */
border-blue-400            /* Primary borders */
border-blue-500            /* Active/focused borders */
border-blue-300            /* Subtle borders */

/* Blue text accents */
text-blue-400              /* Links and accents */
text-blue-300              /* Secondary blue text */
text-blue-500              /* Active blue text */

/* Blue backgrounds */
bg-blue-500/20             /* Subtle blue tint */
bg-blue-600/30             /* Button backgrounds */
bg-blue-400/10             /* Hover states */
```

### Glow Effects
```css
/* Box shadows for glow */
glow-blue-sm: box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
glow-blue: box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
glow-blue-lg: box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);

/* Ring effects */
ring-blue-400/50           /* Focus rings */
```

## Component Patterns

### Glass Card Pattern
```css
.glass-card {
  background: rgba(15, 23, 42, 0.9); /* bg-slate-900/90 */
  border: 1px solid rgba(59, 130, 246, 0.4); /* border-blue-400 */
  backdrop-filter: blur(12px);
  border-radius: 1rem; /* rounded-xl */
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
}
```

### Glass Header Pattern  
```css
.glass-header {
  background: rgba(0, 0, 0, 0.8); /* bg-black/80 */
  border-bottom: 1px solid rgba(59, 130, 246, 0.4);
  backdrop-filter: blur(16px);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
}
```

### Glass Button Patterns
```css
/* Primary glass button */
.glass-btn-primary {
  background: rgba(59, 130, 246, 0.3); /* bg-blue-500/30 */
  border: 1px solid rgba(59, 130, 246, 0.6);
  color: white;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

/* Secondary glass button */
.glass-btn-secondary {
  background: rgba(30, 41, 59, 0.7); /* bg-slate-800/70 */
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}
```

## Platform Implementation Plan

### 1. Headers (ALL pages)
- Black/dark background with blue borders
- White text throughout
- Consistent logo placement and sizing
- Uniform navigation styling with blue accents
- Glass blur effects

### 2. Main Content Areas
- Black page backgrounds
- Glass cards with slate-900/90 backgrounds
- Blue borders on all containers
- White text throughout
- Consistent spacing and padding

### 3. Forms and Inputs
- Glass input backgrounds
- Blue focused borders  
- White text and placeholders
- Blue glow effects on focus

### 4. Buttons and Actions
- Glass button backgrounds
- Blue borders and glow effects
- White text
- Consistent hover states with increased glow

### 5. Data Display
- Glass table backgrounds
- Blue borders and dividers
- White text throughout
- Blue accent colors for status indicators

## Next Steps
1. Create reusable Tailwind CSS classes for glassmorphism
2. Apply systematically to all 64 pages
3. Ensure complete visual consistency
4. Preserve all existing functionality and data