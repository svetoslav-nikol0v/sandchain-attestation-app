import { useState, useEffect } from "react";
import { ethers } from "ethers";
import type { Signer } from "ethers";
import { useWalletClient } from "wagmi";
import { useAccount } from "wagmi";
import { EAS_CONTRACT_ABI } from "../abi";

export const useEASContract = () => {
  const [easContract, setEasContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [recipient, setRecipient] = useState<string>("");
  const [isPreparingEnvironment, setIsPreparingEnvironment] =
    useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const prepareEnvironment = async () => {
    setIsPreparingEnvironment(true);
    setError("");

    try {
      if (!address || !walletClient) {
        setError("Please connect your wallet to continue");
        setIsPreparingEnvironment(false);
        return;
      }

      setRecipient(address);
      const provider = new ethers.BrowserProvider(walletClient);

      // Validate environment variables
      const easContractAddress = import.meta.env.VITE_EAS_CONTRACT_ADDRESS;
      if (!easContractAddress) {
        setError("EAS contract address not available");
        setIsPreparingEnvironment(false);
        return;
      }

      // Check contract deployment
      const hasContractDeployed = await provider.getCode(easContractAddress);
      if (hasContractDeployed === "0x") {
        setError("EAS contract not deployed on this network");
        setIsPreparingEnvironment(false);
        return;
      }

      // Setup signer and contract
      const signer = await provider.getSigner();
      if (!signer) {
        setError("Failed to get signer");
        setIsPreparingEnvironment(false);
        return;
      }
      setSigner(signer);

      const contract = new ethers.Contract(
        easContractAddress,
        EAS_CONTRACT_ABI,
        signer
      );
      setEasContract(contract);

      setIsPreparingEnvironment(false);
      setError("");
    } catch (error) {
      setError("Error preparing environment. See console for details.");
      setIsPreparingEnvironment(false);
      console.error(error);
    }
  };

  useEffect(() => {
    prepareEnvironment();
  }, [address, walletClient]);

  const reset = () => {
    setSigner(null);
    setEasContract(null);
    setRecipient("");
    setIsPreparingEnvironment(false);
    setError("");
  };

  return {
    easContract,
    signer,
    recipient,
    isPreparingEnvironment,
    error,
    reset,
  };
};
