export type CellTextAlign = "left" | "center" | "right";
export type CellVerticalAlign = "top" | "middle" | "bottom";

export type CellFormatting = Readonly<{
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textColor?: string; // hex like "#111827"
  fillColor?: string; // hex like "#ffffff"
  textAlign?: CellTextAlign;
  verticalAlign?: CellVerticalAlign;
  numberFormat?: "general" | "number" | "currency" | "percent";
}>;