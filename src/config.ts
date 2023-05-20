type Config = {
  name: string;
  version: string;
  url: string;
};

export const config: Config = {
  name: "sapakan",
  version: "0.1.0",
  url: process.env.SAPAKAN_URL ?? "http://localhost:3000",
};
