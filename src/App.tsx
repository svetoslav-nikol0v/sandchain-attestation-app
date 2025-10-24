import {
  SchemaEncoder,
  ZERO_BYTES32,
} from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import type { Signer, TypedDataField } from "ethers";
import { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { useOpenConnectModal } from "@0xsequence/connect";
import { useAccount, useDisconnect } from "wagmi";
import { EAS_CONTRACT_ABI } from "./abi";
import { roles, warningsSelectorsMap } from "./constants";

function App() {
  const [isPreparingEnvironment, setIsPreparingEnvironment] =
    useState<boolean>(false);
  const [attestationSchemaUid, setAttestationSchemaUid] = useState<string>("");
  const [easContract, setEasContract] = useState<ethers.Contract | null>(null);
  const [manifestoSchema, setManifestoSchema] = useState<string>("");
  const [manifestoId, setManifestoId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [signer, setSigner] = useState<Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>("");
  const [easContractAddress, setEasContractAddress] = useState<string>("");
  const [selector, setSelector] = useState<string>("");
  const [warningMeaning, setWarningMeaning] = useState<string>("");

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpenConnectModal } = useOpenConnectModal();

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
      setChainId(walletClient?.chain?.id);
      setNetworkName(walletClient?.chain.name);

      const provider = new ethers.BrowserProvider(walletClient);

      if (!import.meta.env.VITE_ATTESTATION_SCHEMA_UID) {
        setError("Attestation schema UID not available");
        setIsPreparingEnvironment(false);
        return;
      }

      setAttestationSchemaUid(import.meta.env.VITE_ATTESTATION_SCHEMA_UID);

      if (!import.meta.env.VITE_MANIFESTO_SCHEMA) {
        setError("Manifesto schema not available");
        setIsPreparingEnvironment(false);
        return;
      }
      setManifestoSchema(import.meta.env.VITE_MANIFESTO_SCHEMA);

      const easContractAddress = import.meta.env.VITE_EAS_CONTRACT_ADDRESS;
      if (!easContractAddress) {
        setError("EAS contract address not available");
        setIsPreparingEnvironment(false);
        return;
      }
      setEasContractAddress(easContractAddress);

      const hasContractDeployed = await provider.getCode(easContractAddress);

      if (hasContractDeployed === "0x") {
        setError("EAS contract not deployed on this network");
        setIsPreparingEnvironment(false);
        return;
      }

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

      setManifestoId(
        ethers.keccak256(ethers.toUtf8Bytes("SANDCHAIN_MANIFESTO_V1"))
      );

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

  async function attest(role: string) {
    setIsLoading(true);
    setError("");

    if (!easContract) {
      setError("EAS contract not available.");
      setIsLoading(false);
      return;
    }

    if (!signer) {
      setError("Signer not available.");
      setIsLoading(false);
      return;
    }

    const schemaEncoder = new SchemaEncoder(manifestoSchema);
    const encodedData = schemaEncoder.encodeData([
      { name: "manifestoId", value: manifestoId, type: "bytes32" },
      { name: "role", value: role, type: "string" },
    ]);

    try {
      const nonce = await easContract.getNonce(recipient);
      if (!nonce) {
        setError("Failed to get nonce");
        setIsLoading(false);
        return;
      }

      const onchainName: string = await easContract.getName();
      const onchainVersion: string = await easContract.version();
      const verifyingContract: string = easContractAddress;

      const domain = {
        name: onchainName,
        version: onchainVersion,
        chainId,
        verifyingContract,
      };

      const value = {
        attester: recipient,
        schema: attestationSchemaUid,
        recipient,
        expirationTime: 0n,
        revocable: false,
        refUID: ZERO_BYTES32,
        data: encodedData,
        value: 0n,
        nonce,
        deadline: 0n,
      };

      const types: Record<string, Array<TypedDataField>> = {
        Attest: [
          { name: "attester", type: "address" },
          { name: "schema", type: "bytes32" },
          { name: "recipient", type: "address" },
          { name: "expirationTime", type: "uint64" },
          { name: "revocable", type: "bool" },
          { name: "refUID", type: "bytes32" },
          { name: "data", type: "bytes" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint64" },
        ],
      };

      const signature = await signer.signTypedData(domain, types, value);

      const attestByERC1271DelegationRequest = {
        schema: attestationSchemaUid,
        data: {
          recipient: value.recipient,
          expirationTime: value.expirationTime,
          revocable: value.revocable,
          refUID: value.refUID,
          data: value.data,
          value: value.value,
        },
        signature: signature,
        attester: value.attester,
        deadline: value.deadline,
      };

      const tx = await easContract.attestByERC1271Delegation(
        attestByERC1271DelegationRequest,
        {
          gasLimit: 0n,
        }
      );
      console.log("Transaction hash:", tx);

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
    } catch (error) {
      setError(
        "Error occurred while processing the transaction. See console for details."
      );
      console.error(error);
    }
    setIsLoading(false);
  }

  const disconnectWallet = () => {
    setSigner(null);
    setEasContract(null);
    setRecipient("");
    setChainId(null);
    setNetworkName("");
    setEasContractAddress("");
    setManifestoId("");
    setManifestoSchema("");
    setAttestationSchemaUid("");
    setIsPreparingEnvironment(false);
    setError("");
    setIsLoading(false);
    disconnect();
  };

  const getWarningMeaning = (warningSelector: string): void => {
    setWarningMeaning(
      warningsSelectorsMap[warningSelector] || "Unknown warning bytes signature"
    );
  };

  const handleClearWarning = () => {
    setWarningMeaning("");
    setSelector("");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
        }}
      >
        {isPreparingEnvironment && <div>Preparing environment...</div>}
        {!isPreparingEnvironment && (
          <>
            {!address ? (
              <div>
                <p>Please connect your wallet to continue</p>
                <button onClick={() => setOpenConnectModal(true)}>
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "20px" }}>
                  <h4>Wallet Details:</h4>
                  <p>Connected address: {address}</p>
                  <h4>Network Details:</h4>
                  <p>Chain ID: {chainId}</p>
                  <p>Network Name: {networkName}</p>
                  <button onClick={disconnectWallet}>Disconnect</button>
                </div>

                <div>
                  <h3>Sign the Manifesto as:</h3>
                  {roles.map((role: string) => (
                    <button
                      key={role}
                      onClick={() => attest(role)}
                      disabled={isLoading}
                      style={{ marginRight: "10px", marginBottom: "10px" }}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {isLoading && <div>Processing transaction...</div>}
                {error && <div style={{ color: "red" }}>{error}</div>}

                <div
                  style={{
                    marginBottom: "20px",
                    marginTop: "20px",
                    maxWidth: "500px",
                  }}
                >
                  If you see a warning in the sequence app while signing the
                  transaction, copy the bytes signature of the warning and paste
                  it to see what it means
                </div>
                <input
                  type="text"
                  placeholder="Bytes signature"
                  style={{
                    width: "200px",
                    marginRight: "10px",
                    marginBottom: "10px",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                  }}
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                />
                <button
                  onClick={() => getWarningMeaning(selector)}
                  style={{ marginRight: "10px" }}
                >
                  See warning meaning
                </button>
                {warningMeaning && (
                  <button onClick={handleClearWarning}>Clear</button>
                )}
                {warningMeaning && (
                  <div style={{ color: "orange" }}>{warningMeaning}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
