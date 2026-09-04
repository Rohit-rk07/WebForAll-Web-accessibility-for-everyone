"""Performance monitoring service for tracking application metrics."""

import time
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """
    Performance monitoring service to track response times, error rates, and system health.
    Provides metrics for performance benchmarks and SLA compliance.
    """
    
    def __init__(self):
        """Initialize the performance monitor."""
        self.metrics = defaultdict(list)
        self.counters = defaultdict(int)
        self.start_time = datetime.utcnow()
        
    def record_response_time(self, endpoint: str, response_time_ms: float, status_code: int = 200):
        """
        Record response time for an endpoint.
        
        Args:
            endpoint: API endpoint path
            response_time_ms: Response time in milliseconds
            status_code: HTTP status code
        """
        self.metrics[endpoint].append({
            'time': response_time_ms,
            'status_code': status_code,
            'timestamp': datetime.utcnow()
        })
        self.counters[f"{endpoint}_requests"] += 1
        
        if status_code >= 400:
            self.counters[f"{endpoint}_errors"] += 1
    
    def get_endpoint_metrics(self, endpoint: str) -> Dict[str, Any]:
        """
        Get performance metrics for a specific endpoint.
        
        Args:
            endpoint: API endpoint path
            
        Returns:
            Dict containing performance metrics
        """
        measurements = self.metrics.get(endpoint, [])
        if not measurements:
            return {
                'endpoint': endpoint,
                'total_requests': 0,
                'average_response_time_ms': 0,
                'p50_response_time_ms': 0,
                'p95_response_time_ms': 0,
                'p99_response_time_ms': 0,
                'error_rate': 0
            }
        
        times = [m['time'] for m in measurements]
        errors = sum(1 for m in measurements if m['status_code'] >= 400)
        
        times_sorted = sorted(times)
        n = len(times_sorted)
        
        return {
            'endpoint': endpoint,
            'total_requests': n,
            'average_response_time_ms': sum(times) / n,
            'p50_response_time_ms': times_sorted[n // 2] if n > 0 else 0,
            'p95_response_time_ms': times_sorted[int(n * 0.95)] if n > 0 else 0,
            'p99_response_time_ms': times_sorted[int(n * 0.99)] if n > 0 else 0,
            'error_rate': (errors / n) * 100 if n > 0 else 0,
            'min_response_time_ms': min(times) if times else 0,
            'max_response_time_ms': max(times) if times else 0
        }
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for all endpoints."""
        return {
            'endpoints': {endpoint: self.get_endpoint_metrics(endpoint) for endpoint in self.metrics.keys()},
            'uptime_seconds': (datetime.utcnow() - self.start_time).total_seconds(),
            'total_requests': sum(self.counters[k] for k in self.counters if k.endswith('_requests')),
            'total_errors': sum(self.counters[k] for k in self.counters if k.endswith('_errors'))
        }
    
    def check_sla_compliance(self, endpoint: str, sla_p50_ms: float = 200, sla_p95_ms: float = 500) -> Dict[str, Any]:
        """
        Check if endpoint meets SLA requirements.
        
        Args:
            endpoint: API endpoint path
            sla_p50_ms: SLA for p50 response time in milliseconds
            sla_p95_ms: SLA for p95 response time in milliseconds
            
        Returns:
            Dict containing SLA compliance status
        """
        metrics = self.get_endpoint_metrics(endpoint)
        
        return {
            'endpoint': endpoint,
            'sla_p50_ms': sla_p50_ms,
            'sla_p95_ms': sla_p95_ms,
            'actual_p50_ms': metrics['p50_response_time_ms'],
            'actual_p95_ms': metrics['p95_response_time_ms'],
            'p50_compliant': metrics['p50_response_time_ms'] <= sla_p50_ms,
            'p95_compliant': metrics['p95_response_time_ms'] <= sla_p95_ms,
            'overall_compliant': (metrics['p50_response_time_ms'] <= sla_p50_ms and 
                                 metrics['p95_response_time_ms'] <= sla_p95_ms)
        }
    
    def cleanup_old_metrics(self, retention_hours: int = 24):
        """
        Remove metrics older than retention period.
        
        Args:
            retention_hours: Number of hours to retain metrics
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=retention_hours)
        
        for endpoint in list(self.metrics.keys()):
            self.metrics[endpoint] = [
                m for m in self.metrics[endpoint] 
                if m['timestamp'] > cutoff_time
            ]
            
            if not self.metrics[endpoint]:
                del self.metrics[endpoint]
        
        logger.info(f"Cleaned up metrics older than {retention_hours} hours")

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

def track_performance(endpoint: str):
    """
    Decorator to track performance of endpoint functions.
    
    Args:
        endpoint: API endpoint path
    """
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                response_time_ms = (time.time() - start_time) * 1000
                performance_monitor.record_response_time(endpoint, response_time_ms, 200)
                return result
            except Exception as e:
                response_time_ms = (time.time() - start_time) * 1000
                performance_monitor.record_response_time(endpoint, response_time_ms, 500)
                raise
        
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                response_time_ms = (time.time() - start_time) * 1000
                performance_monitor.record_response_time(endpoint, response_time_ms, 200)
                return result
            except Exception as e:
                response_time_ms = (time.time() - start_time) * 1000
                performance_monitor.record_response_time(endpoint, response_time_ms, 500)
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    return decorator