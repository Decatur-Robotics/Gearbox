declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
      GOOGLE_ID: string;
      GOOGLE_SECRET: string;
      GITHUB_SECRET: string;
      GITHUB_ID: string;

      MONGODB_URI: string;
      DB: string;

      TBA_URL: string;
      TBA_KEY: string;

      TOA_URL: string;
      TOA_KEY: string;
      TOA_APP_ID: string;

      API_URL: string;
      API_KEY: string;

      DEFAULT_IMAGE: string;
      IMAGE_UPLOAD_DIR: string;

      FILL_TEAMS: string;

      SLACK_KEY: string;
      SLACK_CLIENT_ID: string;
      SLACK_CLIENT_SECRET: string;
      SLACK_CHANNEL: string;

      NEXT_PUBLIC_API_URL: string;

      NODE_ENV: "development" | "production";
    }
  }
}
export {};
