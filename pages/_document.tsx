import { Html, Head, Main, NextScript } from "next/document";
import PwaConfig from "@/components/PwaConfig";

export default function Document() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <PwaConfig />
        <meta name="slack-app-id" content="A07BWTTLWDQ" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body>
        <Main />

        <NextScript />
      </body>
    </Html>
  );
}
