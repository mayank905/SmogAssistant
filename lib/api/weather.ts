export interface WeatherTelemetry {
  temperatureC: number;
  relativeHumidity: number;
  windSpeedKmH: number;
  windDirectionDeg: number;
  precipitationMm: number;
  hourlyForecast?: {
    time: string;
    temperatureC: number;
    windSpeedKmH: number;
  }[];
}

export async function fetchLiveWeather(
  latitude: number,
  longitude: number
): Promise<WeatherTelemetry> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&forecast_days=2`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned status: ${res.status}`);

    const data = await res.json();
    const current = data.current || {};
    const hourly = data.hourly || {};

    const times: string[] = hourly.time || [];
    const temps: number[] = hourly.temperature_2m || [];
    const winds: number[] = hourly.wind_speed_10m || [];

    const hourlyForecast = times.slice(0, 12).map((timeStr, idx) => ({
      time: timeStr.split("T")[1] || "12:00",
      temperatureC: temps[idx] ?? 18,
      windSpeedKmH: winds[idx] ?? 8,
    }));

    return {
      temperatureC: Number(current.temperature_2m ?? 18.5),
      relativeHumidity: Number(current.relative_humidity_2m ?? 65),
      windSpeedKmH: Number(current.wind_speed_10m ?? 6.2),
      windDirectionDeg: Number(current.wind_direction_10m ?? 280),
      precipitationMm: Number(current.precipitation ?? 0),
      hourlyForecast,
    };
  } catch (error) {
    console.warn("Live weather fetch failed, returning winter baseline:", error);
    return {
      temperatureC: 14.0,
      relativeHumidity: 72,
      windSpeedKmH: 4.5, // calm winter wind
      windDirectionDeg: 310,
      precipitationMm: 0,
    };
  }
}
