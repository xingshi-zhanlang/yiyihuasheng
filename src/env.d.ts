/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
      cf?: IncomingRequestCfProperties;
      ctx: ExecutionContext;
    };
  }
}
