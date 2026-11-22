export type CpcbCategory = 
  | "Good" 
  | "Satisfactory" 
  | "Moderate" 
  | "Poor" 
  | "Very Poor" 
  | "Severe";

export interface PollutantReading {
  value: number;
  unit: string;
  subIndex?: number;
}

export interface AirQualityTelemetry {
  location: {
    city: string;
    latitude: number;
    longitude: number;
    stationName?: string;
  };
  timestamp: string;
  overallAqi: number;
  cpcbCategory: CpcbCategory;
  primaryPollutant: string;
  pollutants: {
    pm25: PollutantReading;
    pm10: PollutantReading;
    no2?: PollutantReading;
    so2?: PollutantReading;
    o3?: PollutantReading;
    co?: PollutantReading;
  };
  hourlyForecast?: {
    time: string;
    aqi: number;
    pm25: number;
  }[];
  isSimulated?: boolean;
  source: "open-meteo" | "waqi" | "scenario-preset";
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  aqi: number;
  category: CpcbCategory;
  description: string;
  telemetry: AirQualityTelemetry;
}
