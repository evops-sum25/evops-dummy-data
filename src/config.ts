import dotenv from "dotenv";

const API_URL: string = "API_URL";

export interface Config {
  apiUrl: URL;
}

export function loadConfig(): Config {
  dotenv.configDotenv();
  const apiUrlRaw = process.env["API_URL"];
  if (apiUrlRaw === undefined) {
    throw new Error(`variable ${API_URL} is not set`);
  }
  return {
    apiUrl: new URL(apiUrlRaw),
  };
}
