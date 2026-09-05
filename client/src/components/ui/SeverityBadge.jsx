import React from "react";
import { Chip } from "@mui/material";

/**
 * SeverityBadge - consistent severity indicator.
 * Color communicates at a glance, but the label is always present
 * so status is never color-only.
 *
 * @param {Object} props
 * @param {string} props.severity - "critical" | "serious" | "moderate" | "minor" | "all"
 * @param {Object} [props.severityMap] - Config with { color, label } per severity
 */
const SeverityBadge = ({ severity, severityMap }) => {
  const config = (severityMap && severityMap[severity]) || null;
  const color = config?.color || "default";
  const label = config?.label || severity;

  return (
    <Chip
      label={label}
      size="small"
      color={color === "default" ? "default" : color}
      aria-label={`Severity: ${label}`}
    />
  );
};

export default SeverityBadge;