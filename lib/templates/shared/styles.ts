/**
 * Shared CSS for all magazine page templates.
 * Page: A4 (210mm x 297mm)
 * Margins: 38pt all sides
 */

export const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    background: #141414;
    color: #FFFFFF;
    font-family: 'Inter', sans-serif;
    font-size: 9.5pt;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    height: 297mm;
    position: relative;
    overflow: hidden;
    padding: 32pt 34pt;
  }

  /* Content overflow protection */
  p, div, span, h1, h2, h3, h4, h5, h6 {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .font-heading { font-family: 'Playfair Display', serif; }
  .font-body { font-family: 'Inter', sans-serif; }

  :root {
    --c-bg: #141414;
    --c-card: #222222;
    --c-card2: #1C1C1C;
    --c-rule: #333333;
    --c-gold: #B8860B;
    --c-gold-d: #8B6914;
    --c-wht: #FFFFFF;
    --c-off: #F0F0F0;
    --c-lg: #B0B0B0;
    --c-mg: #888888;
    --c-dg: #666666;
  }
`;

export const COLORS = {
  bg: '#141414',
  card: '#222222',
  card2: '#1C1C1C',
  rule: '#333333',
  gold: '#B8860B',
  goldDark: '#8B6914',
  white: '#FFFFFF',
  offWhite: '#F0F0F0',
  lightGrey: '#B0B0B0',
  midGrey: '#888888',
  darkGrey: '#666666',
  red: '#C0392B',
  green: '#22C55E',
} as const;
