"""
Tests for structured JSON logging configuration.
"""

import json
import logging
import sys
from unittest.mock import patch

from src.api.logging_config import (
    StructuredJsonFormatter,
    RequestIdFilter,
    setup_json_logging,
    get_logger,
)


class TestStructuredJsonFormatter:
    """Tests for the StructuredJsonFormatter class."""

    def test_formatter_produces_valid_json(self):
        """Test that the formatter outputs valid JSON."""
        formatter = StructuredJsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s"
        )

        # Create a log record
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None,
        )

        # Format the record
        output = formatter.format(record)

        # Should be valid JSON
        parsed = json.loads(output)
        assert "timestamp" in parsed
        assert "level" in parsed
        assert "message" in parsed

    def test_formatter_includes_exception_info(self):
        """Test that exception info is included when present."""
        formatter = StructuredJsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s"
        )

        try:
            raise ValueError("Test error")
        except ValueError:
            exc_info = sys.exc_info()

        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="test.py",
            lineno=1,
            msg="Error occurred",
            args=(),
            exc_info=exc_info,
        )

        output = formatter.format(record)
        parsed = json.loads(output)

        assert "exception" in parsed
        assert "Test error" in parsed["exception"]

    def test_formatter_adds_required_fields(self):
        """Test that all required fields are added."""
        formatter = StructuredJsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s"
        )

        record = logging.LogRecord(
            name="test_logger",
            level=logging.WARNING,
            pathname="test.py",
            lineno=42,
            msg="Warning message",
            args=(),
            exc_info=None,
        )
        # Set funcName since it's not automatically set for LogRecord
        record.funcName = "test_function"

        output = formatter.format(record)
        parsed = json.loads(output)

        # Check required fields
        assert parsed["level"] == "WARNING"
        assert parsed["message"] == "Warning message"
        assert parsed["function"] == "test_function"
        assert parsed["line"] == 42
        assert parsed["module"] == "test"
        assert "timestamp" in parsed


class TestRequestIdFilter:
    """Tests for the RequestIdFilter class."""

    def test_filter_adds_request_id_when_missing(self):
        """Test that request ID is added when not present."""
        filter_obj = RequestIdFilter()

        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test",
            args=(),
            exc_info=None,
        )

        result = filter_obj.filter(record)

        assert result is True
        assert hasattr(record, "request_id")
        assert len(record.request_id) == 8

    def test_filter_preserves_existing_request_id(self):
        """Test that existing request ID is preserved."""
        filter_obj = RequestIdFilter()

        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test",
            args=(),
            exc_info=None,
        )
        record.request_id = "existing-id"

        result = filter_obj.filter(record)

        assert result is True
        assert record.request_id == "existing-id"


class TestSetupJsonLogging:
    """Tests for the setup_json_logging function."""

    def test_setup_json_logging_configures_root_logger(self):
        """Test that setup_json_logging configures the root logger."""
        # Reset logging
        root_logger = logging.getLogger()
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        setup_json_logging(log_level="INFO", json_format=True)

        assert root_logger.level == logging.INFO
        assert len(root_logger.handlers) > 0

    def test_setup_json_logging_creates_console_handler(self):
        """Test that a console handler is created."""
        root_logger = logging.getLogger()
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        setup_json_logging(log_level="DEBUG", json_format=False)

        # Should have at least one handler
        assert len(root_logger.handlers) >= 1


class TestGetLogger:
    """Tests for the get_logger function."""

    def test_get_logger_returns_logger_instance(self):
        """Test that get_logger returns a logger instance."""
        logger = get_logger("test_module")

        assert isinstance(logger, logging.Logger)
        assert logger.name == "test_module"

    def test_get_logger_returns_same_instance(self):
        """Test that get_logger returns the same instance for same name."""
        logger1 = get_logger("same_module")
        logger2 = get_logger("same_module")

        assert logger1 is logger2
