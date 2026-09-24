import { Noto_Sans, Noto_Sans_Arabic, Noto_Sans_Tifinagh, Noto_Serif_Display, Reem_Kufi } from "next/font/google";

// All five cover what Tachawit needs: Tamazight Latin (ɣ ḥ ṭ ḍ ṣ ẓ ɛ č ǧ, plus Greek ε), Arabic and Tifinagh.
// Only the Latin body font is preloaded; the others load on demand through their unicode ranges.

export const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext", "greek"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const notoSerifDisplay = Noto_Serif_Display({
  subsets: ["latin", "latin-ext", "greek"],
  variable: "--font-noto-serif-display",
  display: "swap",
  preload: false,
});

export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-sans-arabic",
  display: "swap",
  preload: false,
});

export const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  variable: "--font-reem-kufi",
  display: "swap",
  preload: false,
});

export const notoSansTifinagh = Noto_Sans_Tifinagh({
  subsets: ["tifinagh"],
  weight: "400",
  variable: "--font-noto-sans-tifinagh",
  display: "swap",
  preload: false,
});

export const fontVariables = [notoSans, notoSerifDisplay, notoSansArabic, reemKufi, notoSansTifinagh]
  .map((font) => font.variable)
  .join(" ");
