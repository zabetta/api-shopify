declare global {
  namespace NodeJS {
    interface ProcesssEnv {
      SHOP: string;
      SCOPES: string;
      API_KEY: string;
      API_SECRET_KEY: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}