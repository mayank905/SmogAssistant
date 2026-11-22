import { describe, it, expect } from "vitest";
import { analyzeThermalInversion } from "./weather-fusion";
import { WeatherTelemetry } from "./api/weather";

describe("Weather-Air Quality Fusion Engine", () => {
  it("detects High Thermal Inversion Risk for cold, calm winter smog conditions", () => {
    const winterStagnantWeather: WeatherTelemetry = {
      temperatureC: 9.5,
      relativeHumidity: 85,
      windSpeedKmH: 3.2, // very calm
      windDirectionDeg: 300,
      precipitationMm: 0,
    };

    const analysis = analyzeThermalInversion(winterStagnantWeather, 420);
    expect(analysis.riskLevel).toBe("High");
    expect(analysis.dispersionScore).toBeLessThan(35);
    expect(analysis.synopsis).toContain("Calm winds");
  });

  it("detects Low Inversion Risk for windy, warm conditions", () => {
    const freshVentilatedWeather: WeatherTelemetry = {
      temperatureC: 26.0,
      relativeHumidity: 45,
      windSpeedKmH: 22.5, // strong breeze
      windDirectionDeg: 180,
      precipitationMm: 0,
    };

    const analysis = analyzeThermalInversion(freshVentilatedWeather, 45);
    expect(analysis.riskLevel).toBe("Low");
    expect(analysis.dispersionScore).toBeGreaterThan(60);
    expect(analysis.meteorologicalDriver).toContain("Turbulent Dispersion");
  });
});
