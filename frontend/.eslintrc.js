module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    'testing-library/no-wait-for-multiple-assertions': 'off',
    'testing-library/no-unnecessary-act': 'off',
    'testing-library/no-node-access': 'off',
    'no-unused-vars': 'off'
  }
};