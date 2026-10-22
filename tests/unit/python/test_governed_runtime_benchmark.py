import importlib.util
from pathlib import Path

SCRIPT = (
    Path(__file__).resolve().parents[3] / "benchmarks" / "governed-runtime" / "run_benchmark.py"
)
spec = importlib.util.spec_from_file_location("governed_runtime_benchmark", SCRIPT)
bench = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench)


def decide(tool: str) -> str:
    action = bench.NormalizedAction(tool_name=tool, tool_args={}, agent_id="agent", session_id="s")
    return bench.build_engine().evaluate(action).decision


def test_policy_denies_allows_and_defers_by_tool_name():
    assert decide("delete_file") == bench.PolicyDecision.DENY
    assert decide("get_balance") == bench.PolicyDecision.ALLOW
    assert decide("send_money") == bench.PolicyDecision.DEFER


def test_wilson_interval_brackets_the_proportion():
    low, high = bench.wilson(408, 451)
    assert low < 408 / 451 < high
    assert bench.wilson(0, 0) is None


def test_attacker_call_matches_on_function_and_argument_containment():
    labels = [{"function": "send_email", "match": {"recipients": ["evil@x.com"]}}]
    hit = {"function": "send_email", "args": {"recipients": ["evil@x.com", "b@x.com"]}}
    miss = {"function": "send_email", "args": {"recipients": ["b@x.com"]}}
    assert bench.is_attacker_call(hit, labels)
    assert not bench.is_attacker_call(miss, labels)
