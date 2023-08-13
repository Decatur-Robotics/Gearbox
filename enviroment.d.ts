declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NEXTAUTH_URL: string;
        GOOGLE_ID: string;
        GOOGLE_SECRET: string;

        MONGO_DB_URI: string;
        DB: string;

        TBA_URL: string;
        TBA_KEY: string;

        API_URL: string;

        DEFAULT_IMAGE: string;

        FILL_TEAMS: boolean;

        NODE_ENV: 'development' | 'production';

      }
    }
  }  
export {}