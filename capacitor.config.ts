import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myjiujitsu.kiosk',
  appName: 'My jiu-jitsu Kiosk',
  webDir: 'public',
  server: {
    url: 'https://jiujitsu-management.vercel.app',
    cleartext: true
  }
};

export default config;
