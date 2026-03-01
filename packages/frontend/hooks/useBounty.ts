import { useReadContract, useReadContracts, useWriteContract, useAccount, useSwitchChain } from 'wagmi';
import { BOUNTY_MANAGER_ADDRESS, BOUNTY_MANAGER_ABI, BOUNTY_EXECUTOR_ADDRESS, BOUNTY_EXECUTOR_ABI } from '../lib/contracts';
import { avalancheFuji, bountyAppChain } from '../lib/chains';
import { parseEther, formatEther } from 'viem';
import { Bounty, BountyStatus } from '@/lib/mock-data';

// --- Bounty Manager Hooks (C-Chain Fuji) ---

/**
 * Creates a new cross-chain bounty by calling the BountyManager on Fuji
 */
export function useCreateBounty() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data: hash } = useWriteContract();

  const createTask = async (description: string, rewardEth: string) => {
    return writeContractAsync({
      address: BOUNTY_MANAGER_ADDRESS,
      abi: BOUNTY_MANAGER_ABI,
      functionName: 'createBounty',
      args: [description],
      value: parseEther(rewardEth),
      chainId: avalancheFuji.id,
    });
  };

  return { createTask, isPending, isSuccess, isError, error, hash };
}

/**
 * Reads the total number of tasks created in the BountyManager
 */
export function useTaskCount() {
  const { data: taskCount, isLoading, isError, refetch } = useReadContract({
    address: BOUNTY_MANAGER_ADDRESS,
    abi: BOUNTY_MANAGER_ABI,
    functionName: 'nextBountyId',
    chainId: avalancheFuji.id,
  });

  return { taskCount: taskCount ? Number(taskCount) : 0, isLoading, isError, refetch };
}

/**
 * Reads the details of a specific task from the BountyManager
 */
export function useTaskDetails(taskId: number) {
  const { data: taskDetails, isLoading, isError, refetch } = useReadContract({
    address: BOUNTY_MANAGER_ADDRESS,
    abi: BOUNTY_MANAGER_ABI,
    functionName: 'bounties',
    args: [BigInt(taskId)],
    chainId: avalancheFuji.id,
    query: {
        enabled: taskId > 0,
    }
  });

  return { taskDetails, isLoading, isError, refetch };
}

/**
 * Fetches all bounties from the smart contract and formats them to match the UI's expected Bounty interface.
 */
export function useAllBounties() {
    // 1. Get the total count
    const { taskCount, isLoading: isCountLoading } = useTaskCount();

    // 2. Prepare the contract calls for each bounty ID
    const bountyContracts = Array.from({ length: taskCount }).map((_, i) => ({
        address: BOUNTY_MANAGER_ADDRESS as `0x${string}`,
        abi: BOUNTY_MANAGER_ABI,
        functionName: 'bounties',
        args: [BigInt(i)],
        chainId: avalancheFuji.id,
    }));

    // 3. Fetch all bounties in parallel
    const { data: results, isLoading: isBountiesLoading, refetch } = useReadContracts({
        contracts: bountyContracts,
        // Optional: only run if we have a count greater than zero
        query: {
            enabled: taskCount > 0,
        }
    });

    const bounties: Bounty[] = [];
    
    if (results) {
        results.forEach((result, index) => {
            if (result.status === "success" && result.result) {
                // The result is a tuple based on the Solidity struct.
                // ABI tuple format: [bountyId, employer, budget, ipfsDocHash, isActive, isCompleted]
                const [id, employer, budget, ipfsDocHash, isActive, isCompleted] = result.result as unknown as [bigint, string, bigint, string, boolean, boolean];
                
                // Hackathon: we stored "Title | Description" in the ipfsDocHash field
                let title = ipfsDocHash;
                let description = ipfsDocHash;
                
                if (typeof ipfsDocHash === 'string' && ipfsDocHash.includes(" | ")) {
                    const parts = ipfsDocHash.split(" | ");
                    title = parts[0] || "Untitled";
                    description = parts.slice(1).join(" | ") || "No description provided.";
                }

                let statusText: BountyStatus = "Open";
                if (isCompleted) statusText = "Completed";
                else if (!isActive) statusText = "Cancelled";

                // Clean up ghost/test bounties for the demo (0 AVAX or no title)
                if (budget === BigInt(0) && title === "") return;

                bounties.push({
                    bountyId: Number(id),
                    creator: employer,
                    title: title,
                    description: description,
                    reward: formatEther(budget),
                    deadline: Math.floor(Date.now() / 1000) + 86400 * 7, // Placeholder for C-Chain
                    status: statusText,
                    submissionCount: 0,
                    createdAt: Math.floor(Date.now() / 1000) - 86400 * index, 
                    tags: ["Avalanche", "Web3"], 
                });
            }
        });
    }

    return { 
        bounties: bounties.reverse(), // Show newest first intuitively
        isLoading: isCountLoading || isBountiesLoading,
        refetch 
    };
}


// --- Bounty Executor Hooks (App-Chain) ---

/**
 * Submits work on the App-Chain towards a task created on the C-Chain
 */
export function useSubmitWork() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data: hash } = useWriteContract();
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

    const submitWork = async (bountyId: number, repoLink: string, rewardValue: string = "0.1") => {
        // Enforce chain switch if the user is not on App-Chain
        if (chain?.id !== bountyAppChain.id) {
             if (switchChainAsync) {
                 await switchChainAsync({ chainId: bountyAppChain.id });
             } else {
                 throw new Error("Lütfen cüzdanınızdan ChainBounty App-Chain ağına geçiş yapın.");
             }
        }

        return await writeContractAsync({
            address: BOUNTY_EXECUTOR_ADDRESS as `0x${string}`,
            abi: BOUNTY_EXECUTOR_ABI,
            functionName: 'submitProposal',
            // Pass a valid requestedAmount (>0) and deliveryTime (future timestamp)
            args: [BigInt(bountyId), parseEther(rewardValue), BigInt(Math.floor(Date.now() / 1000) + 86400 * 7), repoLink],
            chainId: bountyAppChain.id, // Explicitly target App-Chain
        });
    };

  return { submitWork, isPending, isSuccess, isError, error, hash };
}

/**
 * Reads whether an employer is registered on App-Chain for a bounty.
 * Returns address(0) if not registered yet.
 */
export function useBountyEmployer(bountyId: number) {
  const { data: employer, isLoading, refetch } = useReadContract({
    address: BOUNTY_EXECUTOR_ADDRESS,
    abi: BOUNTY_EXECUTOR_ABI,
    functionName: 'bountyEmployers',
    args: [BigInt(bountyId)],
    chainId: bountyAppChain.id,
    query: { enabled: bountyId > 0 },
  });

  return {
    employerOnAppChain: (employer as string) ?? "0x0000000000000000000000000000000000000000",
    isLoading,
    refetch,
  };
}

/**
 * Reads whether a task is resolved on the App-Chain
 */
export function useIsTaskResolved(taskId: number) {
  const { data: isResolved, isLoading, isError, refetch } = useReadContract({
    address: BOUNTY_EXECUTOR_ADDRESS,
    abi: BOUNTY_EXECUTOR_ABI,
    functionName: 'acceptedProposals',
    args: [BigInt(taskId)],
    chainId: bountyAppChain.id,
    query: {
        enabled: taskId > 0,
    }
  });

  return { isResolved: Boolean(isResolved), isLoading, isError, refetch };
}

/**
 * Reads the total number of proposals on the App-Chain
 */
export function useProposalCount() {
    const { data: count, isLoading, isError, refetch } = useReadContract({
        address: BOUNTY_EXECUTOR_ADDRESS,
        abi: BOUNTY_EXECUTOR_ABI,
        functionName: 'nextProposalId',
        chainId: bountyAppChain.id,
    });
    
    return { proposalCount: count ? Number(count) : 0, isLoading, isError, refetch };
}

/**
 * Fetches all submissions/proposals for a specific bounty
 */
export function useBountySubmissions(bountyId: number) {
    const { proposalCount, isLoading: isCountLoading } = useProposalCount();

    const proposalContracts = Array.from({ length: proposalCount }).map((_, i) => ({
        address: BOUNTY_EXECUTOR_ADDRESS as `0x${string}`,
        abi: BOUNTY_EXECUTOR_ABI,
        functionName: 'proposals',
        args: [BigInt(i)],
        chainId: bountyAppChain.id,
    }));

    const { data: results, isLoading: isProposalsLoading, refetch } = useReadContracts({
        contracts: proposalContracts,
        query: {
            enabled: proposalCount > 0,
        }
    });

    type SubmissionType = {
        submissionId: number;
        bountyId: number;
        submitter: string;
        description: string;
        repoLink: string;
        demoLink: string;
        submittedAt: number;
        status: "Pending" | "Accepted";
    };

    const submissions: SubmissionType[] = [];

    if (results) {
        results.forEach((result) => {
            if (result.status === "success" && result.result) {
                // ABI format: [proposalId, bountyId, developer, requestedAmount, deliveryTime, contactInfo, isAccepted]
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [pId, bId, developer, _requestedAmount, _deliveryTime, contactInfo, isAccepted] = result.result as unknown as [bigint, bigint, string, bigint, bigint, string, boolean];
                
                if (Number(bId) === bountyId) {
                    submissions.push({
                        submissionId: Number(pId),
                        bountyId: Number(bId),
                        submitter: developer,
                        description: "Hackathon Submission", 
                        repoLink: contactInfo.includes(" | ") ? contactInfo.split(" | ")[0].trim() : contactInfo.trim(),
                        demoLink: contactInfo.includes(" | ") ? (contactInfo.split(" | ")[1] ?? "").trim() : "",
                        submittedAt: Math.floor(Date.now() / 1000) - 86400, // mock time
                        status: isAccepted ? "Accepted" : "Pending",
                    });
                }
            }
        });
    }

    return {
        submissions: submissions.reverse(),
        isLoading: isCountLoading || isProposalsLoading,
        refetch
    };
}

// --- Proposal Management Hooks ---

export function useAcceptProposal() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const acceptProposal = async (proposalId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== bountyAppChain.id && switchChainAsync) {
      await switchChainAsync({ chainId: bountyAppChain.id });
    }

    const txHash = await writeContractAsync({
      address: BOUNTY_EXECUTOR_ADDRESS as `0x${string}`,
      abi: BOUNTY_EXECUTOR_ABI,
      functionName: "acceptProposal",
      args: [BigInt(proposalId)],
      chainId: bountyAppChain.id,
    });

    return txHash;
  };

  return {
    acceptProposal,
    isPending,
    isSuccess,
    error,
  };
}

export function useApprovePayment() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const approvePayment = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== bountyAppChain.id && switchChainAsync) {
      await switchChainAsync({ chainId: bountyAppChain.id });
    }

    try {
      const txHash = await writeContractAsync({
        address: BOUNTY_EXECUTOR_ADDRESS as `0x${string}`,
        abi: BOUNTY_EXECUTOR_ABI,
        functionName: "approveWorkAndTriggerPayment",
        args: [BigInt(bountyId)],
        chainId: bountyAppChain.id,
      });
      
      console.log("Approve payment Tx submitted:", txHash);
      return txHash;
    } catch (err) {
      console.error("Approve payment failed:", err);
      throw err;
    }
  };

  return {
    approvePayment,
    isPending,
    isSuccess,
    error,
  };
}
// NOTE: useClaimEmployer REMOVED — claimEmployer() fonksiyonu güvenlik açığı nedeniyle kaldırıldı.
// Employer kaydı artık yalnızca Teleporter ICM mesajı ile yapılır.

/**
 * Cancels a bounty on the C-Chain, refunding locked AVAX to the employer.
 * Now also sends CANCEL_BOUNTY ICM to App-Chain to clear stale data.
 */
export function useCancelBounty() {
  const { address } = useAccount();

  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const cancelBounty = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    try {
      console.log(`Cancelling bounty ${bountyId}...`);

      const txHash = await writeContractAsync({
        address: BOUNTY_MANAGER_ADDRESS as `0x${string}`,
        abi: BOUNTY_MANAGER_ABI,
        functionName: "cancelBounty",
        args: [BigInt(bountyId)],
        chainId: avalancheFuji.id,
      });

      console.log("Cancel bounty Tx submitted:", txHash);
      return txHash;
    } catch (err) {
      console.error("Cancel bounty failed:", err);
      throw err;
    }
  };

  return {
    cancelBounty,
    isPending,
    isSuccess,
    error,
  };
}

// ============================================================
//          FORCE SETTLE — 24h Timelock (Security Fix 2)
// ============================================================

/**
 * Adım 1: Employer force settle intent kaydeder. 24 saat timelock başlar.
 */
export function useRequestForceSettle() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const requestForceSettle = async (bountyId: number, developerAddress: string) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== avalancheFuji.id && switchChainAsync) {
      await switchChainAsync({ chainId: avalancheFuji.id });
    }

    return await writeContractAsync({
      address: BOUNTY_MANAGER_ADDRESS,
      abi: BOUNTY_MANAGER_ABI,
      functionName: "requestForceSettle",
      args: [BigInt(bountyId), developerAddress as `0x${string}`],
      chainId: avalancheFuji.id,
    });
  };

  return { requestForceSettle, isPending, isSuccess, error };
}

/**
 * Adım 2: 24 saat sonra employer execute eder.
 */
export function useExecuteForceSettle() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const executeForceSettle = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== avalancheFuji.id && switchChainAsync) {
      await switchChainAsync({ chainId: avalancheFuji.id });
    }

    return await writeContractAsync({
      address: BOUNTY_MANAGER_ADDRESS,
      abi: BOUNTY_MANAGER_ABI,
      functionName: "executeForceSettle",
      args: [BigInt(bountyId)],
      chainId: avalancheFuji.id,
    });
  };

  return { executeForceSettle, isPending, isSuccess, error };
}

/**
 * Read: Settle intent durumunu kontrol et (timelock countdown için)
 */
export function useSettleIntent(bountyId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: BOUNTY_MANAGER_ADDRESS,
    abi: BOUNTY_MANAGER_ABI,
    functionName: "settleIntents",
    args: [BigInt(bountyId)],
    chainId: avalancheFuji.id,
    query: { enabled: bountyId > 0 },
  });

  const intent = data as unknown as [string, bigint] | undefined;

  return {
    developer: intent?.[0] ?? "0x0000000000000000000000000000000000000000",
    requestedAt: intent ? Number(intent[1]) : 0,
    canExecuteAt: intent ? Number(intent[1]) + 86400 : 0, // +24h
    isLoading,
    refetch,
  };
}

// ============================================================
//        ANTI-GHOSTING — 72h Auto-Release (Security Fix 3)
// ============================================================

/**
 * Developer, kabul edilmiş bounty için işi teslim eder.
 * 72 saat sonra auto-release tetiklenebilir.
 */
export function useDeliverWork() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const deliverWork = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== bountyAppChain.id && switchChainAsync) {
      await switchChainAsync({ chainId: bountyAppChain.id });
    }

    return await writeContractAsync({
      address: BOUNTY_EXECUTOR_ADDRESS,
      abi: BOUNTY_EXECUTOR_ABI,
      functionName: "deliverWork",
      args: [BigInt(bountyId)],
      chainId: bountyAppChain.id,
    });
  };

  return { deliverWork, isPending, isSuccess, error };
}

/**
 * 72 saat sonra developer veya herhangi biri ödemeyi tetikler.
 */
export function useAutoReleasePayment() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const autoRelease = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== bountyAppChain.id && switchChainAsync) {
      await switchChainAsync({ chainId: bountyAppChain.id });
    }

    return await writeContractAsync({
      address: BOUNTY_EXECUTOR_ADDRESS,
      abi: BOUNTY_EXECUTOR_ABI,
      functionName: "autoReleasePayment",
      args: [BigInt(bountyId)],
      chainId: bountyAppChain.id,
    });
  };

  return { autoRelease, isPending, isSuccess, error };
}

/**
 * Developer'ın iş teslim zamanını okur (auto-release countdown için)
 */
export function useWorkDeliveredAt(bountyId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: BOUNTY_EXECUTOR_ADDRESS,
    abi: BOUNTY_EXECUTOR_ABI,
    functionName: "workDeliveredAt",
    args: [BigInt(bountyId)],
    chainId: bountyAppChain.id,
    query: { enabled: bountyId > 0 },
  });

  const deliveredAt = data ? Number(data) : 0;

  return {
    deliveredAt,
    isDelivered: deliveredAt > 0,
    autoReleaseAt: deliveredAt > 0 ? deliveredAt + 259200 : 0, // +72h (259200 saniye)
    isLoading,
    refetch,
  };
}

