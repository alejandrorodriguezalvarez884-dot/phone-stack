// iOS 27 stops apps at launch unless they adopt the UIScene life cycle, and the SDK 57 prebuild
// template still creates the window in the app delegate. Expo ships ExpoAppSceneDelegate for this;
// this plugin wires it up: a scene manifest in Info.plist and an app delegate that leaves the window
// to the scene delegate.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const WINDOW_SETUP = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

function withSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') throw new Error('withSceneLifecycle: expected a Swift AppDelegate');
    let src = cfg.modResults.contents;
    if (src.includes('class SceneDelegate')) return cfg;

    if (!src.includes('class AppDelegate: ExpoAppDelegate {') || !WINDOW_SETUP.test(src)) {
      throw new Error('withSceneLifecycle: the AppDelegate template changed, update plugins/withSceneLifecycle.js');
    }
    src = src
      .replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {')
      // The scene delegate creates the window and starts React Native into it.
      .replace(WINDOW_SETUP, '\n');
    src += '\n// Scene life cycle (required on iOS 27), see plugins/withSceneLifecycle.js.\nclass SceneDelegate: ExpoAppSceneDelegate {}\n';
    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = withSceneLifecycle;
