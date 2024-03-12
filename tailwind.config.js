/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      dropShadow: {
        glowWeak: ["0 0px 20px oklch(65.69% 0.196 275.75 / .6)"],
        glowStrong: [
          "0 0px 10px oklch(65.69% 0.196 275.75 / .7)",
          "0 0px 20px oklch(65.69% 0.196 275.75 / .5)",
        ],
        glowAccent: ["0 0px 20px oklch(74.51% 0.167 183.61 / .8)"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  daisyui: {
    themes: ["dark", "light"],
  },
  plugins: [require("daisyui")],
};
