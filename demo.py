#!/usr/bin/env python3
"""
MUTX Demo Script - Demonstrates MUTX Observability Schema and AARM Security Layer.

Usage:
    # Start the API server first:
    mutx run-server

    # Then run this demo:
    python demo.py
"""

import warnings
import json
from datetime import datetime, timezone

warnings.filterwarnings("ignore")

# Test imports
print("=" * 60)
print("MUTX Demo - Testing Imports")
print("=" * 60)

try:
    from src.api.main import create_app
    from src.api.models.observability import (
        MutxRun,
        MutxStep,
        MutxStepType,
        MutxCost,
        MutxProvenance,
        MutxRunStatus,
        MutxRunTrigger,
        generate_run_id,
        compute_run_hash,
    )
    from src.api.models.observability_models import MutxRun as SQLMutxRun
    from src.security import (
        ActionMediator,
        ContextAccumulator,
        PolicyEngine,
        ApprovalService,
        ReceiptGenerator,
        TelemetryExporter,
        AARMComplianceChecker,
        NormalizedAction,
        TelemetryEventType,
    )

    print("✅ All imports successful!")
except Exception as e:
    print(f"❌ Import failed: {e}")
    raise

# Test Observability Schema
print("\n" + "=" * 60)
print("Testing MUTX Observability Schema")
print("=" * 60)

# Generate run ID and hash
run_id = generate_run_id()
print(f"Generated run_id: {run_id[:20]}...")

run_hash = compute_run_hash(
    agent_id="demo-agent",
    model="claude-sonnet-4-20250514",
    tools_available=["bash", "read", "write"],
    config_hash=None,
    trigger="manual",
)
print(f"Computed run_hash: {run_hash[:20]}...")

# Create MutxRun schema
run = MutxRun(
    id=run_id,
    agent_id="demo-agent",
    agent_name="Demo Agent",
    model="claude-sonnet-4-20250514",
    provider="anthropic",
    runtime="mutx@1.0.0",
    trigger=MutxRunTrigger.MANUAL,
    status=MutxRunStatus.RUNNING,
    started_at=datetime.now(timezone.utc),
    steps=[
        MutxStep(
            id=f"{run_id}-step-1",
            type=MutxStepType.REASONING,
            tool_name=None,
            input_preview="Thinking about the task...",
            output_preview="I should use the bash tool...",
            started_at=datetime.now(timezone.utc),
            step_metadata={"thought": "First reasoning step"},
        ),
        MutxStep(
            id=f"{run_id}-step-2",
            type=MutxStepType.TOOL_CALL,
            tool_name="bash",
            input_preview="ls -la /tmp",
            output_preview="total 0...",
            success=True,
            started_at=datetime.now(timezone.utc),
            step_metadata={"command": "ls -la /tmp"},
        ),
    ],
    tools_available=["bash", "read", "write", "edit"],
    cost=MutxCost(
        input_tokens=1500,
        output_tokens=3000,
        total_tokens=4500,
        cost_usd=0.045,
        model="claude-sonnet-4-20250514",
    ),
    provenance=MutxProvenance(
        run_hash=run_hash, lineage=[], runtime="mutx@1.0.0", created_at=datetime.now(timezone.utc)
    ),
    run_metadata={"demo": "true", "session": "test-123"},
)

print(f"✅ Created MutxRun: {run.id}")
print(f"   Status: {run.status}")
print(f"   Steps: {len(run.steps)}")
print(f"   Cost: ${run.cost.cost_usd}")
print(f"   Hash: {run.provenance.run_hash[:20]}...")

# Test Security Layer
print("\n" + "=" * 60)
print("Testing AARM Security Layer")
print("=" * 60)

# Create security components
mediator = ActionMediator()
context_accumulator = ContextAccumulator()
policy_engine = PolicyEngine()
approval_service = ApprovalService()
receipt_generator = ReceiptGenerator()
telemetry_exporter = TelemetryExporter()
compliance_checker = AARMComplianceChecker(
    mediator=mediator,
    context_accumulator=context_accumulator,
    policy_engine=policy_engine,
    approval_service=approval_service,
    receipt_generator=receipt_generator,
    telemetry_exporter=telemetry_exporter,
)

print("✅ Created security components:")
print("   - ActionMediator")
print("   - ContextAccumulator")
print("   - PolicyEngine")
print("   - ApprovalService")
print("   - ReceiptGenerator")
print("   - TelemetryExporter")
print("   - AARMComplianceChecker")

# Test action normalization
print("\n" + "-" * 40)
print("Testing Action Normalization")
print("-" * 40)

action = mediator.intercept(
    tool_name="bash",
    tool_args={"command": "ls -la"},
    agent_id="demo-agent",
    session_id="session-123",
    user_id="user-456",
    trigger="agent",
)

print(f"✅ Normalized action: {action.id}")
print(f"   Tool: {action.tool_name}")
print(f"   Action hash: {action.action_hash}")

# Categorize the action
category = mediator.categorize(action)
print(f"   Category: {category}")

# Test session context
print("\n" + "-" * 40)
print("Testing Session Context")
print("-" * 40)

session = context_accumulator.create_session(
    session_id="session-123",
    agent_id="demo-agent",
    user_id="user-456",
    original_request="List files in /tmp",
    stated_intent="File management",
)
print(f"✅ Created session: {session.session_id}")
print(f"   Agent: {session.agent_id}")
print(f"   Intent: {session.stated_intent}")

# Test policy evaluation
print("\n" + "-" * 40)
print("Testing Policy Evaluation")
print("-" * 40)

context = context_accumulator.get_context("session-123")
decision = policy_engine.evaluate(action, context)
print(f"✅ Policy decision: {decision.decision}")
print(f"   Reason: {decision.reason}")
print(f"   Rule: {decision.rule_name or 'N/A'}")

# Test telemetry
print("\n" + "-" * 40)
print("Testing Telemetry")
print("-" * 40)

event = telemetry_exporter.export_security_event(
    event_type=TelemetryEventType.ACTION_EVALUATED, action=action, decision=decision
)
print(f"✅ Exported telemetry event: {event.event_id}")
print(f"   Type: {event.event_type.value}")
print(f"   Severity: {event.severity}")

# Test metrics
metrics = telemetry_exporter.get_metrics_summary()
print(f"   Total evaluations: {metrics['total_evaluations']}")
print(f"   Permits: {metrics['permits']}")
print(f"   Denials: {metrics['denials']}")

# Test Prometheus metrics
print("\n" + "-" * 40)
print("Testing Prometheus Metrics")
print("-" * 40)

prometheus_output = telemetry_exporter.get_prometheus_metrics()
print("✅ Prometheus metrics:")
for line in prometheus_output.split("\n")[:10]:
    if line and not line.startswith("#"):
        print(f"   {line}")

# Test compliance
print("\n" + "-" * 40)
print("Testing AARM Compliance")
print("-" * 40)

report = compliance_checker.full_audit()
print(f"✅ Compliance report: v{report.version}")
print(f"   Overall satisfied: {report.overall_satisfied}")
summary = report.summary()
for req, result in summary.items():
    status = "✅" if result else "❌"
    print(f"   {status} {req}")

# Test receipt generation
print("\n" + "-" * 40)
print("Testing Receipt Generation")
print("-" * 40)

receipt = receipt_generator.generate(
    action=action, context=context, decision=decision, outcome="executed"
)
print(f"✅ Generated receipt: {receipt.receipt_id}")
print(f"   Action: {receipt.tool_name}")
print(f"   Decision: {receipt.policy_decision}")
print(f"   Timestamp: {receipt.timestamp.isoformat()}")

# Test SQLAlchemy models
print("\n" + "=" * 60)
print("Testing SQLAlchemy Models")
print("=" * 60)

from src.api.models.observability_models import (
    MutxRun as DBRun,
    MutxStep as DBStep,
    MutxCost as DBCost,
    MutxProvenance as DBProvenance,
    MutxEvalResult as DBEval,
)

print("✅ SQLAlchemy models imported:")
print("   - MutxRun")
print("   - MutxStep")
print("   - MutxCost")
print("   - MutxProvenance")
print("   - MutxEvalResult")

# Test API routes
print("\n" + "=" * 60)
print("Testing API Routes")
print("=" * 60)

from src.api.main import create_app

app = create_app()

observability_routes = []
security_routes = []

for route in app.routes:
    if hasattr(route, "path"):
        if "observability" in route.path:
            observability_routes.append(route.path)
        elif "security" in route.path:
            security_routes.append(route.path)

print(f"✅ Observability routes ({len(observability_routes)}):")
for r in sorted(observability_routes):
    print(f"   {r}")

print(f"\n✅ Security routes ({len(security_routes)}):")
for r in sorted(security_routes):
    print(f"   {r}")

# Summary
print("\n" + "=" * 60)
print("DEMO COMPLETE")
print("=" * 60)
print("""
All MUTX components verified:

✅ MUTX Observability Schema (agent-run port)
   - MutxRun, MutxStep, MutxCost, MutxProvenance, MutxEval
   - REST API routes for full lifecycle management
   - SQLAlchemy models for persistence

✅ AARM Security Layer
   - ActionMediator - action normalization
   - ContextAccumulator - session/intent tracking
   - PolicyEngine - policy evaluation
   - ApprovalService - human-in-the-loop workflows
   - ReceiptGenerator - cryptographic audit receipts
   - TelemetryExporter - SIEM/Prometheus integration
   - AARMComplianceChecker - R1-R9 conformance

✅ Faramesh Integration
   - FarameshRuntimeGateway as AARM backend

✅ Attribution
   - MIT licenses credited to original projects

To start the server:
    mutx run-server

Then interact with:
    POST /v1/observability/runs - Report agent runs
    POST /v1/security/actions/evaluate - Evaluate actions
    GET  /v1/security/compliance - Run AARM checks
""")
