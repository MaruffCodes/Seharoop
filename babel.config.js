module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // Use the reanimated plugin directly (it should work after installing worklets-core)
    'react-native-reanimated/plugin',
  ],
};