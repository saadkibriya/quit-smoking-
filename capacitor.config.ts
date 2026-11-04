import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unlit.app',
  appName: 'Unlit',
  webDir: 'dist',
  // The app is fully offline-capable (localStorage). The AI coach uses a
  // configurable backend URL. Set VITE_API_BASE_URL in your env to point to
  // your deployed backend; leave empty to use the offline rules engine only.
  server: {
    androidScheme: 'https',
    // If you deploy the Express backend, set this to its public URL:
    // url: 'https://your-backend.example.com',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // debug build by default
    },
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#000000',
    },
  },
};

export default config;
