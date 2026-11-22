import { WeatherTelemetry } from "./api/weather";

export interface InversionAnalysis {
  riskLevel: "Low" | "Medium" | "High";
  dispersionScore: number; // 0 to 100 (100 = excellent ventilation, 0 = severe stagnant trap)
  synopsis: string;
  meteorologicalDriver: string;
}

/**
 * Computes thermal inversion risk by analyzing ambient surface temperature,
 * relative humidity, and wind speed.
 * Cold temperatures (<15°C) combined with calm wind (<6 km/h) strongly indicate
 * a shallow nocturnal boundary layer that traps pollutants.
 */
export function analyzeThermalInversion(
  weather: WeatherTelemetry,
  currentAqi: number
): InversionAnalysis {
  const { temperatureC, windSpeedKmH, relativeHumidity } = weather;

  // Stagnation factor based on wind speed
  let windScore = 50;
  if (windSpeedKmH < 5) {
    windScore = 10; // near calm, severe stagnation
  } else if (windSpeedKmH < 10) {
    windScore = 30; // low ventilation
  } else if (windSpeedKmH < 20) {
    windScore = 70; // moderate dispersion
  } else {
    windScore = 95; // strong breeze, high dispersion
  }

  // Thermal trapping factor based on cold temperature & high humidity (radiation fog conditions)
  let thermalScore = 50;
  if (temperatureC < 12 && relativeHumidity > 70) {
    thermalScore = 15; // dense winter smog/fog trapping
  } else if (temperatureC < 18) {
    thermalScore = 40;
  } else {
    thermalScore = 80;
  }

  const dispersionScore = Math.round((windScore * 0.6) + (thermalScore * 0.4));

  if (dispersionScore < 30 || currentAqi > 350) {
    return {
      riskLevel: "High",
      dispersionScore,
      synopsis: `High Thermal Inversion Risk: Calm winds (${windSpeedKmH} km/h) and low morning temperatures (${temperatureC}°C) create a cold stagnant boundary layer, trapping toxic combustion particles near breathing level.`,
      meteorologicalDriver: "Atmospheric Radiative Cooling & Calm Surface Wind",
    };
  } else if (dispersionScore < 60 || currentAqi > 180) {
    return {
      riskLevel: "Medium",
      dispersionScore,
      synopsis: `Moderate Stagnation: Wind speeds (${windSpeedKmH} km/h) allow limited horizontal dispersion. Air quality is expected to improve between 12:00 PM and 04:00 PM as solar heating thins the inversion ceiling.`,
      meteorologicalDriver: "Partial Convective Mixing",
    };
  } else {
    return {
      riskLevel: "Low",
      dispersionScore,
      synopsis: `Healthy Atmospheric Mixing: Sufficient wind speed (${windSpeedKmH} km/h) and thermal convection ensure swift natural ventilation of surface pollutants.`,
      meteorologicalDriver: "Active Turbulent Dispersion",
    };
  }
}
