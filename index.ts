/**
 * Linea Voyage - Social and Entertainment Week!
 * 
 * Author @3lang3 2023-06-20
 * Github: https://github.com/3lang3
 */

import { loop, randomLetterString, randomString } from './utils/utils';
import { cli } from './utils/cli';
import { ethers } from 'ethers';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { lineal2DomainAbi, lineasterAbi, meetAbi, meetNftAbi, snapshotXData, tatarotAbi } from './const';
import erc20Abi from './const/erc20.json';
import * as CJ from 'crypto-js';

const provider = new ethers.providers.JsonRpcProvider('https://linea-testnet.rpc.thirdweb.com');

// gas超过300gwei，不执行
const overrides = async (addr: string, limit = 300) => {
  const gasPrice = await provider.getGasPrice();
  const gasGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
  console.log(`=======[GAS PRICE] ${gasGwei} gwei=======`)
  if (+gasGwei > limit) throw Error('gas price too high');
  const modifyGasPrice = gasPrice.add(ethers.utils.parseUnits('10', 'gwei'))
  const nonce = await provider.getTransactionCount(addr);
  return ({
    nonce,
    maxFeePerGas: modifyGasPrice,
    maxPriorityFeePerGas: modifyGasPrice
  })
}

const ensReg = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const abi = ['function mintSubdomain(string, address) payable'];
    const ca = '0xf9D4b242DCcbB6AB3b3Fea6750bbAb536f925bD3'
    const signer = wallet.connect(provider);
    const contract = new ethers.Contract(ca, abi, signer);
    const domain = randomLetterString(10).toLocaleLowerCase()
    console.log(`[ensReg]开始注册${domain}.linea-build.eth`);
    const tx = await contract.mintSubdomain(`${domain}.linea-build.eth`, wallet.address, {
      value: ethers.utils.parseEther('0.01'),
      ...await overrides(wallet.address),
    });
    console.log(`[ensReg]注册成功，等待链上确认`);
    await tx.wait();
    console.log(`[ensReg]注册成功`, tx.hash);
  })
};

const lineaster = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    let ca = '0x407972ca4683803a926a85963f28C71147c6DBdF'
    const signer = wallet.connect(provider);
    // create profile
    console.log(`[lineaster]开始创建profile[${wallet.address}]`)
    const { data: { data: { challenge: { text } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "Challenge", "variables": { "request": { "address": wallet.address } }, "query": "query Challenge($request: ChallengeRequest!) {\n  challenge(request: $request) {\n    text\n    __typename\n  }\n}" })
    let signature = await signer.signMessage(text)
    let { data: { data: { authenticate: { accessToken } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "Authenticate", "variables": { "request": { "address": wallet.address, "signature": signature } }, "query": "mutation Authenticate($request: SignedAuthChallenge!) {\n  authenticate(request: $request) {\n    accessToken\n    refreshToken\n    __typename\n  }\n}" })
    console.log(`[lineaster]获取token成功: ${accessToken}`)
    accessToken = `Bearer ${accessToken}`;

    let { data: { data: { userSigNonces: { lensHubOnChainSigNonce }, profiles: { items: [profile] } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "UserProfiles", "variables": { "ownedBy": wallet.address }, "query": "query UserProfiles($ownedBy: [EthereumAddress!]) {\n  profiles(request: {ownedBy: $ownedBy}) {\n    items {\n      ...ProfileFields\n      interests\n      isDefault\n      dispatcher {\n        address\n        canUseRelay\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  userSigNonces {\n    lensHubOnChainSigNonce\n    __typename\n  }\n}\n\nfragment ProfileFields on Profile {\n  id\n  name\n  handle\n  bio\n  ownedBy\n  isFollowedByMe\n  stats {\n    totalFollowers\n    totalFollowing\n    __typename\n  }\n  attributes {\n    key\n    value\n    __typename\n  }\n  picture {\n    ... on MediaSet {\n      original {\n        url\n        __typename\n      }\n      __typename\n    }\n    ... on NftImage {\n      uri\n      __typename\n    }\n    __typename\n  }\n  followModule {\n    __typename\n  }\n  __typename\n}" }, {
      headers: {
        'x-access-token': accessToken
      }
    })
    if (!profile?.handle) {
      await loop(async () => {
        const contract = new ethers.Contract(ca, lineasterAbi, signer);
        const name = randomLetterString(8).toLocaleLowerCase();
        const tx = await contract.proxyCreateProfile({
          to: wallet.address,
          handle: name,
          imageURI: `https://cdn.stamp.fyi/avatar/eth:${wallet.address}?s=300`,
          followModule: ethers.constants.AddressZero,
          followModuleInitData: '0x',
          followNFTURI: '',
        }, {
          ...await overrides(wallet.address),
        });
        console.log(`[lineaster]创建profile成功，等待链上确认`)
        await tx.wait();
        console.log(`[lineaster]创建profile成功`);
      });

      ({ data: { data: { userSigNonces: { lensHubOnChainSigNonce }, profiles: { items: [profile] } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "UserProfiles", "variables": { "ownedBy": wallet.address }, "query": "query UserProfiles($ownedBy: [EthereumAddress!]) {\n  profiles(request: {ownedBy: $ownedBy}) {\n    items {\n      ...ProfileFields\n      interests\n      isDefault\n      dispatcher {\n        address\n        canUseRelay\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  userSigNonces {\n    lensHubOnChainSigNonce\n    __typename\n  }\n}\n\nfragment ProfileFields on Profile {\n  id\n  name\n  handle\n  bio\n  ownedBy\n  isFollowedByMe\n  stats {\n    totalFollowers\n    totalFollowing\n    __typename\n  }\n  attributes {\n    key\n    value\n    __typename\n  }\n  picture {\n    ... on MediaSet {\n      original {\n        url\n        __typename\n      }\n      __typename\n    }\n    ... on NftImage {\n      uri\n      __typename\n    }\n    __typename\n  }\n  followModule {\n    __typename\n  }\n  __typename\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      }))
    }

    let contract = new ethers.Contract('0x28af365578586eD5Fd500A1Dc0a3E20Fc7b2Cffa', lineasterAbi, signer);
    // create post
    await loop(async () => {
      if (lensHubOnChainSigNonce > 0) return;
      const metaId = randomUUID();
      const randomContent = randomString(20)
      const { data: { id: postId } } = await axios.post('https://metadata.lenster.xyz/', { "version": "2.0.0", "metadata_id": metaId, "content": `${randomContent} hello linea `, "external_url": `https://lenster.xyz/u/${profile.handle}`, "image": null, "imageMimeType": null, "name": `POST by @${profile.handle}`, "tags": [], "animation_url": null, "mainContentFocus": "TEXT_ONLY", "contentWarning": null, "attributes": [{ "traitType": "type", "displayType": "string", "value": "text_only" }], "media": [], "locale": "zh-CN", "appId": "Lineaster" })

      const { data: { data: { createPostTypedData: { typedData, id } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "CreatePostTypedData", "variables": { "options": { "overrideSigNonce": lensHubOnChainSigNonce }, "request": { "profileId": profile.id, "contentURI": `ar://${postId}`, "collectModule": { "revertCollectModule": true }, "referenceModule": { "followerOnlyReferenceModule": false } } }, "query": "mutation CreatePostTypedData($options: TypedDataOptions, $request: CreatePublicPostRequest!) {\n  createPostTypedData(options: $options, request: $request) {\n    id\n    expiresAt\n    typedData {\n      types {\n        PostWithSig {\n          name\n          type\n          __typename\n        }\n        __typename\n      }\n      domain {\n        name\n        chainId\n        version\n        verifyingContract\n        __typename\n      }\n      value {\n        nonce\n        deadline\n        profileId\n        contentURI\n        collectModule\n        collectModuleInitData\n        referenceModule\n        referenceModuleInitData\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      })

      delete typedData.types.__typename;
      delete typedData.domain.__typename;

      signature = await signer._signTypedData(typedData.domain, typedData.types, typedData.value)

      await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "Broadcast", "variables": { "request": { "id": id, "signature": signature } }, "query": "mutation Broadcast($request: BroadcastRequest!) {\n  broadcast(request: $request) {\n    ... on RelayerResult {\n      txHash\n      txId\n      __typename\n    }\n    ... on RelayError {\n      reason\n      __typename\n    }\n    __typename\n  }\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      })

      const splitSig = ethers.utils.splitSignature(signature);
      const tx = await contract.postWithSig({
        "profileId": profile.id,
        "contentURI": `ar://${postId}`,
        "collectModule": "0x3111B932cF33a980De37734a4dA10163b2b84077",
        "collectModuleInitData": "0x",
        "referenceModule": "0x0000000000000000000000000000000000000000",
        "referenceModuleInitData": '0x',
        "sig": {
          "v": splitSig.v,
          "r": splitSig.r,
          "s": splitSig.s,
          "deadline": typedData.value.deadline
        }
      }, {
        ...await overrides(wallet.address),
      })
      console.log(`[lineaster]创建post成功，等待链上确认`)
      await tx.wait();
      console.log(`[lineaster]链上确认成功`)
    })

    const { data: { data: { profile: { followModule } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "SuperFollow", "variables": { "request": { "profileId": "0x26" } }, "query": "query SuperFollow($request: SingleProfileQueryRequest!) {\n  profile(request: $request) {\n    id\n    followModule {\n      ... on FeeFollowModuleSettings {\n        amount {\n          asset {\n            name\n            symbol\n            decimals\n            address\n            __typename\n          }\n          value\n          __typename\n        }\n        recipient\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}" }, {
      headers: {
        'x-access-token': accessToken
      }
    })
    const erc20Token = new ethers.Contract(followModule.amount.asset.address, erc20Abi, signer);
    const balance = await erc20Token.balanceOf(wallet.address);
    if (balance.isZero()) {
      console.log('USDC 余额不足, 无法进行follow,collect');
      return
    }
    // follow linea
    await loop(async () => {
      const { data: { data: { profile: { isFollowedByMe } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "Profile", "variables": { "request": { "handle": "linea.test" }, "who": "0x5e5f" }, "query": "query Profile($request: SingleProfileQueryRequest!, $who: ProfileId) {\n  profile(request: $request) {\n    id\n    handle\n    ownedBy\n    name\n    bio\n    metadata\n    followNftAddress\n    isFollowedByMe\n    isFollowing(who: $who)\n    attributes {\n      key\n      value\n      __typename\n    }\n    dispatcher {\n      address\n      canUseRelay\n      __typename\n    }\n    onChainIdentity {\n      proofOfHumanity\n      sybilDotOrg {\n        verified\n        source {\n          twitter {\n            handle\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      ens {\n        name\n        __typename\n      }\n      worldcoin {\n        isHuman\n        __typename\n      }\n      __typename\n    }\n    stats {\n      totalFollowers\n      totalFollowing\n      totalPosts\n      totalComments\n      totalMirrors\n      __typename\n    }\n    picture {\n      ... on MediaSet {\n        original {\n          url\n          __typename\n        }\n        __typename\n      }\n      ... on NftImage {\n        uri\n        __typename\n      }\n      __typename\n    }\n    coverPicture {\n      ... on MediaSet {\n        original {\n          url\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    followModule {\n      __typename\n    }\n    __typename\n  }\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      })
      if (isFollowedByMe) {
        console.log(`[lineaster]已经关注`)
        return;
      }
      console.log(`[lineaster]开始关注`)
      const allowance = await erc20Token.allowance(wallet.address, '0x218fcf793fa1e4fda220fb7e55adf9d8fe0b8c96');
      if (allowance.isZero()) {
        let tx = await erc20Token.approve('0x218fcf793fa1e4fda220fb7e55adf9d8fe0b8c96', ethers.constants.MaxUint256, await overrides(wallet.address))
        console.log(`[lineaster]approve 等待链上确认`)
        await tx.wait();
        console.log(`[lineaster]approve链上确认成功`);
      };

      ({ data: { data: { userSigNonces: { lensHubOnChainSigNonce } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "UserProfiles", "variables": { "ownedBy": wallet.address }, "query": "query UserProfiles($ownedBy: [EthereumAddress!]) {\n  profiles(request: {ownedBy: $ownedBy}) {\n    items {\n      ...ProfileFields\n      interests\n      isDefault\n      dispatcher {\n        address\n        canUseRelay\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  userSigNonces {\n    lensHubOnChainSigNonce\n    __typename\n  }\n}\n\nfragment ProfileFields on Profile {\n  id\n  name\n  handle\n  bio\n  ownedBy\n  isFollowedByMe\n  stats {\n    totalFollowers\n    totalFollowing\n    __typename\n  }\n  attributes {\n    key\n    value\n    __typename\n  }\n  picture {\n    ... on MediaSet {\n      original {\n        url\n        __typename\n      }\n      __typename\n    }\n    ... on NftImage {\n      uri\n      __typename\n    }\n    __typename\n  }\n  followModule {\n    __typename\n  }\n  __typename\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      }));
      const r = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "CreateFollowTypedData", "variables": { "options": { "overrideSigNonce": lensHubOnChainSigNonce }, "request": { "follow": [{ "profile": "0x26", "followModule": { "feeFollowModule": { "amount": { "currency": "0xf56dc6695cF1f5c364eDEbC7Dc7077ac9B586068", "value": "10.0" } } } }] } }, "query": "mutation CreateFollowTypedData($options: TypedDataOptions, $request: FollowRequest!) {\n  createFollowTypedData(options: $options, request: $request) {\n    id\n    expiresAt\n    typedData {\n      domain {\n        name\n        chainId\n        version\n        verifyingContract\n        __typename\n      }\n      types {\n        FollowWithSig {\n          name\n          type\n          __typename\n        }\n        __typename\n      }\n      value {\n        nonce\n        deadline\n        profileIds\n        datas\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      });
      const { data: { data: { createFollowTypedData: { typedData } } } } = r
      delete typedData.types.__typename;
      delete typedData.domain.__typename;

      const signature = await signer._signTypedData(typedData.domain, typedData.types, typedData.value)
      const splitSig = ethers.utils.splitSignature(signature);

      const tx = await contract.followWithSig({
        "follower": wallet.address,
        "profileIds": typedData.value.profileIds,
        "datas": typedData.value.datas,
        "sig": {
          "v": splitSig.v,
          "r": splitSig.r,
          "s": splitSig.s,
          "deadline": typedData.value.deadline,
        }
      }, {
        ...await overrides(wallet.address),
      })
      console.log(`[lineaster]关注成功，等待链上确认`)
      await tx.wait();
      console.log(`[lineaster]链上确认成功`)
    })

    // collect
    await loop(async () => {
      const { data: { data: { publication: { hasCollectedByMe } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "Publication", "variables": { "request": { "publicationId": "0x26-0x03" }, "reactionRequest": { "profileId": "0x5e5f" }, "profileId": "0x5e5f" }, "query": "query Publication($request: PublicationQueryRequest!, $reactionRequest: ReactionFieldResolverRequest, $profileId: ProfileId) {\n  publication(request: $request) {\n    ... on Post {\n      ...PostFields\n      collectNftAddress\n      profile {\n        isFollowedByMe\n        __typename\n      }\n      referenceModule {\n        __typename\n      }\n      __typename\n    }\n    ... on Comment {\n      ...CommentFields\n      collectNftAddress\n      profile {\n        isFollowedByMe\n        __typename\n      }\n      referenceModule {\n        __typename\n      }\n      __typename\n    }\n    ... on Mirror {\n      ...MirrorFields\n      collectNftAddress\n      profile {\n        isFollowedByMe\n        __typename\n      }\n      referenceModule {\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment PostFields on Post {\n  id\n  profile {\n    ...ProfileFields\n    __typename\n  }\n  reaction(request: $reactionRequest)\n  mirrors(by: $profileId)\n  hasCollectedByMe\n  onChainContentURI\n  isGated\n  canComment(profileId: $profileId) {\n    result\n    __typename\n  }\n  canMirror(profileId: $profileId) {\n    result\n    __typename\n  }\n  canDecrypt(profileId: $profileId) {\n    result\n    reasons\n    __typename\n  }\n  collectModule {\n    ...CollectModuleFields\n    __typename\n  }\n  stats {\n    ...StatsFields\n    __typename\n  }\n  metadata {\n    ...MetadataFields\n    __typename\n  }\n  hidden\n  createdAt\n  appId\n  __typename\n}\n\nfragment ProfileFields on Profile {\n  id\n  name\n  handle\n  bio\n  ownedBy\n  isFollowedByMe\n  stats {\n    totalFollowers\n    totalFollowing\n    __typename\n  }\n  attributes {\n    key\n    value\n    __typename\n  }\n  picture {\n    ... on MediaSet {\n      original {\n        url\n        __typename\n      }\n      __typename\n    }\n    ... on NftImage {\n      uri\n      __typename\n    }\n    __typename\n  }\n  followModule {\n    __typename\n  }\n  __typename\n}\n\nfragment CollectModuleFields on CollectModule {\n  ... on FreeCollectModuleSettings {\n    type\n    contractAddress\n    followerOnly\n    __typename\n  }\n  ... on FeeCollectModuleSettings {\n    type\n    referralFee\n    contractAddress\n    followerOnly\n    amount {\n      ...ModuleFeeAmountFields\n      __typename\n    }\n    __typename\n  }\n  ... on LimitedFeeCollectModuleSettings {\n    type\n    collectLimit\n    referralFee\n    contractAddress\n    followerOnly\n    amount {\n      ...ModuleFeeAmountFields\n      __typename\n    }\n    __typename\n  }\n  ... on LimitedTimedFeeCollectModuleSettings {\n    type\n    collectLimit\n    endTimestamp\n    referralFee\n    contractAddress\n    followerOnly\n    amount {\n      ...ModuleFeeAmountFields\n      __typename\n    }\n    __typename\n  }\n  ... on TimedFeeCollectModuleSettings {\n    type\n    endTimestamp\n    referralFee\n    contractAddress\n    followerOnly\n    amount {\n      ...ModuleFeeAmountFields\n      __typename\n    }\n    __typename\n  }\n  ... on MultirecipientFeeCollectModuleSettings {\n    type\n    contractAddress\n    amount {\n      ...ModuleFeeAmountFields\n      __typename\n    }\n    optionalCollectLimit: collectLimit\n    referralFee\n    followerOnly\n    optionalEndTimestamp: endTimestamp\n    recipients {\n      recipient\n      split\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ModuleFeeAmountFields on ModuleFeeAmount {\n  asset {\n    symbol\n    decimals\n    address\n    __typename\n  }\n  value\n  __typename\n}\n\nfragment StatsFields on PublicationStats {\n  totalUpvotes\n  totalAmountOfMirrors\n  totalAmountOfCollects\n  totalAmountOfComments\n  __typename\n}\n\nfragment MetadataFields on MetadataOutput {\n  name\n  content\n  image\n  attributes {\n    traitType\n    value\n    __typename\n  }\n  cover {\n    original {\n      url\n      __typename\n    }\n    __typename\n  }\n  media {\n    original {\n      url\n      mimeType\n      __typename\n    }\n    __typename\n  }\n  encryptionParams {\n    accessCondition {\n      or {\n        criteria {\n          ...SimpleConditionFields\n          and {\n            criteria {\n              ...SimpleConditionFields\n              __typename\n            }\n            __typename\n          }\n          or {\n            criteria {\n              ...SimpleConditionFields\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment SimpleConditionFields on AccessConditionOutput {\n  nft {\n    contractAddress\n    chainID\n    contractType\n    tokenIds\n    __typename\n  }\n  eoa {\n    address\n    __typename\n  }\n  token {\n    contractAddress\n    amount\n    chainID\n    condition\n    decimals\n    __typename\n  }\n  follow {\n    profileId\n    __typename\n  }\n  collect {\n    publicationId\n    thisPublication\n    __typename\n  }\n  __typename\n}\n\nfragment CommentFields on Comment {\n  id\n  profile {\n    ...ProfileFields\n    __typename\n  }\n  reaction(request: $reactionRequest)\n  mirrors(by: $profileId)\n  hasCollectedByMe\n  onChainContentURI\n  isGated\n  canComment(profileId: $profileId) {\n    result\n    __typename\n  }\n  canMirror(profileId: $profileId) {\n    result\n    __typename\n  }\n  canDecrypt(profileId: $profileId) {\n    result\n    reasons\n    __typename\n  }\n  collectModule {\n    ...CollectModuleFields\n    __typename\n  }\n  stats {\n    ...StatsFields\n    __typename\n  }\n  metadata {\n    ...MetadataFields\n    __typename\n  }\n  hidden\n  createdAt\n  appId\n  commentOn {\n    ... on Post {\n      ...PostFields\n      __typename\n    }\n    ... on Comment {\n      id\n      profile {\n        ...ProfileFields\n        __typename\n      }\n      reaction(request: $reactionRequest)\n      mirrors(by: $profileId)\n      hasCollectedByMe\n      onChainContentURI\n      isGated\n      canComment(profileId: $profileId) {\n        result\n        __typename\n      }\n      canMirror(profileId: $profileId) {\n        result\n        __typename\n      }\n      canDecrypt(profileId: $profileId) {\n        result\n        reasons\n        __typename\n      }\n      collectModule {\n        ...CollectModuleFields\n        __typename\n      }\n      metadata {\n        ...MetadataFields\n        __typename\n      }\n      stats {\n        ...StatsFields\n        __typename\n      }\n      mainPost {\n        ... on Post {\n          ...PostFields\n          __typename\n        }\n        ... on Mirror {\n          ...MirrorFields\n          __typename\n        }\n        __typename\n      }\n      hidden\n      createdAt\n      __typename\n    }\n    ... on Mirror {\n      ...MirrorFields\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment MirrorFields on Mirror {\n  id\n  profile {\n    ...ProfileFields\n    __typename\n  }\n  reaction(request: $reactionRequest)\n  hasCollectedByMe\n  isGated\n  canComment(profileId: $profileId) {\n    result\n    __typename\n  }\n  canMirror(profileId: $profileId) {\n    result\n    __typename\n  }\n  canDecrypt(profileId: $profileId) {\n    result\n    reasons\n    __typename\n  }\n  collectModule {\n    ...CollectModuleFields\n    __typename\n  }\n  stats {\n    ...StatsFields\n    __typename\n  }\n  metadata {\n    ...MetadataFields\n    __typename\n  }\n  hidden\n  mirrorOf {\n    ... on Post {\n      ...PostFields\n      __typename\n    }\n    ... on Comment {\n      id\n      profile {\n        ...ProfileFields\n        __typename\n      }\n      collectNftAddress\n      reaction(request: $reactionRequest)\n      mirrors(by: $profileId)\n      onChainContentURI\n      isGated\n      canComment(profileId: $profileId) {\n        result\n        __typename\n      }\n      canMirror(profileId: $profileId) {\n        result\n        __typename\n      }\n      canDecrypt(profileId: $profileId) {\n        result\n        reasons\n        __typename\n      }\n      stats {\n        ...StatsFields\n        __typename\n      }\n      createdAt\n      __typename\n    }\n    __typename\n  }\n  createdAt\n  appId\n  __typename\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      });
      if (hasCollectedByMe) {
        console.log(`[lineaster]已经收藏过了`)
        return;
      }
      console.log(`[lineaster]开始收藏`)
      const allowance = await erc20Token.allowance(wallet.address, '0x3dfe8c165929f4abb02ffb3a46cce6bda4e5fabe');
      if (allowance.isZero()) {
        let tx = await erc20Token.approve('0x3dfe8c165929f4abb02ffb3a46cce6bda4e5fabe', ethers.constants.MaxUint256, await overrides(wallet.address))
        console.log(`[lineaster]approve 等待链上确认`)
        await tx.wait();
        console.log(`[lineaster]approve链上确认成功`);
      };
      ({ data: { data: { userSigNonces: { lensHubOnChainSigNonce } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "UserProfiles", "variables": { "ownedBy": wallet.address }, "query": "query UserProfiles($ownedBy: [EthereumAddress!]) {\n  profiles(request: {ownedBy: $ownedBy}) {\n    items {\n      ...ProfileFields\n      interests\n      isDefault\n      dispatcher {\n        address\n        canUseRelay\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  userSigNonces {\n    lensHubOnChainSigNonce\n    __typename\n  }\n}\n\nfragment ProfileFields on Profile {\n  id\n  name\n  handle\n  bio\n  ownedBy\n  isFollowedByMe\n  stats {\n    totalFollowers\n    totalFollowing\n    __typename\n  }\n  attributes {\n    key\n    value\n    __typename\n  }\n  picture {\n    ... on MediaSet {\n      original {\n        url\n        __typename\n      }\n      __typename\n    }\n    ... on NftImage {\n      uri\n      __typename\n    }\n    __typename\n  }\n  followModule {\n    __typename\n  }\n  __typename\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      }));
      const { data: { data: { createCollectTypedData: { typedData } } } } = await axios.post('https://api-zkevm-goerli.lens.dev/', { "operationName": "CreateCollectTypedData", "variables": { "options": { "overrideSigNonce": lensHubOnChainSigNonce }, "request": { "publicationId": "0x26-0x03" } }, "query": "mutation CreateCollectTypedData($options: TypedDataOptions, $request: CreateCollectRequest!) {\n  createCollectTypedData(options: $options, request: $request) {\n    id\n    expiresAt\n    typedData {\n      types {\n        CollectWithSig {\n          name\n          type\n          __typename\n        }\n        __typename\n      }\n      domain {\n        name\n        chainId\n        version\n        verifyingContract\n        __typename\n      }\n      value {\n        nonce\n        deadline\n        profileId\n        pubId\n        data\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}" }, {
        headers: {
          'x-access-token': accessToken
        }
      });
      delete typedData.types.__typename;
      delete typedData.domain.__typename;

      const signature = await signer._signTypedData(typedData.domain, typedData.types, typedData.value)
      const splitSig = ethers.utils.splitSignature(signature);

      const tx = await contract.collectWithSig({
        "collector": wallet.address,
        "profileId": typedData.value.profileId,
        "pubId": typedData.value.pubId,
        "data": typedData.value.data,
        "sig": {
          "v": splitSig.v,
          "r": splitSig.r,
          "s": splitSig.s,
          "deadline": typedData.value.deadline,
        }
      }, {
        ...await overrides(wallet.address),
      })
      console.log(`[lineaster]收藏成功，等待链上确认`)
      await tx.wait();
      console.log(`[lineaster]链上确认成功`)
    })
  })
};

const snapshotX = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const ca = '0xdDb36B865A1021524b936FB29FCbA5Fac073DB74'
    const signer = wallet.connect(provider);
    console.log(`[snapshotX] ${wallet.address} 投票中`)
    const tx = await signer.sendTransaction(
      {
        data: snapshotXData(wallet.address),
        to: ca,
        ...await overrides(wallet.address),
      });
    console.log(`[snapshotX]投票，等待链上确认`)
    await tx.wait();
    console.log(`[snapshotX]链上确认成功`)
  })
};

const lineal2Domain = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const ca = '0x03555948C82A6F473b28b1e7541dc91D1927D52d'
    const signer = wallet.connect(provider);
    const contract = new ethers.Contract(ca, lineal2DomainAbi, signer);
    const domain = randomLetterString(10).toLocaleLowerCase()
    const tx = await contract.register(
      domain,
      31536e3,
      {
        value: ethers.utils.parseEther('0.0025'),
        ...await overrides(wallet.address),
      });
    console.log(`[lineal2Domain]注册域名${domain}，等待链上确认`)
    await tx.wait();
    console.log(`[lineal2Domain]链上确认成功`)
  })
};

const atticc = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const message = `
  Purpose: Sign to verify wallet ownership in Atticc platform.
  Wallet address: ${wallet.address}
  Nonce: ${Date.now()}`

    const signedMessage = await wallet.signMessage(message);
    const { data: { token } } = await axios.post('https://atticc.xyz/api/verify', {
      message,
      signedMessage,
      publicAddress: wallet.address
    })
    console.log(`[atticc]签名验证成功，token: ${token}`)
    await axios.post('https://query.dev.atticc.xyz/v1/graphql', { "query": "\n  mutation joinCommunity(\n    $communityAddress: String = \"\"\n    $userAddress: String = \"\"\n    $role: atticcdev_COMMUNITY_ROLE_enum = MEMBER\n  ) {\n    insert_atticcdev_community_membership(\n      objects: { communityAddress: $communityAddress, userAddress: $userAddress, role: $role }\n    ) {\n      returning {\n        id\n      }\n    }\n  }\n", "variables": { "role": "MEMBER", "communityAddress": "0xa186D739CA2b3022b966194004C6b01855D59571", "userAddress": wallet.address }, "operationName": "joinCommunity" }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log(`[atticc]成功加入社区`)
    const ca = '0x0E685e48Bb85285B50E0B6aA9208AaCeaF9147fF'
    const abi = ['function mint(uint256 quantity)']
    const signer = wallet.connect(provider);
    const contract = new ethers.Contract(ca, abi, signer);
    const tx = await contract.mint(
      1,
      {
        ...await overrides(wallet.address),
      });
    console.log(`[atticc]mint，等待链上确认`)
    await tx.wait();
    console.log(`[atticc]链上确认成功`)
  })
}

const vitidiary = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const message = `
  Purpose: Sign to verify wallet ownership in Atticc platform.
  Wallet address: ${wallet.address}
  Nonce: ${Date.now()}`

    const signedMessage = await wallet.signMessage(message);
    const { data: { token } } = await axios.post('https://atticc.xyz/api/verify', {
      message,
      signedMessage,
      publicAddress: wallet.address
    })
    console.log(`[atticc]签名验证成功，token: ${token}`)
    await axios.post('https://query.dev.atticc.xyz/v1/graphql', { "query": "\n  mutation joinCommunity(\n    $communityAddress: String = \"\"\n    $userAddress: String = \"\"\n    $role: atticcdev_COMMUNITY_ROLE_enum = MEMBER\n  ) {\n    insert_atticcdev_community_membership(\n      objects: { communityAddress: $communityAddress, userAddress: $userAddress, role: $role }\n    ) {\n      returning {\n        id\n      }\n    }\n  }\n", "variables": { "role": "MEMBER", "communityAddress": "0xa186D739CA2b3022b966194004C6b01855D59571", "userAddress": wallet.address }, "operationName": "joinCommunity" }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const ca = '0x6DB87bA2f78d42D9A1c6Adcd04e760EFB277461B'
    const abi = [
      'function completeTutorial()',
      'function mint(uint256 quantity)'
    ]
    const signer = wallet.connect(provider);
    const contract = new ethers.Contract(ca, abi, signer);

    await loop(async () => {
      const tx = await contract.completeTutorial({
        ...await overrides(wallet.address),
      });

      console.log(`[vitidiary]completeTutorial，等待链上确认`)

      await tx.wait();
      console.log(`[vitidiary]completeTutorial 链上确认成功`);
    })

    await loop(async () => {
      console.log(`[vitidiary]mint，等待链上确认`)
      const tx = await contract.mint(
        1,
        {
          ...await overrides(wallet.address),
        });

      await tx.wait();
      console.log(`[vitidiary]mint 链上确认成功`)
    })
  })
}

const zkholdem = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const signer = wallet.connect(provider);
    const contract = new ethers.Contract(
      '0x4f79bD6754aF6c42975006C5398fC1b08e15a280',
      ['function mintChips(address permanentAccount,uint256 amount)'],
      signer
    );
    const tx = await contract.mintChips(
      wallet.address,
      20000,
      {
        ...await overrides(wallet.address),
      });
    console.log(`[zkholdem]mintChips，等待链上确认`)
    await tx.wait();
    console.log(`[zkholdem]mintChips 链上确认成功`)
  })
}

const battlemon = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const signer = wallet.connect(provider);
    let contract = new ethers.Contract(
      '0xB0375deF6ABA7687c268bEcac620865b0c1ED120',
      ['function mint(address to) payable'],
      signer
    );

    await loop(async () => {
      const tx = await contract.mint(
        wallet.address,
        {
          value: ethers.utils.parseEther('0.01'),
          ...await overrides(wallet.address),
        });
      console.log(`[battlemon]mint，等待链上确认`)
      await tx.wait();
      console.log(`[battlemon]mint 链上确认成功`)
    })
    contract = new ethers.Contract(
      '0x35D42D4BdC36CfE33A5ea6672A1B81752A963d6d',
      ['function mint(address to, uint256 amount)'],
      signer
    );
    await loop(async () => {
      const tx = await contract.mint(
        wallet.address,
        1,
        {
          ...await overrides(wallet.address),
        });
      console.log(`[battlemon]green mint，等待链上确认`)
      await tx.wait();
      console.log(`[battlemon]green mint 链上确认成功`)
    })
  })
}

const moonlight = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    let r: any = await fetch("https://moonlight-linea-show.ultiverse.io/api/user/signature", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": "https://moonlight-linea-show.ultiverse.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": `{\"address\":\"${wallet.address}\",\"feature\":\"assets-wallet-login\",\"chainId\":59140}`,
      "method": "POST"
    });
    r = await r.json();
    const { data: { message } } = r;

    const signature = await wallet.signMessage(message);
    r = await fetch("https://moonlight-linea-show.ultiverse.io/api/wallets/signin", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": "https://moonlight-linea-show.ultiverse.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": `{\"address\":\"${wallet.address}\",\"signature\":\"${signature}\",\"chainId\":59140}`,
      "method": "POST"
    });
    r = await r.json();
    const { data } = r;

    const signer = wallet.connect(provider);
    let contract = new ethers.Contract(
      '0x6084643ca6210551390c4b6c82807106C00291ed',
      ['function saveFaceHash(address wallet, bytes faceHash)'],
      signer
    );
    let tx = await contract.saveFaceHash(
      wallet.address,
      '0x677b49b47f5da15cbac1df508c7dd9191645cfdb09553147f112d3f9c78e8d63',
      {
        ...await overrides(wallet.address),
      });
    console.log(`[moonlight]saveFaceHash，等待链上确认`)
    await tx.wait();
    console.log(`[moonlight]saveFaceHash 链上确认成功`)
    await fetch("https://moonlight-linea-show.ultiverse.io/api/moonlight/save", {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": `Ultiverse_Authorization=${data.access_token}`,
        "Referer": "https://moonlight-linea-show.ultiverse.io/space/0x565E79F526245CAE4a8c130aD95c7a2778F3aB4b",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": `{\"address\":\"${wallet.address}\",\"faceInfo\":{\"Hair Styles\":2,\"Hair Colors\":\"/HaircolorA_00/HaircolorA_00_00.png\",\"Clothes\":\"default\",\"Eyeball\":\"\"}}`,
      "method": "POST"
    });
    console.log(`[moonlight]save api 成功`)
  })
}

const metaMerge = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const signer = wallet.connect(provider);
    let r: any = await fetch("https://toolkit.ultiverse.io/api/user/signature", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "ul-auth-api-key": "bWV0YW1lcmdlQGRXeDBhWFpsY25ObA==",
        "Referer": "https://match3-linea.metamerge.xyz/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": `{\"address\":\"${wallet.address}\",\"feature\":\"assets-wallet-login\",\"chainId\":59140}`,
      "method": "POST"
    });
    r = await r.json();
    const { data: { message } } = r;
    const signature = await signer.signMessage(message);
    r = await fetch("https://toolkit.ultiverse.io/api/wallets/signin", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "ul-auth-api-key": "bWV0YW1lcmdlQGRXeDBhWFpsY25ObA==",
        "Referer": "https://match3-linea.metamerge.xyz/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": `{\"address\":\"${wallet.address}\",\"signature\":\"${signature}\",\"chainId\":59140}`,
      "method": "POST"
    });
    r = await r.json();
    const { data } = r;
    console.log(`[metaMerge]登录成功 ${data.access_token}`)
    const { data: { seed } } = await axios.get(`https://match3-linea.metamerge.xyz/api/seed?address=${wallet.address}`, {
      headers: {
        Access_token: data.access_token,
      }
    })
    const { data: payload } = await axios.get('https://match3-linea.metamerge.xyz/api/signature', {
      params: {
        uid: data.uid,
        tokenId: 1,
        seed,
        address: wallet.address,
      },
      headers: {
        Access_token: data.access_token,
      }
    })
    await loop(async () => {
      let contract = new ethers.Contract(
        '0x83Af5Eed7115C72CF3262453CE8B9Fe87AE2de3C',
        ['function claim(uint, bytes)'],
        signer
      );
      let tx = await contract.claim(
        payload.tokenId,
        payload.signature,
        {
          ...await overrides(wallet.address),
        });
      console.log(`[metaMerge]claim 成功, 等待链上确认`)
      await tx.wait();
      console.log(`[metaMerge]claim链上确认成功`)
    })
    await axios.get(`https://match3-linea.metamerge.xyz/api/galxe?address=${wallet.address}`, {
      headers: {
        Access_token: data.access_token,
      }
    })
    console.log(`[metaMerge]银河结果同步成功`)
  })
}

const readon = async (wallet: ethers.Wallet) => {
  const signer = wallet.connect(provider);
  let contract = new ethers.Contract(
    '0xB028873223d6f9624368b4Bb488e0aBe6a2F3726',
    ['function mintTo(address to, string name)'],
    signer
  );
  const name = randomLetterString(6).toLocaleLowerCase();
  let tx = await contract.mintTo(
    wallet.address,
    name,
    {
      ...await overrides(wallet.address),
    });
  console.log(`[readon]mintTo ${name}`)
  await tx.wait();
  console.log(`[readon]mintTo链上确认成功`)
}

const tatarot = async (wallet: ethers.Wallet) => {
  const signer = wallet.connect(provider);
  let { data } = await axios.post('https://fcqxmxchcrw2zp73fbjeo5plka0fkwlj.lambda-url.us-east-1.on.aws/', { "question": "if I can pass the exam" });
  console.log(`[tatarot]获取nftId成功: ${data.scryId}`);
  ({ data } = await axios.post('https://api.tatarot.ai/production/api/v1/signature-mint', { address: wallet.address, scryId: data.scryId }))
  console.log(`[tatarot]获取合约调用数据成功: ${JSON.stringify(data, null, 2)}`);
  let contract = new ethers.Contract(
    '0xa0a469C4Fd20A494B55221dD22eDf0E9b4813c8c',
    tatarotAbi,
    signer
  );
  let tx = await contract.mintWithSignature(
    data.value,
    data.signature,
    {
      ...await overrides(wallet.address)
    });
  console.log(`[tatarot]mintWithSignature 成功, 等待链上确认`)
  await tx.wait();
  console.log(`[tatarot]mintWithSignature链上确认成功`)
}

const stationX = async (wallet: ethers.Wallet) => {
  await loop(async () => {
    const signer = wallet.connect(provider);
    const ca = '0xa8136d348d70222019dc0b431DbeaF93B47C8e5B'
    let abi = [
      'function createERC20DAO(string _DaoName, string _DaoSymbol, uint256 _distributionAmount, uint256 _pricePerToken, uint256 _minDepositPerUser, uint256 _maxDepositPerUser, uint256 _ownerFeePerDepositPercent, uint256 _depositTime, uint256 _quorumPercent, uint256 _thresholdPercent, address _depositTokenAddress, address[] _admins, bool _isGovernanceActive, bool _isTransferable, bool _onlyAllowWhitelist, bytes32 _merkleRoot)'
    ]
    let contract = new ethers.Contract(ca, abi, signer);

    const name = randomLetterString(5).toLocaleLowerCase();
    const symbol = randomLetterString(3).toUpperCase();
    const depositTime = Math.floor((new Date().getTime() + 1000 * 60 * 60 * 24) / 1000);
    let tx = await contract.createERC20DAO(
      name,
      symbol,
      ethers.BigNumber.from('2000000000000000000'),
      ethers.BigNumber.from('1000000'),
      ethers.BigNumber.from('1000000'),
      2000000,
      0,
      depositTime,
      1,
      1,
      '0x45a27ea11d159a86aace1ec24d3ba3d103642d9f',
      [wallet.address],
      false,
      false,
      false,
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      {
        ...await overrides(wallet.address),
      });
    console.log(`[stationX]claim 成功, 等待链上确认`)
    await tx.wait();
    console.log(`[stationX]claim链上确认成功`)
  })

  await loop(async () => {
    const signer = wallet.connect(provider);
    const abi = ['function buyGovernanceTokenERC721DAO(address _user, address _daoAddress, string _tokenURI, uint256 _numOfTokensToBuy, bytes32[] _merkleProof)'];
    const contract = new ethers.Contract('0xa8136d348d70222019dc0b431dbeaf93b47c8e5b', abi, signer);
    const usdcAbi = [
      'function balanceOf(address account) external view returns (uint256)',
      'function allowance(address owner, address spender) external view returns (uint256)',
      'function approve(address spender, uint256 amount) external returns (bool)',
      'function mint(address to, uint256 amount) external',
    ]
    const usdc = new ethers.Contract('0x45a27ea11d159a86aace1ec24d3ba3d103642d9f', usdcAbi, signer);
    const usdcBalance = await usdc.balanceOf(wallet.address);
    if (usdcBalance.isZero()) {
      console.log(`[stationX] ${wallet.address} usdc余额为0 开始mint`)
      const tx = await usdc.mint(signer.address, 100, await overrides(wallet.address));
      console.log(`[stationX]usdc mint成功, 等待链上确认`)
      await tx.wait();
      console.log(`[stationX]usdc mint链上确认成功`)
    }
    const allowance = await usdc.allowance(wallet.address, contract.address);
    if (allowance.isZero()) {
      const tx = await usdc.approve(
        contract.address,
        ethers.constants.MaxUint256,
        await overrides(wallet.address)
      )
      console.log(`[stationX]approve 成功, 等待链上确认`)
      await tx.wait();
      console.log(`[stationX]approve链上确认成功`)
    }

    const tx = await contract.buyGovernanceTokenERC721DAO(
      wallet.address,
      '0xf06a087d97b3e9eadbdc7cd3c2146bc4d019bb19',
      'ipfs://bafyreif6tncssht4ysweqwtlgnfyxxtsgltad6eubj7533atvi45tohk2q/metadata.json',
      1,
      [],
      await overrides(wallet.address),
    )
    console.log(`[stationX]buyGovernanceTokenERC721DAO 成功, 等待链上确认`)
    await tx.wait();
    console.log(`[stationX]buyGovernanceTokenERC721DAO链上确认成功`)
  })
}

const meet = async (wallet: ethers.Wallet) => {
  const signer = wallet.connect(provider);
  const ca = '0x82E0b6ADFC1A5d4eF0787Bf941e102D244A393ea';
  let contract = new ethers.Contract(ca, meetNftAbi, signer);
  let mintCount: ethers.BigNumber = await contract.balanceOf(wallet.address);
  if (mintCount?.isZero()) {
    console.log(`[meet]没有nft, mintPublic`)
    const tx = await contract.mintPublic(
      1,
      await overrides(wallet.address)
    );
    console.log(`[meet]mintPublic 成功, 等待链上确认`)
    await tx.wait();
    console.log(`[meet]mintPublic链上确认成功`)
  }
  const hasApproved = await contract.isApprovedForAll(wallet.address, '0xb622275862EE88848E89F3c97e3e3B39A7e1E536');
  if (!hasApproved) {
    const tx = await contract.setApprovalForAll('0xb622275862EE88848E89F3c97e3e3B39A7e1E536', true, await overrides(wallet.address));
    console.log(`[meet]nft, setApprovalForAll`)
    await tx.wait();
    console.log(`[meet]setApprovalForAll链上确认成功`)
  } else {
    console.log(`[meet]nft, 已经setApprovalForAll`)
  }
  let nfts = await contract.tokenOfOwnerByIndex(wallet.address, 0);
  console.log(`[meet]拥有的nfts: ${nfts}`);
  contract = new ethers.Contract('0xb622275862EE88848E89F3c97e3e3B39A7e1E536', meetAbi, signer);
  let getStakeRecord = await contract.getStakeRecord(wallet.address);
  if (!getStakeRecord.length) {
    const tx = await contract.stakeNFTs(
      [nfts],
      await overrides(wallet.address)
    )
    console.log(`[meet]质押成功, 等待链上确认`)
    await tx.wait();
    console.log(`[meet]质押链上确认成功`)
  }
  getStakeRecord = await contract.getStakeRecord(wallet.address);
  if (!getStakeRecord.length) throw Error('无可赎回记录');
  const tx = await contract.redeem(
    getStakeRecord.map(el => el.tokenId),
    await overrides(wallet.address)
  )
  console.log(`[meet]赎回成功, 等待链上确认`)
  await tx.wait();
  console.log(`[meet]赎回链上确认成功`)

  // @ts-ignore
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  const crypt = (e, t) => {
    var n = CJ.enc.Utf8.parse(e)
      , r = CJ.enc.Utf8.parse(t)
      , i = CJ.enc.Utf8.parse(t)
      , a = CJ.AES.encrypt(n, r, {
        iv: i,
        mode: CJ.mode.CBC,
        padding: CJ.pad.Pkcs7
      });
    return CJ.enc.Base64.stringify(a.ciphertext)
  };
  for (let i = 1; i <= 3; i++) {
    const message = crypt(JSON.stringify({
      type: i,
      address: wallet.address
    }), 'p5EBnuPDFrDXK7US')
    // 通知银河确认
    await axios.post('https://lineatestnetapi.meeet.xyz/activity', { message }, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  console.log(`[meet]银河通知成功`)
}

const idriss = async (wallet: ethers.Wallet) => {
  const signer = wallet.connect(provider);
  let contract = new ethers.Contract(
    '0xe18036D7E3377801a19d5Db3f9b236617979674E',
    ['function sendTo(address, uint256, string) payable'],
    signer
  );
  const value = ethers.utils.parseEther('0.000578971545053886')
  console.log(`[idriss] ${wallet.address} 开始执行`)
  for (let i = 0; i < 3; i++) {
    await loop(async () => {
      let tx = await contract.sendTo(
        '0x5abca791c22e7f99237fcc04639e094ffa0ccce9',
        value,
        '',
        {
          value,
          ...await overrides(wallet.address),
        });
      console.log(`[idriss]sendTo第${i + 1} 次, 成功, 等待链上确认`)
      await tx.wait();
      console.log(`[idriss]sendTo 链上确认成功`)
    })
  }
}

cli(async ({ action, pk }) => {
  const wallet = new ethers.Wallet(pk);

  try {
    console.log(`[${action}] ${wallet.address} 开始执行`)
    if (action === 'ensreg') {
      await ensReg(wallet);
    }
    if (action === 'lineaster') {
      await lineaster(wallet);
    }
    if (action === 'snapshotx') {
      await snapshotX(wallet);
    }
    if (action === 'lineal2domain') {
      await lineal2Domain(wallet);
    }
    if (action === 'atticc') {
      await atticc(wallet);
    }
    if (action === 'vitidiary') {
      await vitidiary(wallet);
    }
    if (action === 'zkholdem') {
      await zkholdem(wallet);
    }
    if (action === 'moonlight') {
      await moonlight(wallet);
    }
    if (action === 'metamerge') {
      await metaMerge(wallet);
    }
    if (action === 'readon') {
      await readon(wallet);
    }
    if (action === 'battlemon') {
      await battlemon(wallet);
    }
    if (action === 'tatarot') {
      await tatarot(wallet);
    }
    if (action === 'stationx') {
      await stationX(wallet);
    }
    if (action === 'meet') {
      await meet(wallet);
    }
    if (action === 'idriss') {
      await idriss(wallet);
    }
    console.log(`[${action}] ${wallet.address} 执行完毕`)
  } catch (error) {
    console.log(error?.reason || error?.message)
  }
});
