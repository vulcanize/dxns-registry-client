# DXNS Client Library

This library contains utilities to access DXNS modules on the Vulcanize Ethermint chain.

## Setup Instructions

- Generate the TypeScript messages for CosmJS using the proto files:
```
protoc \
  --plugin="./node_modules/.bin/protoc-gen-ts_proto" \
  --ts_proto_out="./dist/proto" \
  --proto_path="./proto" \
  --ts_proto_opt="esModuleInterop=true,forceLong=long,useOptionals=true" \
  "./proto/vulcanize/auction/v1beta1/genesis.proto" \
  "./proto/vulcanize/auction/v1beta1/query.proto" \
  "./proto/vulcanize/auction/v1beta1/tx.proto" \
  "./proto/vulcanize/auction/v1beta1/types.proto" \
  "./proto/vulcanize/bond/v1beta1/bond.proto" \
  "./proto/vulcanize/bond/v1beta1/query.proto" \
  "./proto/vulcanize/bond/v1beta1/tx.proto" \
  "./proto/vulcanize/bond/v1beta1/genesis.proto" \
  "./proto/vulcanize/nameservice/v1beta1/nameservice.proto" \
  "./proto/vulcanize/nameservice/v1beta1/query.proto" \
  "./proto/vulcanize/nameservice/v1beta1/tx.proto" \
  "./proto/vulcanize/nameservice/v1beta1/genesis.proto" \
  "./proto/cosmos/auth/v1beta1/auth.proto" \
  "./proto/cosmos/base/v1beta1/coin.proto" \
  "./proto/cosmos/base/query/v1beta1/pagination.proto" \
  "./proto/ethermint/types/v1/account.proto" \
  "./proto/gogoproto/gogo.proto" \
  "./proto/google/api/annotations.proto"
  ```