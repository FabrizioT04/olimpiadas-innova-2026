// Pages _headers applies to static assets; Functions need these headers too.
export const onRequest: PagesFunction = async ({ next }) => {
  const original = await next();
  const response = new Response(original.body, original);
  // An additional policy preserves the stricter policy on image responses.
  response.headers.append('Content-Security-Policy', "frame-ancestors 'none'");
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
};
