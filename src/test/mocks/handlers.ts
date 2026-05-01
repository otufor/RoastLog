import { HttpResponse, http } from "msw";

export const handlers = [
  http.get("https://api.open-meteo.com/v1/forecast", () =>
    HttpResponse.json({
      current: {
        temperature_2m: 20.5,
        relative_humidity_2m: 55,
        weather_code: 0,
      },
    }),
  ),
];
