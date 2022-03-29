import "./styles/App.css";

import openseaLogo from "./assets/opensea-logo.svg";
import raribleLogo from "./assets/rarible-logo.svg";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import swal from "@sweetalert/with-react";
import myEpicNft from "./utils/MyEpicNFT.json";

// Constants

const PORTFOLIO = "theShoaib";
const PRTFOLIO_LINK = "https://theshoaib.vercel.app/";
const OPENSEA_LINK =
  "https://testnets.opensea.io/collection/squarenft-atktv84sd8";
const RARIBLE_LINK =
  "https://rinkeby.rarible.com/collection/0x0d7587365eb6c293f088418b16d3839901bd751f/items";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0x0d7587365EB6c293F088418b16D3839901Bd751f";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalNftMinted, setTotalNftMinted] = useState(0);

  /*
   * First make sure we have access to window.ethereum
   */
  const { ethereum } = window;

  const checkIfWalletIsConnected = async () => {
    if (!ethereum) {
      console.log("Make sure you have metamask!");
      swal("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4";
    if (chainId !== rinkebyChainId) {
      swal(<p>You are not connected to the Rinkeby Test Network!</p>);
      return;
    }
    /*
     * Check if we're authorized to access the user's wallet
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });

    /*
     * User can have multiple authorized accounts, we grab the first one if its there!
     */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      if (!ethereum) {
        swal(<h2>Get MetaMask!</h2>);
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          swal(
            <div>
              <h1>Hey there!</h1>
              <p>
                We've minted your NFT and sent it to your wallet. It may be
                blank right now. It can take a max of 10 min to show up on
                OpenSea.
              </p>
              <div>
                <p>Here's the link:</p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  <img src={openseaLogo} alt="OpenSea logo" className="logo" />
                  <a
                    className="modal-text"
                    href={`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`}
                    target="_blank"
                    rel="noreferrer"
                  >{`Opensea`}</a>
                </div>
              </div>
            </div>
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        setLoading(true);
        console.log("Mining...please wait.");

        await nftTxn.wait();
        setLoading(false);

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        getNFTCount();
        setupEventListener();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error.error);
      swal(<p>{error.error.message}</p>);
    }
  };

  const getNFTCount = async () => {
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicNft.abi,
        signer
      );

      let nftCount = await connectedContract.getTotalNFTsMintedSoFar();
      setTotalNftMinted(nftCount.toNumber());
    }
  };

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    getNFTCount();
  });

  // useEffect(() => {
  //   let connectedContract;
  //   const onNewMint = (from, tokenId) => {
  //     setTotalNftMinted(tokenId.toNumber());
  //   };

  //   if (ethereum) {
  //     // Same stuff again
  //     const provider = new ethers.providers.Web3Provider(ethereum);
  //     const signer = provider.getSigner();
  //     connectedContract = new ethers.Contract(
  //       CONTRACT_ADDRESS,
  //       myEpicNft.abi,
  //       signer
  //     );
  //     connectedContract.on("NewEpicNFTMinted", onNewMint);
  //   }

  //   return () => {
  //     if (connectedContract) {
  //       connectedContract.off("NewEpicNFTMinted", onNewMint);
  //     }
  //   };
  // });

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <button
              onClick={askContractToMintNft}
              className="cta-button connect-wallet-button"
              disabled={loading}
            >
              {!loading ? "Mint NFT" : <i class="fa fa-spinner fa-spin"></i>}
            </button>
          )}
        </div>

        <div className="minted-nfts">
          <p className="mint-count">{`${totalNftMinted} / ${TOTAL_MINT_COUNT}`}</p>
          <span className="gradient-text">Total NFTs minted</span>
        </div>

        <div className="collection-text">
          See Collection On
          <div className="collection-link">
            <div>
              <img src={openseaLogo} alt="OpenSea logo" className="logo" />
              <a
                className="footer-text"
                href={OPENSEA_LINK}
                target="_blank"
                rel="noreferrer"
              >{`Opensea`}</a>
            </div>
            <div>
              <img src={raribleLogo} alt="Rarible logo" className="logo" />
              <a
                className="footer-text"
                href={RARIBLE_LINK}
                target="_blank"
                rel="noreferrer"
              >{`Rarible`}</a>
            </div>
          </div>
        </div>

        <div className="footer-container">
          <i
            class="fa fa-user"
            aria-hidden="true"
            style={{ color: "white", marginRight: "10px", fontSize: "18px" }}
          ></i>
          <a
            className="footer-text"
            href={PRTFOLIO_LINK}
            target="_blank"
            rel="noreferrer"
          >
            {PORTFOLIO}
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
