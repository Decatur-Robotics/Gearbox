declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NEXTAUTH_URL: string;
        NEXTAUTH_SECRET: string;
        GOOGLE_ID: string;
        GOOGLE_SECRET: string;

        MONGO_DB_URI: string;
        DB: string;

        TBA_URL: string;
        TBA_KEY: string;

        API_URL: string;
        API_KEY: string;

        DEFAULT_IMAGE: string;

        FILL_TEAMS: string;

        NODE_ENV: 'development' | 'production';

      }
    }
  }  
export {}