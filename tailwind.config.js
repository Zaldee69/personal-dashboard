module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        allan: ["Allan", "cursive"],
        aguafinaScript: ["Aguafina Script", "cursive"],
        architectsDaughter: ["Architects Daughter", "cursive"],
        giveYouGlory: ["Give You Glory", "cursive"],
        berkshireSwash: ["Berkshire Swash", "cursive"],
        missFajardose: ["Miss Fajardose", "cursive"],
      },
      maxWidth: { "352px": "352px" },
    },
    colors: {
      primary: "#0052CC",
      white: "#fff",
      neutral: "rgba(107, 119, 140, 1)",
      borderColor: "rgba(223, 225, 230, 1)",
      label: "rgba(107, 119, 140, 1)",
      placeholder: "rgba(193, 199, 208, 1)",
      error: "rgba(255, 86, 48, 1)",
      black: "#000",
      neutral40: "#DFE1E6",
      neutral80: "#97A0AF",
      neutral800: "#172B4D",
      blue50: "#DEEBFF",
      blue500: "#0747A6",
      _B6B6B6: "#B6B6B6",
      _1A73E8: "#1A73E8",
      _030326: "#030326",
    },
  },
  plugins: [],
};
