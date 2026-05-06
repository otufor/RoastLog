import { useQuery } from "@tanstack/react-query";
import {
  type OpenMeteoResponse,
  OpenMeteoResponseSchema,
} from "@/schemas/openMeteo";

export interface WeatherSnapshot {
  outdoorTempC: number;
  outdoorHumidity: number;
  weatherCode: number;
}

async function fetchWeather(
  lat: number,
  lon: number,
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code",
  );

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

  const json: OpenMeteoResponse = OpenMeteoResponseSchema.parse(
    await res.json(),
  );
  return {
    outdoorTempC: json.current.temperature_2m,
    outdoorHumidity: json.current.relative_humidity_2m,
    weatherCode: json.current.weather_code,
  };
}

export function useWeather(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: () => fetchWeather(lat as number, lon as number),
    enabled: lat !== null && lon !== null,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
