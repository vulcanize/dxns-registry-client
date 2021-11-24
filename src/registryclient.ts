import { DirectSecp256k1HdWallet, EncodeObject, Registry } from "@cosmjs/proto-signing";
import { assertIsBroadcastTxSuccess, defaultRegistryTypes, SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { Coin } from "../dist/proto/cosmos/base/v1beta1/coin";
import { EthAccount } from "../dist/proto/ethermint/types/v1/account"
import { Duration } from "../dist/proto/google/protobuf/duration";
import { MsgCreateAuction, MsgCommitBid, MsgRevealBid } from "../dist/proto/vulcanize/auction/v1beta1/tx"

export class RegistryClient {
    private registry = new Registry([
        ...defaultRegistryTypes,
        ["/ethermint.types.v1.EthAccount", EthAccount],
        ["/vulcanize.auction.v1beta1.MsgCreateAuction", MsgCreateAuction],
    ]);

    private readonly rpcEndpoint: string;
    private readonly mnemonic: string;

    private signer: DirectSecp256k1HdWallet;
    private client: SigningStargateClient;

    public constructor(
        rpcEndpoint: string,
        mnemonic: string,
    ) {
        this.rpcEndpoint = rpcEndpoint;
        this.mnemonic = mnemonic;
    }

    public async setupRegistry() {
        await this.initSignerFromMnemonic()
        await this.connectWithSigner();
    }

    private async initSignerFromMnemonic() {
        try {
            this.signer = await DirectSecp256k1HdWallet.fromMnemonic(
                this.mnemonic,
                { prefix: "cosmos" },
            );
        }
        catch (error) {
            console.log(`Error encountered while initializing signer: ${error}`);
        }

        return this.signer;
    }

    private async connectWithSigner() {
        try {
            this.client = await SigningStargateClient.connectWithSigner(
                this.rpcEndpoint,
                this.signer,
                { registry: this.registry },
            );
        }
        catch (error) {
            console.log(`Error encountered while setting up the client: ${error}`);
        }

        return this.client;
    }

    private async sendTxMessage(message: EncodeObject, signer: string) {
        const stdFee = {
            amount: [{
                denom: "aphoton",
                amount: "10",
            }],
            gas: "1000",
        }
        //const [account] = await this.signer.getAccounts();

        const result = await this.client.signAndBroadcast(signer, [message], stdFee)
        assertIsBroadcastTxSuccess(result);

        return result;
    }

    public async createAuction(
        commitsDuration: Duration,
        revealsDuration: Duration,
        commitFee: Coin,
        revealFee: Coin,
        minimumBid: Coin,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.auction.v1beta1.MsgCreateAuction",
            value: MsgCreateAuction.fromPartial({
                signer: signer,
                commitsDuration: commitsDuration,
                revealsDuration: revealsDuration,
                commitFee: commitFee,
                revealFee: revealFee,
                minimumBid: minimumBid,
            }),
        }

        console.log({ a: this.signer })

        const accounts = await this.signer.getAccounts()
        console.log({ accounts })
        try {
            this.sendTxMessage(message, signer)
                .then(function () { console.log("auction creation request sent successfully") })
                .catch(function (error) { console.log(`promise rejected: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending CreateAuction message: ${error}`);
        }
    }
}

