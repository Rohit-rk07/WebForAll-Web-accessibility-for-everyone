import { createTheme } from "@mui/material/styles";

/**
 * Accessibility Analyzer design system.
 *
 * Principles:
 * - Neutral-first surfaces, one strong accent (indigo).
 * - Flat surfaces + thin borders + minimal shadows.
 * - Restrained radius (8px base), consistent across controls/surfaces.
 * - Typography leads hierarchy (weight + size, not borders/decoration).
 * - No gradients, glows, glass, or decorative flourish.
 */

const radius = 8;

const LIGHT = {
  mode: "light",
  primary: {
    main: "#4361ee",
    light: "#6a83f2",
    dark: "#2f4bc7",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#31408f",
    light: "#4c5cc4",
    dark: "#24306a",
    contrastText: "#ffffff",
  },
  background: {
    default: "#f6f7f9",
    paper: "#ffffff",
  },
  text: {
    primary: "rgba(16, 24, 40, 0.94)",
    secondary: "rgba(16, 24, 40, 0.6)",
    disabled: "rgba(16, 24, 40, 0.38)",
  },
  divider: "rgba(16, 24, 40, 0.09)",
  action: {
    hover: "rgba(16, 24, 40, 0.05)",
    selected: "rgba(67, 97, 238, 0.1)",
    focus: "rgba(16, 24, 40, 0.12)",
  },
};

const DARK = {
  mode: "dark",
  primary: {
    main: "#7488e8",
    light: "#93a3ee",
    dark: "#5668d6",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#8b9aff",
    light: "#a5b1ff",
    dark: "#6b7ce4",
    contrastText: "#0e1116",
  },
  background: {
    default: "#0e1116",
    paper: "#161b22",
  },
  text: {
    primary: "#e6e9ee",
    secondary: "rgba(230, 233, 238, 0.7)",
    disabled: "rgba(230, 233, 238, 0.4)",
  },
  divider: "rgba(230, 233, 238, 0.11)",
  action: {
    hover: "rgba(230, 233, 238, 0.06)",
    selected: "rgba(116, 136, 232, 0.18)",
    focus: "rgba(230, 233, 238, 0.12)",
  },
};

export const createAppTheme = (darkMode) => {
  const isDark = Boolean(darkMode);
  const palette = isDark ? DARK : LIGHT;

  return createTheme({
    palette,
    shape: { borderRadius: radius },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      htmlFontSize: 16,
      h1: {
        fontSize: "clamp(2rem, 4.5vw, 2.625rem)",
        fontWeight: 700,
        letterSpacing: "-0.028em",
        lineHeight: 1.12,
      },
      h2: {
        fontSize: "1.5rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1.25,
      },
      h3: {
        fontSize: "1.125rem",
        fontWeight: 600,
        letterSpacing: "-0.012em",
        lineHeight: 1.3,
      },
      h4: { fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" },
      h5: { fontSize: "0.9375rem", fontWeight: 600 },
      h6: { fontSize: "0.875rem", fontWeight: 600 },
      subtitle1: { fontSize: "0.9375rem", fontWeight: 500, lineHeight: 1.5 },
      subtitle2: { fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.45 },
      body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.55 },
      caption: { fontSize: "0.75rem", lineHeight: 1.45 },
      overline: {
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        lineHeight: 1.4,
      },
      button: {
        fontSize: "0.875rem",
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: "0.01em",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            minHeight: "100vh",
            width: "100%",
            overflowWrap: "anywhere",
            fontSmooth: "antialiased",
            WebkitFontSmoothing: "antialiased",
          },
          a: { color: "inherit", textDecoration: "none" },
          ":focus-visible": {
            outline: `2px solid ${palette.primary.main}`,
            outlineOffset: "2px",
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: radius,
            transition:
              "background-color 150ms ease, color 150ms ease, border-color 150ms ease",
          },
          sizeSmall: { minHeight: 36 },
          sizeLarge: { minHeight: 48 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            borderRadius: radius,
          },
          sizeSmall: { minWidth: 34, minHeight: 34 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: radius },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { borderRadius: radius },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: { borderRadius: radius },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 500 },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            backgroundColor: palette.primary.main,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: radius },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: { borderRadius: radius },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 6 },
        },
      },
    },
  });
};

export default createAppTheme;