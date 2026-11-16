/**
 * Configure la signature de production, les fentes ABI et le numéro de version
 * à partir d’un keystore conservé hors du dépôt.
 */
const { withAppBuildGradle, withGradleProperties, withAndroidManifest } = require('expo/config-plugins');

const KEYSTORE_PROPS = '/workspace/mobile/_keystore/keystore.properties';

const SPLITS = `
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a"
            universalApk true
        }
    }
`;

const OUTPUTS = `
    applicationVariants.all { variant ->
        variant.outputs.each { output ->
            def abi = output.getFilter(com.android.build.OutputFile.ABI)
            def codes = ["armeabi-v7a": 1, "arm64-v8a": 2]
            if (abi != null && codes.containsKey(abi)) {
                output.versionCodeOverride = defaultConfig.versionCode * 10 + codes.get(abi)
            } else if (abi == null) {
                output.versionCodeOverride = defaultConfig.versionCode * 10
            }
        }
    }
`;

const SIGNING = `
        def ksFile = new File("${KEYSTORE_PROPS}")
        if (ksFile.exists()) {
            def ks = new Properties()
            ksFile.withInputStream { ks.load(it) }
            release {
                storeFile file(ks["storeFile"])
                storePassword ks["storePassword"]
                keyAlias ks["keyAlias"]
                keyPassword ks["keyPassword"]
            }
        }
`;

function withAndroidRelease(config) {
  config = withGradleProperties(config, (cfg) => {
    const set = (key, value) => {
      const i = cfg.modResults.findIndex((item) => item.type === 'property' && item.key === key);
      const prop = { type: 'property', key, value };
      if (i >= 0) cfg.modResults[i] = prop;
      else cfg.modResults.push(prop);
    };
    set('android.enableMinifyInReleaseBuilds', 'true');
    set('android.enableShrinkResourcesInReleaseBuilds', 'true');
    set('reactNativeArchitectures', 'armeabi-v7a,arm64-v8a');
    set('hermesEnabled', 'true');
    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (!g.includes('abiFilters')) {
      g = g.replace(
        /namespace 'bj\.zemtarif\.app'/,
        `namespace 'bj.zemtarif.app'`,
      );
    }
    if (!g.includes('abiFilters')) {
      g = g.replace(
        /defaultConfig \{/,
        'defaultConfig {\n        ndk { abiFilters \"armeabi-v7a\", \"arm64-v8a\" }',
      );
    }
    if (!g.includes('splits {')) {
      g = g.replace(/packagingOptions\s*\{/, SPLITS + '\n    packagingOptions {');
    }
    if (!g.includes('versionCodeOverride')) {
      g = g.replace(/androidResources\s*\{/, OUTPUTS + '\n    androidResources {');
    }
    if (!g.includes('KEYSTORE_PROPS') && !g.includes('keystore.properties')) {
      g = g.replace(
        /signingConfigs\s*\{\s*debug\s*\{/,
        'signingConfigs {\n' + SIGNING + '\n        debug {',
      );
      g = g.replace(
        /buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig signingConfigs\.debug/,
        (m) => m.replace('signingConfig signingConfigs.debug',
          'signingConfig ksFile.exists() ? signingConfigs.release : signingConfigs.debug'),
      );
      // The replace above is fragile because ksFile is inside signingConfigs.
      // A second, more explicit substitution:
      g = g.replace(
        /release \{(\s*)\/\/ Caution![\s\S]*?signingConfig signingConfigs\.debug/,
        'release {\n            def ksFile = new File("' + KEYSTORE_PROPS + '")\n            signingConfig ksFile.exists() ? signingConfigs.release : signingConfigs.debug',
      );
    }
    cfg.modResults.contents = g;
    return cfg;
  });

  return config;
}

module.exports = withAndroidRelease;
