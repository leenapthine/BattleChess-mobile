module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required by Reanimated 4 — must be the last plugin in the list.
      'react-native-worklets/plugin',
    ],
  };
};
