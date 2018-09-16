# private-key-recovery-tool
Private key calculation tool for Bitcoin-fork coins.    
It requires 2 or more signatures signed with same `k` value.   
You can find such signature by a simple method;   
**Compare `R` value of signature, if they're equal, they are signed usng same `k`.**    
This repository includes a scanner to find such signature. Have fun.

# Usage in CLI
You need Node.js installed and it should be stable version.    

## Preamble

```bash
git clone https://github.com/nao20010128nao/private-key-recovery-tool
cd private-key-recovery-tool
npm i
```

## Changing coin

```bash
export COIN=(name)
```

`(name)` can be:

|Coin name|Value|
|:-------:|:---:|
|Monacoin |MONA |
|Bitcoin  |BTC  |

## Scan the chain

```bash
node txcrawler
```

## Find private keys

```bash
node private-key-searcher
```

## Generate weak signatures

```bash
node create-bad-signature
```
