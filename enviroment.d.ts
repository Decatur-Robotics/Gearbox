declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Environment variables are always strings

      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
      NEXT_PUBLIC_API_URL: string;

      GOOGLE_ID: string;
      GOOGLE_SECRET: string;

      GITHUB_ID: string;
      GITHUB_SECRET: string;

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

      SLACK_BOT_TOKEN: string;
      NEXT_PUBLIC_SLACK_CLIENT_ID: string;
      SLACK_CLIENT_SECRET: string;
      SLACK_APP_TOKEN: string;
      SLACK_SIGNING_SECRET: string;
      SLACK_STATE_SECRET: string;
      SLACK_PORT: string;

      NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: string;

      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASSWORD: string;
      SMTP_FROM: string;

      RESEND_AUDIENCE_ID: string;

      NEXT_PUBLIC_FORCE_OFFLINE_MODE: string;

      NEXT_PUBLIC_BUILD_TIME: string;

      DEVELOPER_EMAILS: string;

      NODE_ENV: "development" | "production";
    }
  }
}
export {};
