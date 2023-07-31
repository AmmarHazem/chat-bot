import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: process.env.FB_PROJECT_ID,
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQ8DB/fhj9b1X3\nf0h+Oj4rWWrkDPCUb79MALqI+mU6brsHMjycTL/hki+zmNb15hRDkwkN/KZjkkal\n+33RL4vwXdYD53UsSsJ0LHlLhja7eeukMfdTtwmlcPiCNRDatnFEKSq4p0a9Ztyc\nIXlKS/btP1zr7Lxh/7qXic7tN8LlYIAeWwPCy92mYnoC2orrcV6K2DU/1wPQCLgZ\n8lJ+y8FnWsE8fZEObsVxbTj90xW68CJlxW3jnztRrvAEGMAjX7jOen3NV9EweIe/\nP2Jy2YH5Q5c13N7R4aTBYEjyIWNE1wAoJrTrOZCmeo/XVhh+mqfNN8Hs1O8W1HXT\n0PIWSe+xAgMBAAECggEABmQJPErKhpqIDXnwVtnIEZkWAHqSjvfAn+KBP9h7ICwi\n4ze/S/9xjMTAfnuHcx4GfBPKHopCqA2YMnbuzbBWnkplDNmFQtfY1jlql8ulbqRJ\nwN49PdkiQmZZDv3wiFJZ+2u9yaOLDTt17SLrQtOm3CiWSCo8ayeFAiIphrf5V0Yi\nu7VT/SAfmsNYfHr48X7QJVIZrsE+ww05zUF8nr3GWTSBjoHZPI9JkdbFsPdkqrnh\nHfGLr9lPqZ3icX1OGF7q5t3yb4xBDeKOKhfrduOKx0P5tdI+qJx+Ty1K5p/OXsAj\ntQXBSpP57otvbcoGcOyMgDwbeFFfIqOG2U9pGD1dAQKBgQD7XtDOhskrLT039WUJ\nINLNybyEVKrrpBajY+nRU8gv6X+/JTPxmr42Bnih9o/uPJVhWj99Hjg1uqoOnmT7\njnAVNlZPNIKYs4QO2Pu5MsKb2ngDhrzjdyPtf7y4flf1fjwVjhK8X5011buHTsew\nx2jaCEU03/WDkoAKw+rW3maFbQKBgQDUyU+S6gtJv7OVjzTjJ587SEPPKt8OkuqZ\n8LlODj9Xrc0U+MldGdy7D0D7n2zCztBWqyWMwwNAw7Omgzd4QPUPJuuIPVef/KPT\n0ViNYTOVok+vVNv62ADYgKsIzOjmhD3G6gTceuIgsklc4iGRhOWnW1iuo1CaSxGH\nMmt9x9kc1QKBgQC2tdBojagjbhqVVhU+cVFIq14PgctKxFaAJNuLf65+xOZJ9ayv\n7J5dfo6oiyNLM1YRERwcwZ5xz2BUh+U2w+3MPVa286AJhlJyyF0P3EmAJ2gciA87\n9xlyQ+rU32Dn2/2oXUBZE9adjuFkFGspn4gjEufa6v71x8KyEH3d+IHkcQKBgEeS\nny1vg/R+gs1fqg5uGWU7XXOlm/mu+TJmgi37JNs9HqpbNIAYXuKcsuLwMQklv3Yn\ngy3huopiSV9M66+LSeKa2Mauu3aY6BIrbHnBpDREsEDtbkDlvwMT5HPFWOGQwabS\nuGfg/Ya58WtItLnZ1dWBKEc1r7r2XSL4lqdsPV8xAoGAJytwcz+M71GKL8te/I0C\nZljWIkVYhYvVJOEBvpKYSLV92uIKaMRqDvWKdyHQpQ2fdOvLph2SP8rCv+h/pR3e\nTqQKFAOmpJR4Ztxi5MOy+PdvVoIZQByfogcxiV8Cf8xoMiW6X3ePCv8KvqGwder4\ngq0E7o1H4d8a46gHKADZKwM=\n-----END PRIVATE KEY-----\n", // process.env.FB_PRIVATE_KEY,
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: process.env.FB_AUTH_URL,
    token_uri: process.env.FB_TOKEN_URL,
    auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FB_CLIENT_CERT_URL,
    universe_domain: process.env.FB_UNIVERSE_DOMAIN,
  } as any),
  databaseURL: process.env.FB_DATABASE_URL,
});
