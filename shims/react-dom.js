// Stub for react-dom — not available in React Native
module.exports = {
  flushSync: (fn) => fn(),
  createPortal: (children) => children,
  unstable_batchedUpdates: (fn) => fn(),
};
