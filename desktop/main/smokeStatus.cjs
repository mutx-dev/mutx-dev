function getSmokeFailure(state) {
  if (state.uiServer?.ready !== true) return "Embedded UI server is not ready";
  if (state.bridge?.ready !== true) return "Desktop bridge is not ready";
  return null;
}

module.exports = { getSmokeFailure };
