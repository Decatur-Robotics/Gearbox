import { Html, Head, Main, NextScript } from "next/document";
import PwaConfig from "@/components/PwaConfig";



export default function Document() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <PwaConfig />
      </Head>
      <body>
        <Main />

        <NextScript />
      </body>
    </Html>
  );
}
