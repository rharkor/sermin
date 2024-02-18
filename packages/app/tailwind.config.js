import * as path from "path"

import { nextui } from "@nextui-org/react"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    ...["pages/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"].map((p) =>
      path.join(__dirname, p)
    ),
    path.join(__dirname, "../..", "node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"),
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    nextui({
      layout: {
        disabledOpacity: "0.3", // opacity-[0.3]
        radius: {
          small: "2px", // rounded-small
          medium: "4px", // rounded-medium
          large: "6px", // rounded-large
        },
        borderWidth: {
          small: "1px", // border-small
          medium: "1px", // border-medium
          large: "2px", // border-large
        },
      },
      themes: {
        light: {
          colors: {
            muted: "#f1f5f9",
            "muted-foreground": "#64748b",
            primary: {
              DEFAULT: "#BEF264",
              foreground: "#000000",
            },
            focus: "#BEF264",
          },
        },
        dark: {
          colors: {
            muted: "#1e293b",
            "muted-foreground": "#94a3b8",
            primary: {
              DEFAULT: "#BEF264",
              foreground: "#000000",
            },
            focus: "#BEF264",
          },
        },
      },
    }),
  ],
}
