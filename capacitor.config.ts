import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aihub.app',
  appName: 'AI Hub',
  webDir: 'dist',
  android: {
    buildOptions: {
      releaseType: 'APK'
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
