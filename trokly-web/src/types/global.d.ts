export {};

declare global {
  interface Window {
    /** WhatsPAY conversion pixel — fire a conversion event */
    wpTrackConversion?: (event?: string) => void;
  }
}
