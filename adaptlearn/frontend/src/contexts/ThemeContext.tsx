import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export type Palette = "indigo" | "teal" | "rose" | "amber" | "emerald" | "violet";

export const PALETTES: { id: Palette; label: string; color: string }[] = [
  { id: "indigo",  label: "Індиго",   color: "#6366f1" },
  { id: "teal",    label: "Океан",    color: "#0284c7" },
  { id: "emerald", label: "Смарагд",  color: "#059669" },
  { id: "violet",  label: "Фіолет",   color: "#7c3aed" },
  { id: "rose",    label: "Рожевий",  color: "#e11d48" },
  { id: "amber",   label: "Бурштин",  color: "#d97706" },
];

interface ThemeCtx {
  theme: Theme;
  palette: Palette;
  toggleTheme: () => void;
  setPalette: (p: Palette) => void;
}

const Ctx = createContext<ThemeCtx>({} as ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) ?? "dark"
  );
  const [palette, setPaletteState] = useState<Palette>(
    () => (localStorage.getItem("palette") as Palette) ?? "indigo"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
    localStorage.setItem("palette", palette);
  }, [palette]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const setPalette = (p: Palette) => { setPaletteState(p); localStorage.setItem("palette", p); };

  return (
    <Ctx.Provider value={{ theme, palette, toggleTheme, setPalette }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
