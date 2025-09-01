export const glass = {
  container: 'min-h-screen bg-black',
  card: 'bg-black/40 backdrop-blur-xl border-2 border-blue-500/50 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.5)]',
  panel: 'bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-2xl border border-blue-400/30 rounded-xl',
  input: 'w-full px-4 py-3 bg-black/50 backdrop-blur-xl border-2 border-blue-500/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all duration-300',
  button: 'px-6 py-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-400/50 rounded-lg text-white font-semibold hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all duration-300',
  buttonSecondary: 'px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-blue-500/50 rounded-lg text-white font-semibold hover:bg-blue-600/20 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300',
  title: 'text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]',
  subtitle: 'text-2xl font-semibold text-white/90',
  text: 'text-white/80',
  label: 'text-white/90 font-medium',
  table: 'w-full bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl overflow-hidden',
  tableHeader: 'bg-blue-600/20 backdrop-blur-xl text-white font-semibold border-b border-blue-500/30',
  tableRow: 'bg-black/20 hover:bg-blue-600/10 border-b border-blue-500/20 transition-colors duration-200',
  tableCell: 'px-4 py-3 text-white/80',
  nav: 'bg-black/60 backdrop-blur-2xl border-b border-blue-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)]',
  navLink: 'text-white/80 hover:text-blue-400 transition-colors duration-200',
  sidebar: 'bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-2xl border-r border-blue-500/30',
  glowBlue: 'shadow-[0_0_30px_rgba(59,130,246,0.6)]',
  glowSoft: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  hoverScale: 'hover:scale-105 transition-transform duration-300',
  hoverGlow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] transition-shadow duration-300'
} as const;

export const glassClasses = (classNames: string[]) => classNames.join(' ');
