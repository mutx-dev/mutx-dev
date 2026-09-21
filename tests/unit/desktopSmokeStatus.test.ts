import { getSmokeFailure } from '../../desktop/main/smokeStatus.cjs';

describe('desktop release smoke qualification', () => {
  it('rejects a loaded window when its embedded server failed', () => {
    expect(getSmokeFailure({ uiServer: { ready: false }, bridge: { ready: true } }))
      .toBe('Embedded UI server is not ready');
  });
  it('rejects an unavailable local bridge', () => {
    expect(getSmokeFailure({ uiServer: { ready: true }, bridge: { ready: false } }))
      .toBe('Desktop bridge is not ready');
  });
  it('allows an operational local app while the remote backend is unavailable', () => {
    expect(getSmokeFailure({ uiServer: { ready: true }, bridge: { ready: true }, apiHealth: 'unavailable' }))
      .toBeNull();
  });
});
