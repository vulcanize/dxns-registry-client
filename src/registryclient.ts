import { DirectSecp256k1HdWallet, EncodeObject, Registry } from "@cosmjs/proto-signing";
import { assertIsBroadcastTxSuccess, defaultRegistryTypes, SigningStargateClient } from "@cosmjs/stargate";
import { Coin } from "../dist/proto/cosmos/base/v1beta1/coin";
import { EthAccount } from "../dist/proto/ethermint/types/v1/account"
import { Duration } from "../dist/proto/google/protobuf/duration";
import { MsgCreateAuction, MsgCommitBid, MsgRevealBid } from "../dist/proto/vulcanize/auction/v1beta1/tx";
import {MsgCreateBond, MsgWithdrawBond, MsgRefillBond, MsgCancelBond} from "../dist/proto/vulcanize/bond/v1beta1/tx";
import {
    MsgAssociateBond,
    MsgDissociateBond,
    MsgDeleteNameAuthority,
    MsgDissociateRecords,
    MsgReAssociateRecords,
    MsgRenewRecord,
    MsgSetAuthorityBond,
    MsgReserveAuthority,
    MsgSetName,
} from "../dist/proto/vulcanize/nameservice/v1beta1/tx";
export class RegistryClient {
    private registry = new Registry([
        ...defaultRegistryTypes,
        // Ethermint Account message
        ["/ethermint.types.v1.EthAccount", EthAccount],
        // Auction module messages
        ["/vulcanize.auction.v1beta1.MsgCreateAuction", MsgCreateAuction],
        ["/vulcanize.auction.v1beta1.MsgCommitBid", MsgCommitBid],
        ["/vulcanize.auction.v1beta1.MsgRevealBid", MsgRevealBid],
        // Bond module messages
        ["/vulcanize.bond.v1beta1.MsgCreateBond", MsgCreateBond],
        ["/vulcanize.bond.v1beta1.MsgRefillBond", MsgRefillBond],
        ["/vulcanize.bond.v1beta1.MsgWithdrawBond", MsgWithdrawBond],
        ["/vulcanize.bond.v1beta1.MsgCancelBond", MsgCancelBond],
        // Nameservice module messages
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgAssociateBond],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgDissociateBond],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgDissociateRecords],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgDeleteNameAuthority],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgReAssociateRecords],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgRenewRecord],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgSetAuthorityBond],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgReserveAuthority],
        ["/vulcanize.nameservice.v1beta1.MsgCancelBond", MsgSetName],
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

        try {
            this.sendTxMessage(message, signer)
                .then(function () { console.log("auction creation request sent successfully") })
                .catch(function (error) { console.log(`error in creating auction: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending CreateAuction message: ${error}`);
        }
    }

    public async commitBid(
        auctionId: string,
        commitHash: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.auction.v1beta1.MsgCommitBid",
            value: MsgCommitBid.fromPartial({
                signer: signer,
                auctionId: auctionId,
                commitHash: commitHash,
            }),
        }

        try {
            this.sendTxMessage(message, signer)
                .then(function () { console.log("bid commit request sent successfully") })
                .catch(function (error) { console.log(`error in committing bid: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending CommitBid message: ${error}`);
        }
    }

    public async revealBid(
        auctionId: string,
        reveal: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.auction.v1beta1.MsgCommitBid",
            value: MsgRevealBid.fromPartial({
                signer: signer,
                auctionId: auctionId,
                reveal: reveal,
            }),
        }

        try {
            this.sendTxMessage(message, signer)
                .then(function () { console.log("bid reveal request sent successfully") })
                .catch(function (error) { console.log(`error in revealing bid: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending RevealBid message: ${error}`);
        }
    }
}

