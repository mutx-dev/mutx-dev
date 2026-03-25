// Notarization script - placeholder for now
// In production, you would configure this with your Apple Developer credentials

module.exports = async (context) => {
  console.log('Skipping notarization - Developer ID certificate required');
  console.log('To enable notarization:');
  console.log('1. Enroll in Apple Developer Program');
  console.log('2. Create Developer ID Application certificate');
  console.log('3. Configure electron-builder with your credentials');
};
