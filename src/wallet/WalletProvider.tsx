import { useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { NightlyWalletAdapter } from '@solana/wallet-adapter-nightly';
import { UmiProvider } from '../umi/UmiProvider';

// Стили модального окна выбора кошелька
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
	children: ReactNode;
	endpoint?: string;
}

const WithUmi: FC<{ children: ReactNode; endpoint: string }> = ({ children, endpoint }) => {
	const wallet = useWallet();
	return (
		<UmiProvider endpoint={endpoint} wallet={wallet}>
			{children}
		</UmiProvider>
	);
};

export const AppWalletProvider: FC<Props> = ({ children, endpoint }) => {
	// ВАЖНО: замените на официальный RPC FogoChain Testnet
	const rpcEndpoint = endpoint ?? 'https://testnet.fogo.io';

	const wallets = useMemo(() => [
		new PhantomWalletAdapter(),
		new SolflareWalletAdapter(),
		new NightlyWalletAdapter(),
	], []);

	return (
		<ConnectionProvider endpoint={rpcEndpoint}>
			<WalletProvider wallets={wallets} autoConnect={true}>
				<WalletModalProvider>
					<WithUmi endpoint={rpcEndpoint}>{children}</WithUmi>
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
};