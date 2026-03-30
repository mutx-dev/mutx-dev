# Mutation Testing

This project uses **mutmut** for mutation testing to identify weak tests and improve test quality.

## What is Mutation Testing?

Mutation testing is a technique that introduces small changes (mutations) to the source code to verify that tests can detect these changes. If a mutation doesn't cause any test to fail, it indicates that the tests are not thorough enough.

## Running Mutation Tests

### Install Dependencies

```bash
pip install -e ".[dev]"
```

### Run Mutation Tests

```bash
# Using Make
make mutation-test

# Or directly
python -m mutmut run
python -m mutmut show
```

## Configuration

Mutation testing is configured in `pyproject.toml`:

```toml
[tool.mutmut]
paths = ["tests", "cli"]
exclude = ["tests/website.spec.ts", "tests/conftest.py"]
```

- `paths`: Directories to mutate
- `exclude`: Files/directories to skip

## Interpreting Results

mutmut will show:
- **Survived**: Mutations that didn't cause any test to fail (indicates weak tests)
- **Killed**: Mutations that caused tests to fail (good)
- **Errors**: Mutations that caused errors in the test setup

### Improving Weak Tests

When you see survived mutations:
1. Review the specific mutation that survived
2. Add more specific assertions to your tests
3. Consider edge cases that aren't covered
4. Add boundary checks

## CI Integration

You can add mutation testing to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run mutation tests
  run: |
    pip install -e ".[dev]"
    python -m mutmut run || true  # Allow to fail but report
```
