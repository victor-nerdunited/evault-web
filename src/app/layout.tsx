import { Poppins } from "next/font/google";
import "./globals.css";
import "@/fonts/line-awesome-1.3.0/css/line-awesome.css";
import "@/styles/index.scss";
import "rc-slider/assets/index.css";
import Footer from "@/shared/Footer/Footer";
import SiteHeader from "@/app/SiteHeader";
import CommonClient from "./CommonClient";
import { Web3Provider } from "@/lib/web3/Web3Provider";
import { CheckoutProvider } from "@/lib/CheckoutProvider";
// import {
//   ChakraBaseProvider,
//   ChakraProvider,
//   extendBaseTheme,
//   Progress,
//   withDefaultColorScheme,
// } from "@chakra-ui/react";
//import { ChakraProvider } from "@chakra-ui/provider";
import { PriceWarning } from "@/components/PriceWarning";
import { H } from 'highlight.run';

H.init('lgxpvkpd', {
	serviceName: "frontend-app",
	tracingOrigins: true,
	networkRecording: {
		enabled: true,
		recordHeadersAndBody: true,
		urlBlocklist: [
			// insert full or partial urls that you don't want to record here
		],
	},
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// const theme = extendBaseTheme({
//   withDefaultColorScheme: {
//     colorScheme: "blue",
//   },
//   components: {
//     Progress,
//   },
// });

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  return (
    <html lang="en" dir="" className={poppins.className}>
      <body className="bg-white text-base dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        {/* <ChakraProvider>
          <Progress size="xs" isIndeterminate /> */}
          <div>
            <Web3Provider>
              <CheckoutProvider>
                <SiteHeader />
                {children}
                <PriceWarning />
                <Footer />
              </CheckoutProvider>
            </Web3Provider>
          </div>
          <CommonClient />
        {/* </ChakraProvider> */}
      </body>
    </html>
  );
}
