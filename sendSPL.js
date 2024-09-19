require('dotenv').config(); 
const {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    clusterApiUrl,
    Transaction,
    SystemProgram,
} = require('@solana/web3.js');
const {
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const bs58 = require("bs58");

async function transferToken(pk, destinationAddress, amount) {
    const tokenAddress = '53yc4casWESAyT3isxFf9kfT2Vnf2pN7yLXmFoYAVzDM';
    // Initialize the connection to the Solana cluster
    const connection = new Connection(process.env.RPC, 'confirmed');

    // Convert the private key string to a Uint8Array
    const privateKeyUint8Array = new Uint8Array(bs58.default.decode(pk));

    // Create a Keypair from the private key
    const fromWallet = Keypair.fromSecretKey(privateKeyUint8Array);

    // Create PublicKey objects for the token and destination addresses
    const tokenPubKey = new PublicKey(tokenAddress);
    const toPubKey = new PublicKey(destinationAddress);

    // Get or create the associated token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        tokenPubKey,
        fromWallet.publicKey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        tokenPubKey,
        toPubKey
    );

    // Create the transfer instruction
    const transferInstruction = createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        amount*1000000000,
        [],
        TOKEN_PROGRAM_ID
    );

    // Create and send the transaction
    const transaction = new Transaction().add(transferInstruction);

    // Sign and send the transaction
    const signature = await connection.sendTransaction(transaction, [fromWallet]);

    // Confirm the transaction
    const block = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({
        signature,
        ...block,
      },
      "confirmed");
}

module.exports = { transferToken }