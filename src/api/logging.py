"""
Structured JSON logging configuration for MUTX API.

Provides JSON-formatted logging with standard fields for easy parsing
by log aggregation systems (ELK, Grafana Loki, etc.).
"""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs log records as JSON strings.
    
    Includes standard fields:
    - timestamp: ISO 8601 formatted time
    - level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - logger: Name of the logger
    - message: Log message
    - module: Source module
    - function: Function name
    - line: Line number
    - extra: Any additional custom fields
    """
    
    def __init__(self, include_extra: bool = True):
        super().__init__()
        self.include_extra = include_extra
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if self.include_extra:
            extra_fields = {
                key: value 
                for key, value in record.__dict__.items() 
                if key not in (
                    "name", "msg", "args", "created", "filename", "funcName",
                    "levelname", "levelno", "lineno", "module", "msecs",
                    "pathname", "process", "processName", "threadName",
                    "exc_info", "exc_text", "stack_info", "message",
                    "relativeCreated", "thread", "taskName"
                )
            }
            if extra_fields:
                log_data["extra"] = extra_fields
        
        return json.dumps(log_data)


def setup_logging(level: str = "INFO", format: str = "json") -> None:
    """
    Configure the root logger with JSON or text formatting.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format: Log format ("json" or "text")
    """
    # Determine formatter based on format setting
    if format.lower() == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    
    # Configure root handler
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add stdout handler with selected formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# Backwards compatibility alias
setup_json_logging = lambda level="INFO": setup_logging(level, "json")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.
    
    Args:
        name: Logger name (typically __name__)
    
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
