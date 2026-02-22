import { useReadContract, useReadContracts, useWriteContract } from 'wagmi';
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
  const { writeContract, isPending, isSuccess, isError, error, data: hash } = useWriteContract();

  const submitWork = async (taskId: number, workerResult: string) => {
    // BountyExecutor.sol expects: submitProposal(uint256 _bountyId, uint256 _requestedAmount, uint256 _deliveryTime, string memory _contactInfo)
    writeContract({
      address: BOUNTY_EXECUTOR_ADDRESS,
      abi: BOUNTY_EXECUTOR_ABI,
      functionName: 'submitProposal',
      args: [BigInt(taskId), parseEther("0.1"), BigInt(Math.floor(Date.now() / 1000) + 86400 * 7), workerResult],
      chainId: bountyAppChain.id,
    });
  };

  return { submitWork, isPending, isSuccess, isError, error, hash };
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
