require('dotenv').config(); 
const splToken = require('@solana/spl-token');
const web3 = require('@solana/web3.js')
const bs58 = require('bs58')

const node  = 'https://api.mainnet-beta.solana.com'


const connection = new web3.Connection(process.env.RPC, 'confirmed')


const getWallet = ()=>{
  const accont = web3.Keypair.generate()
  const publickey = accont.publicKey.toString()
  const secretKeyString = bs58.default.encode(accont.secretKey);
  return [publickey, secretKeyString]
}

const getSolanaBalance = async (walletAddress) => {
    try {
        const publicKey = new web3.PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);

        // Convert lamports to SOL and return the balance
        const solBalance = balance / web3.LAMPORTS_PER_SOL;
        console.log(solBalance)
        return solBalance;
    } catch (error) {
        console.error("Error retrieving Solana balance:", error);
        throw error;
    }
};


const isValidSolanaAddress = (address) => {
    try {
        // Attempt to create a PublicKey object
        const publicKey = new web3.PublicKey(address);

        // Check if the address is on the curve (valid Solana address)
        return web3.PublicKey.isOnCurve(publicKey.toBuffer());
    } catch (error) {
        // If any error occurs (invalid address format), return false
        return false;
    }
};



const getTokenBalance = async (walletAddress) => {
    try {
        const tokenMintAddress = '53yc4casWESAyT3isxFf9kfT2Vnf2pN7yLXmFoYAVzDM';
        
        const publicKey = new web3.PublicKey(walletAddress);
        const mintPublicKey = new web3.PublicKey(tokenMintAddress);

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: mintPublicKey,
        });
        if (tokenAccounts.value.length > 0) {
            const tokenAccountInfo = tokenAccounts.value[0].account.data.parsed.info;
            
            const balance = tokenAccountInfo.tokenAmount.uiAmount; // Balance in tokens (not lamports)
            return balance;
        } else {
            return 0; // No token account found for the given mint address
        }
    } catch (error) {
        console.error("Error retrieving token balance:", error);
        throw error;
    }
};


const sendToken = async (fromWalletPrivateKeyString, toWalletAddress, amount) => {
    try {
        // Decode the sender's private key from base58 string
        const fromWallet = web3.Keypair.fromSecretKey(bs58.default.decode(fromWalletPrivateKeyString));
        const toWallet = new web3.PublicKey(toWalletAddress);

        // Specify the token mint address
        const tokenMintAddress = new web3.PublicKey('53yc4casWESAyT3isxFf9kfT2Vnf2pN7yLXmFoYAVzDM');

        // Get the associated token account of the receiver's wallet
        let toTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            tokenMintAddress,
            toWallet
        );

        // Get the sender's token account
        const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            tokenMintAddress,
            fromWallet.publicKey
        );

        // Fetch a fresh recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();

        // Create the transfer instruction
        const transferInstruction = splToken.createTransferInstruction(
            fromTokenAccount.address, // Sender's token account
            toTokenAccount.address,   // Receiver's token account
            fromWallet.publicKey,     // Sender's public key
            amount * Math.pow(10, 9)// Amount to transfer (ensure it's in the correct unit)
        );

        // Create a transaction and add the transfer instruction
        const transaction = new web3.Transaction().add(transferInstruction);
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromWallet.publicKey;
        console.log("toke")
        // Sign and send the transaction
        const signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet] // Sign the transaction with the sender's keypair
        );

        console.log('Transaction signature', signature);
        return signature;
    } catch (error) {
        console.error("Error sending token:", error);
        throw error;
    }
};


module.exports = {
  isValidSolanaAddress,
  getTokenBalance,
  getWallet,
  sendToken
}
