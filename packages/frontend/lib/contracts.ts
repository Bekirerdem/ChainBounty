// Auto-generated file from extract-abis.js
export const BOUNTY_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_BOUNTY_MANAGER_ADDRESS || "0x6ca6ccedd87a8b55cf29fdd22b42d18e1077313a") as `0x${string}`;
export const BOUNTY_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_BOUNTY_EXECUTOR_ADDRESS || "0x21e64F77FCc16Fb28aF7Da20aeACD042FC72935f") as `0x${string}`;

export const BOUNTY_MANAGER_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_teleporterMessenger",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_appChainId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "allowedAppChainExecutor",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "appChainId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "bounties",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "bountyId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "employer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "budget",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "ipfsDocHash",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "isActive",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "isCompleted",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createBounty",
    "inputs": [
      {
        "name": "_ipfsDocHash",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "forceSettleByEmployer",
    "inputs": [
      {
        "name": "_bountyId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_developer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "nextBountyId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "receiveTeleporterMessage",
    "inputs": [
      {
        "name": "sourceChainID",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "sourceAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "messageData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setExecutor",
    "inputs": [
      {
        "name": "_executor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "teleporterMessenger",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "BountyCancelled",
    "inputs": [
      {
        "name": "bountyId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BountyCompleted",
    "inputs": [
      {
        "name": "bountyId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "developer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BountyCreated",
    "inputs": [
      {
        "name": "bountyId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "budget",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "ipfsDocHash",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ExecutorSet",
    "inputs": [
      {
        "name": "executor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BountyNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BountyNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidBudget",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Unauthorized",
    "inputs": []
  }
] as const;

export const BOUNTY_EXECUTOR_ABI = [{"inputs":[{"internalType":"address","name":"_teleporterMessenger","type":"address"},{"internalType":"bytes32","name":"_cChainId","type":"bytes32"},{"internalType":"address","name":"_bountyManagerAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"BountyAlreadyHasAcceptedProposal","type":"error"},{"inputs":[],"name":"InvalidAmount","type":"error"},{"inputs":[],"name":"ProposalNotFound","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[],"name":"Unauthorized","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"proposalId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"bountyId","type":"uint256"},{"indexed":true,"internalType":"address","name":"employer","type":"address"}],"name":"ProposalAccepted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"proposalId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"bountyId","type":"uint256"},{"indexed":true,"internalType":"address","name":"developer","type":"address"},{"indexed":false,"internalType":"uint256","name":"requestedAmount","type":"uint256"}],"name":"ProposalSubmitted","type":"event"},{"inputs":[{"internalType":"uint256","name":"_proposalId","type":"uint256"},{"internalType":"address","name":"_mockEmployer","type":"address"}],"name":"acceptProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"acceptedProposals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_bountyId","type":"uint256"},{"internalType":"address","name":"_mockEmployer","type":"address"}],"name":"approveWorkAndTriggerPayment","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"bountyManagerAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"bountyProposals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"cChainId","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextProposalId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"proposals","outputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"uint256","name":"bountyId","type":"uint256"},{"internalType":"address","name":"developer","type":"address"},{"internalType":"uint256","name":"requestedAmount","type":"uint256"},{"internalType":"uint256","name":"deliveryTime","type":"uint256"},{"internalType":"string","name":"contactInfo","type":"string"},{"internalType":"bool","name":"isAccepted","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_bountyId","type":"uint256"},{"internalType":"uint256","name":"_requestedAmount","type":"uint256"},{"internalType":"uint256","name":"_deliveryTime","type":"uint256"},{"internalType":"string","name":"_contactInfo","type":"string"}],"name":"submitProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"teleporterMessenger","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}] as const;
