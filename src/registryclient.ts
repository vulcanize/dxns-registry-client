import { DirectSecp256k1HdWallet, EncodeObject, Registry } from "@cosmjs/proto-signing";
import { assertIsBroadcastTxSuccess, defaultRegistryTypes, SigningStargateClient } from "@cosmjs/stargate";
import { Coin } from "../dist/proto/cosmos/base/v1beta1/coin";
import { EthAccount } from "../dist/proto/ethermint/types/v1/account";
import { Slip10RawIndex } from "@cosmjs/crypto";
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
        ["/vulcanize.nameservice.v1beta1.MsgAssociateBond", MsgAssociateBond],
        ["/vulcanize.nameservice.v1beta1.MsgDissociateBond", MsgDissociateBond],
        ["/vulcanize.nameservice.v1beta1.MsgDissociateRecords", MsgDissociateRecords],
        ["/vulcanize.nameservice.v1beta1.MsgDeleteNameAuthority", MsgDeleteNameAuthority],
        ["/vulcanize.nameservice.v1beta1.MsgReAssociateRecords", MsgReAssociateRecords],
        ["/vulcanize.nameservice.v1beta1.MsgRenewRecord", MsgRenewRecord],
        ["/vulcanize.nameservice.v1beta1.MsgSetAuthorityBond", MsgSetAuthorityBond],
        ["/vulcanize.nameservice.v1beta1.MsgReserveAuthority", MsgReserveAuthority],
        ["/vulcanize.nameservice.v1beta1.MsgSetName", MsgSetName],
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
        const hdPath = [
            Slip10RawIndex.hardened(44),
            Slip10RawIndex.hardened(60),
            Slip10RawIndex.hardened(0),
            Slip10RawIndex.normal(0),
            Slip10RawIndex.normal(0),
        ];
        try {
            this.signer = await DirectSecp256k1HdWallet.fromMnemonic(
                this.mnemonic,
                {
                    prefix: "regen",
                    hdPaths: [hdPath], 
                },
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

        const result = await this.client.signAndBroadcast(signer, [message], stdFee)
        assertIsBroadcastTxSuccess(result);

        return result;
    }

    /// ------------------------ AUCTION MODULE MESSAGES ---------------------- ///

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

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
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

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
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

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("bid reveal request sent successfully") })
                .catch(function (error) { console.log(`error in revealing bid: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending RevealBid message: ${error}`);
        }
    }

    /// ------------------------ BOND MODULE MESSAGES ---------------------- ///

    public async createBond(
        signer: string,
        coins: Coin[],
    ) {
        const message = {
            typeUrl: "/vulcanize.bond.v1beta1.MsgCreateBond",
            value: MsgCreateBond.fromPartial({
                signer: signer,
                coins: coins,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("create bond request sent successfully") })
                .catch(function (error) { console.log(`error in creating bond: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending CreateBond message: ${error}`);
        }
    }

    public async refillBond(
        signer: string,
        id: string,
        coins: Coin[],
    ) {
        const message = {
            typeUrl: "/vulcanize.bond.v1beta1.MsgRefillBond",
            value: MsgRefillBond.fromPartial({
                signer: signer,
                id: id,
                coins: coins,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("refill bond request sent successfully") })
                .catch(function (error) { console.log(`error in refilling bond: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending RefillBond message: ${error}`);
        }
    }

    public async withdrawBond(
        signer: string,
        id: string,
        coins: Coin[],
    ) {
        const message = {
            typeUrl: "/vulcanize.bond.v1beta1.MsgWithdrawBond",
            value: MsgWithdrawBond.fromPartial({
                signer: signer,
                id: id,
                coins: coins,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("withdraw bond request sent successfully") })
                .catch(function (error) { console.log(`error in withdrawing bond: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending CancelBond message: ${error}`);
        }
    }

    public async cancelBond(
        signer: string,
        id: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.bond.v1beta1.MsgCancelBond",
            value: MsgCancelBond.fromPartial({
                signer: signer,
                id: id,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("cancel bond request sent successfully") })
                .catch(function (error) { console.log(`error in cancelling bond: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending CancelBond message: ${error}`);
        }
    }

    /// ------------------------ NAMESERVICE MODULE MESSAGES ---------------------- ///

    public async associateBond(
        recordId: string,
        bondId: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.auction.v1beta1.MsgAssociateBond",
            value: MsgAssociateBond.fromPartial({
                signer: signer,
                recordId: recordId,
                bondId: bondId,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("associate bond request sent successfully") })
                .catch(function (error) { console.log(`error in associating bond: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending AssociateBond message: ${error}`);
        }
    }

    public async dissociateBond(
        recordId: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgDissociateBond",
            value: MsgDissociateBond.fromPartial({
                signer: signer,
                recordId: recordId,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("dissociate bond request sent successfully") })
                .catch(function (error) { console.log(`error in dissociating bond: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending DissociateBond message: ${error}`);
        }
    }

    public async dissociateRecords(
        bondId: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgDissociateRecords",
            value: MsgDissociateRecords.fromPartial({
                signer: signer,
                bondId: bondId,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("dissociate records request sent successfully") })
                .catch(function (error) { console.log(`error in dissociating records: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending DissociateRecords message: ${error}`);
        }
    }

    public async deleteNameAuthority(
        wrn: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgDeleteNameAuthority",
            value: MsgDeleteNameAuthority.fromPartial({
                signer: signer,
                wrn: wrn,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("delete name authority request sent successfully") })
                .catch(function (error) { console.log(`error in deleting name authority: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending DeleteNameAuthority message: ${error}`);
        }
    }

    public async reAssociateRecords(
        oldBondId: string,
        newBondId: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgReAssociateRecords",
            value: MsgReAssociateRecords.fromPartial({
                signer: signer,
                oldBondId: oldBondId,
                newBondId: newBondId,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("reassociate records request sent successfully") })
                .catch(function (error) { console.log(`error in reassociating records: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending ReAssociateRecords message: ${error}`);
        }
    }

    public async renewRecord(
        recordId: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgRenewRecord",
            value: MsgRenewRecord.fromPartial({
                signer: signer,
                recordId: recordId,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("renew record request sent successfully") })
                .catch(function (error) { console.log(`error in renewing record: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending RenewRecord message: ${error}`);
        }
    }

    public async setAuthorityBond(
        bondId: string,
        name: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgSetAuthorityBond",
            value: MsgSetAuthorityBond.fromPartial({
                signer: signer,
                bondId: bondId,
                name: name,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("set authority bond request sent successfully") })
                .catch(function (error) { console.log(`error in setting authority bond: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending SetAuthorityBond message: ${error}`);
        }
    }

    public async reserveAuthority(
        name: string,
        owner: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgReserveAuthority",
            value: MsgReserveAuthority.fromPartial({
                signer: signer,
                name: name,
                owner: owner,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("reserve authority request sent successfully") })
                .catch(function (error) { console.log(`error in reserving authority: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending ReserveAuthority message: ${error}`);
        }
    }

    public async setName(
        wrn: string,
        cid: string,
        signer: string,
    ) {
        const message = {
            typeUrl: "/vulcanize.nameservice.v1beta1.MsgSetName",
            value: MsgSetName.fromPartial({
                signer: signer,
                wrn: wrn,
                cid: cid,
            }),
        }

        const [account] = await this.signer.getAccounts();

        try {
            this.sendTxMessage(message, account.address)
                .then(function () { console.log("set name request sent successfully") })
                .catch(function (error) { console.log(`error in setting name: ${error}`) })
        }
        catch (error) {
            console.log(`Error encountered while sending SetName message: ${error}`);
        }
    }
}

