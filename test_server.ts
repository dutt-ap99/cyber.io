import { getPlatformResolution } from './services/resolutionService.js';

getPlatformResolution('https://tumblr.com/privacy').then(console.log).catch(console.error);
