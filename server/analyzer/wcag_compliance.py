"""WCAG compliance verification system for accessibility analysis results."""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class WCAGVersion(Enum):
    """WCAG version enumeration."""
    WCAG_2_0 = "2.0"
    WCAG_2_1 = "2.1"
    WCAG_2_2 = "2.2"

class ConformanceLevel(Enum):
    """WCAG conformance level enumeration."""
    A = "A"
    AA = "AA"
    AAA = "AAA"

@dataclass
class WCAGComplianceResult:
    """Result of WCAG compliance verification."""
    version: WCAGVersion
    level: ConformanceLevel
    total_issues: int
    critical_issues: int
    serious_issues: int
    moderate_issues: int
    minor_issues: int
    passes: int
    incomplete: int
    compliance_percentage: float
    is_compliant: bool
    violations_by_level: Dict[str, int]
    recommendations: List[str]

class WCAGComplianceVerifier:
    """
    WCAG compliance verification system that evaluates analysis results
    against WCAG standards and conformance levels.
    """
    
    # WCAG success criteria mapping
    WCAG_SUCCESS_CRITERIA = {
        "2.0": {
            "A": {
                "text-alternatives": "1.1.1",
                "time-based-media": "1.2.1",
                "audio-description": "1.2.3",
                "captions-live": "1.2.4",
                "keyboard": "2.1.1",
                "no-keyboard-trap": "2.1.2",
                "focus-order": "2.4.3",
                "link-purpose": "2.4.4",
                "reflow": "1.4.4",
                "contrast": "1.4.3",
                "resize-text": "1.4.4",
                "images-text": "1.4.5",
                "status-messages": "4.1.3"
            },
            "AA": {
                "contrast-enhanced": "1.4.6",
                "keyboard-no-exception": "2.1.1",
                "focus-visible": "2.4.7",
                "location": "2.4.8",
                "headings-labels": "2.4.6",
                "consistent-navigation": "3.2.3",
                "consistent-identification": "3.2.4",
                "error-suggestion": "3.3.3",
                "error-prevention": "3.3.4",
                "labels": "2.4.6",
                "focus-indicator": "2.4.7"
            },
            "AAA": {
                "contrast-maximum": "1.4.6",
                "text-spacing": "1.4.12",
                "content-on-hover-focus": "1.4.13",
                "keyboard-no-exception": "2.1.1",
                "target-size": "2.5.5",
                "authentication": "3.3.8"
            }
        },
        "2.1": {
            "A": {
                "character-key-shortcuts": "2.1.4",
                "dragging-movements": "2.5.1",
                "label-in-name": "2.5.3",
                "moving-content": "2.3.1",
                "non-text-contrast": "1.4.11"
            },
            "AA": {
                "focus-visible": "2.4.7",
                "focus-not-obscured": "2.4.11",
                "target-size": "2.5.8",
                "consistent-help": "3.3.7",
                "redundant-entry": "3.3.9"
            },
            "AAA": {
                "target-size-minimum": "2.5.5",
                "authentication": "3.3.8"
            }
        },
        "2.2": {
            "A": {
                "focus-not-obscured": "2.4.11",
                "focus-visible": "2.4.7",
                "dragging-dropping": "2.5.2",
                "target-size": "2.5.8"
            },
            "AA": {
                "focus-visible-enhanced": "2.4.7",
                "focus-not-obscured-enhanced": "2.4.11"
            },
            "AAA": {
                "findable-target": "2.5.9"
            }
        }
    }
    
    def __init__(self):
        """Initialize the WCAG compliance verifier."""
        self.compliance_history: List[WCAGComplianceResult] = []
    
    def verify_compliance(
        self, 
        analysis_results: Dict[str, Any], 
        version: WCAGVersion = WCAGVersion.WCAG_2_1,
        level: ConformanceLevel = ConformanceLevel.AA
    ) -> WCAGComplianceResult:
        """
        Verify WCAG compliance of analysis results.
        
        Args:
            analysis_results: Results from accessibility analysis
            version: WCAG version to verify against
            level: Conformance level to verify
            
        Returns:
            WCAGComplianceResult with compliance status
        """
        violations = analysis_results.get('violations', [])
        passes = analysis_results.get('passes', [])
        incomplete = analysis_results.get('incomplete', [])
        
        # Categorize violations by severity
        critical = sum(1 for v in violations if v.get('impact') == 'critical')
        serious = sum(1 for v in violations if v.get('impact') == 'serious')
        moderate = sum(1 for v in violations if v.get('impact') == 'moderate')
        minor = sum(1 for v in violations if v.get('impact') == 'minor')
        
        total_issues = len(violations)
        total_checks = total_issues + len(passes) + len(incomplete)
        
        # Calculate compliance percentage
        if total_checks > 0:
            compliance_percentage = (len(passes) / total_checks) * 100
        else:
            compliance_percentage = 0.0
        
        # Determine compliance based on level
        is_compliant = self._check_level_compliance(
            critical, serious, moderate, minor, level
        )
        
        # Group violations by WCAG level
        violations_by_level = self._categorize_violations_by_level(violations, version)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            violations, version, level, is_compliant
        )
        
        result = WCAGComplianceResult(
            version=version,
            level=level,
            total_issues=total_issues,
            critical_issues=critical,
            serious_issues=serious,
            moderate_issues=moderate,
            minor_issues=minor,
            passes=len(passes),
            incomplete=len(incomplete),
            compliance_percentage=compliance_percentage,
            is_compliant=is_compliant,
            violations_by_level=violations_by_level,
            recommendations=recommendations
        )
        
        self.compliance_history.append(result)
        return result
    
    def _check_level_compliance(
        self, 
        critical: int, 
        serious: int, 
        moderate: int, 
        minor: int, 
        level: ConformanceLevel
    ) -> bool:
        """
        Check if results meet conformance level requirements.
        
        Args:
            critical: Number of critical issues
            serious: Number of serious issues
            moderate: Number of moderate issues
            minor: Number of minor issues
            level: Conformance level to check
            
        Returns:
            True if compliant with the level
        """
        if level == ConformanceLevel.A:
            # Level A: No critical or serious issues
            return critical == 0 and serious == 0
        elif level == ConformanceLevel.AA:
            # Level AA: No critical, serious, or moderate issues
            return critical == 0 and serious == 0 and moderate == 0
        elif level == ConformanceLevel.AAA:
            # Level AAA: No issues at any level
            return critical == 0 and serious == 0 and moderate == 0 and minor == 0
        return False
    
    def _categorize_violations_by_level(
        self, 
        violations: List[Dict[str, Any]], 
        version: WCAGVersion
    ) -> Dict[str, int]:
        """
        Categorize violations by WCAG level.
        
        Args:
            violations: List of violation objects
            version: WCAG version
            
        Returns:
            Dict mapping WCAG levels to violation counts
        """
        level_counts = {"A": 0, "AA": 0, "AAA": 0, "Unknown": 0}
        
        for violation in violations:
            tags = violation.get('tags', [])
            wcag_tags = [tag for tag in tags if tag.startswith('wcag')]
            
            if not wcag_tags:
                level_counts["Unknown"] += 1
                continue
            
            # Determine WCAG level from tags
            for tag in wcag_tags:
                if 'wcag2a' in tag or 'wcag21a' in tag or 'wcag22a' in tag:
                    level_counts["A"] += 1
                    break
                elif 'wcag2aa' in tag or 'wcag21aa' in tag or 'wcag22aa' in tag:
                    level_counts["AA"] += 1
                    break
                elif 'wcag2aaa' in tag or 'wcag21aaa' in tag or 'wcag22aaa' in tag:
                    level_counts["AAA"] += 1
                    break
            else:
                level_counts["Unknown"] += 1
        
        return level_counts
    
    def _generate_recommendations(
        self, 
        violations: List[Dict[str, Any]], 
        version: WCAGVersion, 
        level: ConformanceLevel,
        is_compliant: bool
    ) -> List[str]:
        """
        Generate recommendations based on violations and conformance level.
        
        Args:
            violations: List of violation objects
            version: WCAG version
            level: Conformance level
            is_compliant: Whether the results are compliant
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        if not is_compliant:
            recommendations.append(
                f"Page does not meet WCAG {version.value} Level {level.value} conformance. "
                f"Address the violations listed below to achieve compliance."
            )
        
        # Priority recommendations based on severity
        critical_violations = [v for v in violations if v.get('impact') == 'critical']
        if critical_violations:
            recommendations.append(
                f"Priority 1: Fix {len(critical_violations)} critical accessibility issues "
                "that prevent users with disabilities from accessing content."
            )
        
        serious_violations = [v for v in violations if v.get('impact') == 'serious']
        if serious_violations:
            recommendations.append(
                f"Priority 2: Address {len(serious_violations)} serious issues "
                "that significantly impact user experience."
            )
        
        # Version-specific recommendations
        if version == WCAGVersion.WCAG_2_2:
            recommendations.append(
                "WCAG 2.2 introduces new success criteria for focus appearance, "
                "target size, and redundant entry. Ensure these are addressed."
            )
        
        # Level-specific recommendations
        if level == ConformanceLevel.AA:
            recommendations.append(
                "Level AA conformance is the recommended standard for most websites. "
                "Consider addressing all moderate issues to maintain compliance."
            )
        elif level == ConformanceLevel.AAA:
            recommendations.append(
                "Level AAA conformance is very strict and may not be achievable for all content. "
                "Focus on Level AA as the primary target."
            )
        
        return recommendations
    
    def get_compliance_trend(self) -> Dict[str, Any]:
        """
        Get trend of compliance results over time.
        
        Returns:
            Dict containing compliance trend data
        """
        if not self.compliance_history:
            return {"trend": "No data available"}
        
        recent_results = self.compliance_history[-10:]  # Last 10 results
        
        return {
            "total_checks": len(self.compliance_history),
            "recent_compliance": [r.compliance_percentage for r in recent_results],
            "average_compliance": sum(r.compliance_percentage for r in recent_results) / len(recent_results),
            "compliance_trend": "improving" if recent_results[-1].compliance_percentage > recent_results[0].compliance_percentage else "declining"
        }

# Global WCAG compliance verifier instance
wcag_verifier = WCAGComplianceVerifier()