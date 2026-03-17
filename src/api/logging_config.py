"""
Structured JSON logging configuration for mutx API.

Provides JSON logging with configurable fields and formats for better
log aggregation and analysis in production environments.
"""

import logging
import sys
from datetime import datetime, timezone
from uuid import uuid4

from pythonjsonlogger import jsonlogger


class StructuredJsonFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter that adds structured fields to all log records.
    
    Features:
    - ISO 8601 timestamps
    - Request/trace IDs
    - Configurable extra fields
    - Exception stack traces preserved
    """
    
    def add_fields(self, log_record: dict, record: logging.LogRecord, message_dict: dict) -> None:
        """Add structured fields to the log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Timestamp in ISO 8601 format
        log_record["timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Level as string
        log_record["level"] = record.levelname
        
        # Logger name
        log_record["logger"] = record.name
        
        # Function and line number for debugging
        log_record["function"] = record.funcName
        log_record["line"] = record.lineno
        
        # Module path
        log_record["module"] = record.module
        
        # Process and thread IDs
        log_record["process_id"] = record.process
        log_record["thread_id"] = record.thread
        
        # Message
        log_record["message"] = record.getMessage()
        
        # Exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)


class RequestIdFilter(logging.Filter):
    """
    Filter that adds a request ID to log records if not present.
    """
    
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = str(uuid4())[:8]
        return True


def setup_json_logging(
    log_level: str = "INFO",
    json_format: bool = True,
    log_file: str | None = None
) -> logging.Logger:
    """
    Configure structured JSON logging for the application.
    
    Args:
        log_level: The logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Whether to use JSON format (True) or plain text (False)
        log_file: Optional file path to write logs to
        
    Returns:
        The configured root logger
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatter
    if json_format:
        formatter = StructuredJsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s",
            rename_fields={"levelname": "level", "name": "logger"}
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.addFilter(RequestIdFilter())
    root_logger.addHandler(console_handler)
    
    # File handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        file_handler.addFilter(RequestIdFilter())
        root_logger.addHandler(file_handler)
    
    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.
    
    Args:
        name: The name for the logger (typically __name__)
        
    Returns:
        A configured logger instance
    """
    return logging.getLogger(name)
