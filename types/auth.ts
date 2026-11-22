export interface KeyValidationResult {
  valid: boolean;
  message: string;
  stationName?: string;
}

export interface ApiKeysState {
  geminiKey: string;
  waqiToken: string;
  isGeminiValid: boolean;
  isWaqiValid: boolean;
  isCheckingGemini?: boolean;
  isCheckingWaqi?: boolean;
  geminiMessage?: string;
  waqiMessage?: string;
}
