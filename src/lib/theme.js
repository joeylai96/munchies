export const COLORS = {
  ink: "#26221C",
  inkSoft: "#5C5648",
  paper: "#F7F0DE",
  card: "#FFFDF7",
  cardLine: "#E9E0C8",
  mango: "#F0A438",
  mangoDeep: "#C97F1F",
  basil: "#5B7B4F",
  basilSoft: "#DCE6D3",
  chili: "#C6503F",
  chiliSoft: "#F3D9D2",
  sky: "#4E7C8C",
  skySoft: "#D8E6E9",
};

export const inputStyle = {
  border: `1px solid ${COLORS.cardLine}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  color: COLORS.ink,
  background: COLORS.paper,
  flex: 1,
  outline: "none",
};

export const primaryBtnStyle = {
  background: COLORS.mango,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontFamily: "'Space Grotesk',sans-serif",
  fontWeight: 600,
  fontSize: 14,
};

export const ghostBtnStyle = {
  background: COLORS.card,
  color: COLORS.ink,
  border: `1px solid ${COLORS.cardLine}`,
  borderRadius: 10,
  padding: "10px 16px",
  fontFamily: "'Space Grotesk',sans-serif",
  fontWeight: 600,
  fontSize: 14,
};

export const globalFontStyle = `
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; margin: 0; background: ${COLORS.paper}; }
  button { font-family: inherit; cursor: pointer; }
  input, textarea, select { font-family: 'Space Grotesk', sans-serif; }
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
`;
