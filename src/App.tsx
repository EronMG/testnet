import './App.css'
import { AppWalletProvider } from './wallet/WalletProvider'
import { ConnectButton } from './components/ConnectButton'
import { MintButton } from './components/MintButton'
import { SupplyBar } from './components/SupplyBar'
import { useState } from 'react'
import { PiDiscordLogoFill } from "react-icons/pi";
import { BsTwitterX } from "react-icons/bs";
import Marquee from "react-fast-marquee";
function App() {
	const [refreshCounter, setRefreshCounter] = useState(0);
	const [isMinted, setIsMinted] = useState(false);
	const [showMintAnimation, setShowMintAnimation] = useState(false);

	const handleMintSuccess = () => {
		setRefreshCounter((prev: number) => prev + 1);
		setShowMintAnimation(true);
		setTimeout(() => {
			setShowMintAnimation(false);
			setTimeout(() => {
				setIsMinted(false);
			}, 3000);
		}, 2000);
	};

	return (
		<AppWalletProvider>
			<div className="fixed inset-0 bg-gradient-to-br bg-[#020617] text-white overflow-hidden font-funnel">
				<div className="relative z-10 flex justify-between items-center p-6">
					<div className="flex items-center space-x-2">
						<img src="/fogalio-logo.png" alt="" className="w-32" />
					</div>
					<div className="flex items-center space-x-6 text-2xl">
					<a href="https://discord.gg/fogalio" target="_blank" rel="noopener noreferrer">
					<PiDiscordLogoFill />
					</a>
					<a href="https://twitter.com/fogalio" target="_blank" rel="noopener noreferrer">
					<BsTwitterX />
					</a>
					</div>
						<ConnectButton />
				</div>

				<div className="relative flex items-center justify-center min-h-[calc(95vh-120px)] px-6">
					<div className="flex items-stretch justify-center space-x-8 lg:space-x-16 xl:space-x-24 max-w-7xl w-full">
						<div className="relative flex flex-col justify-center w-1/2 max-w-md">
								<img src="/323.png" alt="Fogalio Testnet NFT" className="w-full h-auto object-cover rounded-4xl" />
							<div className="text-center left-[40%] bottom-[-30px] absolute mt-4 text-gray-300 font-medium text-sm lg:text-base">
								Fogalio Testnet
							</div>
							{showMintAnimation && (
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl animate-bounce shadow-2xl">
										<div className="flex items-center space-x-2">
											<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
											</svg>
											<span className="font-bold">NFT Minted!</span>
										</div>
									</div>
								</div>
							)}
						</div>
						<div className="flex flex-col justify-between w-1/2 max-w-md">
							<div className="space-y-6 lg:space-y-8">
								<SupplyBar refreshCounter={refreshCounter} maxSupply={400} />
								
								<div>
									<div className="text-gray-300 leading-relaxed text-base lg:text-lg xl:text-xl break-words">
										The first PFP NFT on @FogoChain ; Fast as FogoChain, born of flame and lightning / Creating a community on Fogo 
									</div>
									<div className="text-gray-500 text-sm lg:text-xl mt-4">
										----------------------------------------
									</div>
									<div className="text-gray-300 text-sm lg:text-xl mt-4">
										<div>Mint Price: Free + Gas</div>
										<div>Chain: FogoChain Testnet</div>
									</div>
								</div>
							</div>

							<div className="mt-6 lg:mt-8">
								<MintButton 
									onMintSuccess={handleMintSuccess} 
									metadataUri="https://pink-real-crow-67.mypinata.cloud/ipfs/bafybeiajya4fxnynxgnfxyeav7jvjesjya3swiehalgyt6oibogb4ko2w4/1.json"
									isMinted={isMinted}
								/>
							</div>
						</div>
					</div>
				</div>
				<Marquee
      gradient={false}
	  direction='right'
      speed={90}
      className="font-funnel  text-white py-4 text-2xl"
    >
      on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on FogoChain Testnet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </Marquee>
			</div>
		</AppWalletProvider>
	)
}

export default App