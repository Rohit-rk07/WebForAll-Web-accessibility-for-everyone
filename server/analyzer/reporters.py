"""Reporter module for accessibility analysis results."""

from typing import Dict, Any, List
from datetime import datetime

class AccessibilityReporter:
    """Formats and enhances accessibility analysis results."""
    
    def combine_results(self, static_results: Dict[str, Any], dynamic_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine static and dynamic analysis results.
        
        Args:
            static_results: Results from static analysis
            dynamic_results: Results from dynamic analysis
            
        Returns:
            Combined and formatted results
        """
        all_issues = []
        
        # Process static results
        if "issues" in static_results:
            for issue in static_results["issues"]:
                self._enhance_issue(issue, "static")
                all_issues.append(issue)
        
        # Process dynamic results
        if "issues" in dynamic_results:
            for issue in dynamic_results["issues"]:
                self._enhance_issue(issue, "dynamic")
                all_issues.append(issue)
        
        # Calculate summary
        summary = self._calculate_summary(all_issues)
        
        # Calculate score
        score = self._calculate_score(summary)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "issues": all_issues,
            "summary": summary,
            "score": score
        }
    
    def format_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format analysis results.
        
        Args:
            results: Raw analysis results
            
        Returns:
            Formatted results
        """
        # If results already have issues, just enhance them
        if "issues" in results:
            for issue in results["issues"]:
                self._enhance_issue(issue, "combined")
            
            # Make sure we have a summary
            if "summary" not in results:
                results["summary"] = self._calculate_summary(results["issues"])
            
            # Make sure we have a score
            if "score" not in results:
                results["score"] = self._calculate_score(results["summary"])
            
            # Add timestamp if not present
            if "timestamp" not in results:
                results["timestamp"] = datetime.now().isoformat()
            
            return results
        
        # Otherwise, return an error result
        return {
            "timestamp": datetime.now().isoformat(),
            "issues": [],
            "summary": {
                "errors": 0,
                "warnings": 0,
                "notices": 0
            },
            "score": 0,
            "error": results.get("error", "Unknown error")
        }
    
    def _enhance_issue(self, issue: Dict[str, Any], source: str) -> None:
        """
        Enhance issue with additional information.
        
        Args:
            issue: Issue to enhance
            source: Source of the issue (static/dynamic)
        """
        # Ensure required fields
        issue.setdefault("severity", "notice")
        issue.setdefault("impact", "minor")
        
        # Add WCAG criteria if not present
        if "wcag_criteria" not in issue:
            criteria = self._get_wcag_criteria(issue)
            if criteria:
                issue["wcag_criteria"] = criteria
        
        # Add fix suggestion if not present
        if "fix_suggestion" not in issue:
            issue["fix_suggestion"] = self._generate_fix_suggestion(issue)
    
    def _get_wcag_criteria(self, issue: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get relevant WCAG criteria based on issue type."""
        criteria_map = {
            "contrast": [{
                "id": "1.4.3",
                "description": "Contrast (Minimum)",
                "level": "AA"
            }],
            "alt-text": [{
                "id": "1.1.1",
                "description": "Non-text Content",
                "level": "A"
            }],
            "aria": [{
                "id": "4.1.2",
                "description": "Name, Role, Value",
                "level": "A"
            }],
            "keyboard": [{
                "id": "2.1.1",
                "description": "Keyboard",
                "level": "A"
            }]
        }
        
        for key, criteria in criteria_map.items():
            if key in issue.get("type", "").lower() or key in issue.get("category", "").lower():
                return criteria
        return []
    
    def _generate_fix_suggestion(self, issue: Dict[str, Any]) -> str:
        """Generate fix suggestion based on issue type."""
        type_lower = issue.get("type", "").lower()
        category_lower = issue.get("category", "").lower()
        
        if "contrast" in type_lower or "contrast" in category_lower:
            return "Ensure sufficient color contrast between text and background colors."
        elif "alt-text" in type_lower or "alt-text" in category_lower or "image" in type_lower:
            return "Add descriptive alt text to images that convey information."
        elif "aria" in type_lower or "aria" in category_lower:
            return "Add appropriate ARIA attributes to enhance accessibility."
        elif "keyboard" in type_lower or "keyboard" in category_lower:
            return "Ensure all interactive elements are keyboard accessible."
        
        return "Review and fix the issue according to WCAG guidelines."
    
    def _calculate_summary(self, issues: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calculate summary statistics from issues."""
        summary = {
            "errors": 0,
            "warnings": 0,
            "notices": 0
        }
        
        for issue in issues:
            severity = issue.get("severity", "notice").lower()
            if severity in summary:
                summary[severity] += 1
        
        return summary
    
    def _calculate_score(self, summary: Dict[str, int]) -> int:
        """Calculate accessibility score based on issues."""
        # Base score of 100, deduct points based on severity
        score = 100
        score -= summary["errors"] * 10  # -10 points per error
        score -= summary["warnings"] * 5  # -5 points per warning
        score -= summary["notices"] * 1   # -1 point per notice
        
        return max(0, min(100, score))  # Ensure score is between 0 and 100 