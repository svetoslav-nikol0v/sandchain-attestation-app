import { createConfig } from "@0xsequence/connect";

export const config = createConfig("universal", {
  projectAccessKey: import.meta.env.VITE_SEQUENCE_PROJECT_ACCESS_KEY,
  position: "center",
  defaultTheme: "dark",
  signIn: {
    projectName: "sandchain-dev-test",
  },
  appName: "sandchain-dev-test",
  chainIds: [import.meta.env.VITE_CHAIN_ID],
  defaultChainId: import.meta.env.VITE_CHAIN_ID,
  google: false,
  walletConnect: false,
  coinbase: false,
  metaMask: false,
  sequence: true,
  wagmiConfig: {
    multiInjectedProviderDiscovery: false,
  },
});
