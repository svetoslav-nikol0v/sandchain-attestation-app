import { ethers } from "ethers";

export const roles: string[] = ["creator", "fan", "investor", "builder"];

export const warningsSelectorsMap: Record<string, string> = {
  [ethers.id("AlreadyAttested()").slice(0, 10)]: "Already attested!",
  [ethers.id("InvalidSignature()").slice(0, 10)]: "Invalid signature!",
  [ethers.id("DeadlineExpired()").slice(0, 10)]: "Deadline expired!",
  [ethers.id("InvalidExpirationTime()").slice(0, 10)]:
    "Invalid expiration time!",
  [ethers.id("InvalidSchema()").slice(0, 10)]: "Invalid schema!",
  [ethers.id("InvalidNonce()").slice(0, 10)]: "Invalid nonce!",
};
