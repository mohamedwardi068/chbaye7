import Constants from "expo-constants";

export const getBackendUrl = (): string => {
  // If explicitly defined via environment variable, use it.
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    if (domain.startsWith("http://") || domain.startsWith("https://")) {
      return domain;
    }
    // Decide protocol based on localhost or IP address vs standard domain
    const isLocal = domain.includes("localhost") || !!domain.match(/^\d+\.\d+\.\d+\.\d+/);
    const protocol = isLocal ? "http" : "https";
    return `${protocol}://${domain}`;
  }

  // Fallback: Auto-detect local IP of the host machine from expo-constants
  // hostUri is usually something like 192.168.1.15:8081 when running expo start
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:8080`;
  }

  // Final fallback
  return "http://localhost:8080";
};
