/**
 * Wallet apps a card can be saved to. None can be enabled from the frontend alone:
 * every pass must be signed server-side with that wallet's issuer account (Google
 * Wallet issuer + service account; Apple Pass Type ID certificate for .pkpass, which
 * Pass2U/WalletPasses also import; Samsung/Huawei need partner approval). Turn
 * `available` on once the backend can issue that wallet's pass (Google: infra/google-wallet).
 */
import { googleWalletEnabled } from "../../../services/businessCardAPI";

export interface WalletOption {
  id: "apple" | "google" | "samsung" | "huawei" | "pass2u" | "walletpasses";
  name: string;
  color: string;
  available: boolean;
}

export const WALLETS: WalletOption[] = [
  { id: "apple", name: "Apple Wallet", color: "#111111", available: false },
  // On once VITE_GOOGLE_WALLET_URL points at the infra/google-wallet backend route.
  { id: "google", name: "Google Wallet", color: "#1a73e8", available: googleWalletEnabled },
  { id: "samsung", name: "Samsung Wallet", color: "#1428a0", available: false },
  { id: "huawei", name: "Huawei Wallet", color: "#cf0a2c", available: false },
  { id: "pass2u", name: "Pass2U Wallet", color: "#f59e0b", available: false },
  { id: "walletpasses", name: "WalletPasses", color: "#10b981", available: false },
];
