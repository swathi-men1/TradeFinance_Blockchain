from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time
import logging

logger = logging.getLogger("performance")

class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log slow requests (> 1 second)
            if process_time > 1.0:
                logger.warning(
                    f"SLOW API: {request.method} {request.url.path} took {process_time:.4f}s"
                )
            
            # Add header for debugging
            response.headers["X-Process-Time"] = str(process_time)
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"API ERROR: {request.method} {request.url.path} failed after {process_time:.4f}s: {str(e)}"
            )
            # Re-raise to let FastAPI handle the error response
            raise e
