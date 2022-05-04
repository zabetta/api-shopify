import fastify from 'fastify'
import http from 'http';
import url from 'url';
import querystring from 'querystring';
import Shopify, { ApiVersion, AuthQuery } from '@shopify/shopify-api';
import { ConnectContactLens } from 'aws-sdk';

const { env } = require('typed-dotenv').config();

const server = fastify()

const { API_KEY, API_SECRET_KEY, SCOPES, SHOP, HOST, API_VERSION } = env

Shopify.Context.initialize({
  API_KEY,
  API_SECRET_KEY,
  SCOPES: [SCOPES],
  HOST_NAME: HOST.replace(/https:\/\//, ""),
  IS_EMBEDDED_APP: false,
  API_VERSION: ApiVersion.April22 // all supported versions are available, as well as "unstable" and "unversioned"
});

const ACTIVE_SHOPIFY_SHOPS: { [key: string]: string | undefined } = {};

async function onRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
): Promise<void> {
  const {headers, url: req_url = ''} = request;
  const pathName: string | null = url.parse(req_url).pathname;
  const queryString: string = String(url.parse(req_url).query);
  const query: Record<string, any> = querystring.parse(queryString);

  switch (pathName) {
    case '/login':
    // process login action
    try {
      const authRoute = await Shopify.Auth.beginAuth(
        request,
        response,
        SHOP,
        '/auth/callback',
        false,
      );

      response.writeHead(302, {Location: authRoute});
      response.end();
    } catch (e: any) {
      console.log(e);

      response.writeHead(500);
      if (e instanceof Shopify.Errors.ShopifyError) {
        response.end(e.message);
      } else {
        response.end(`Failed to complete OAuth process: ${e.message}`);
      }
    }
    break;
    // end of if (pathName === '/login')
    case "/auth/callback":
    try {
      const session = await Shopify.Auth.validateAuthCallback(request, response, query as AuthQuery);
      ACTIVE_SHOPIFY_SHOPS[SHOP] = session.scope;

      console.log(session.accessToken);
      // all good, redirect to '/'
      const searchParams = new URLSearchParams(request.url);
      const host = searchParams.get("host");
      const shop = searchParams.get("shop");
      response.writeHead(302, { Location: `/?host=${host}&shop=${shop}` });
      response.end();
    }
    catch (e : any) {
      console.log(e);

      response.writeHead(500);
      if (e instanceof Shopify.Errors.ShopifyError) {
        response.end(e.message);
      }
      else {
        response.end(`Failed to complete OAuth process: ${e.message}`);
      }
    }
    break;
  // end of if (pathName === '/auth/callback'')
    default:
      // This shop hasn't been seen yet, go through OAuth to create a session
      if (ACTIVE_SHOPIFY_SHOPS[SHOP] === undefined) {
        // not logged in, redirect to login
        response.writeHead(302, {Location: `/login`});
        response.end();
      } else {
        response.write('Hello world!');
        // Load your app skeleton page with App Bridge, and do something amazing!
      }
      return;
  } // end of default path
} // end of onRequest()

// http.createServer(onRequest).listen(3000);
