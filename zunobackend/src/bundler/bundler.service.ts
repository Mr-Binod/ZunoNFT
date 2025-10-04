import { Injectable, Logger } from '@nestjs/common';
import { CreateBundlerDto } from './dto/create-bundler.dto';
import { UpdateBundlerDto } from './dto/update-bundler.dto';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { IUserOperation } from 'src/account/account.interface';
import entryPointABI from "../abi/EntryPoint.json"
import NftABI from '../abi/BingNFT.json'

@Injectable()
export class BundlerService {

  private readonly logger = new Logger(BundlerService.name);

  private readonly provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/9ec09659de844985bf4990794e85cf98")
  private mempool: CreateBundlerDto[] = [];
  private paymasterWallet: ethers.Wallet;
  private PayMasterEntryPoint: ethers.Contract;
  private privateKey: string;
  constructor(
    private configService: ConfigService
  ) { 
    
   }


  async addMempool(userop: CreateBundlerDto) {

    const privateKey : string = this.configService.get<string>('PRIVATE_KEY') as string ;
    this.paymasterWallet = new ethers.Wallet(privateKey, this.provider)

    const entryPointCA = `${this.configService.get<string>('ENTRY_POINT')}`
    this.PayMasterEntryPoint = new ethers.Contract(entryPointCA, entryPointABI.abi, this.paymasterWallet)

    this.mempool.push(userop)
    this.startProcessingLoop(10000)
    return ({ state: 200, message: 'successfully minted' })
  }

  getMempool() {
    return this.mempool
  }

  private toTuple(userOp: CreateBundlerDto): any[] {
    return [
      userOp.sender,
      BigInt(userOp.nonce),
      userOp.initCode,
      userOp.callData,
      BigInt(userOp.callGasLimit),
      BigInt(userOp.verificationGasLimit),
      BigInt(userOp.preverificationGas),
      BigInt(userOp.maxFeePerGas),
      BigInt(userOp.maxPrioityFeePerGas),
      userOp.paymasterAndData,
      userOp.signature
    ];
  }

  private startProcessingLoop(intervalMs: number) {
    const loop = async () => {
      const now = Date.now();
      const delay = intervalMs - (now % intervalMs);
      console.log('GG2', delay)
      setTimeout(async () => {
        await this.processMempool();
        loop();
      }, delay);
    };
    loop();
  }

  private async processMempool() {
    if (this.mempool.length === 0) {
      return;
    }
    const ops = this.mempool.splice(0); // clear mempool copy
    try {
      const tx = await this.PayMasterEntryPoint.handleOps(ops.map((op) => this.toTuple(op)));
      this.logger.log(`Processed transactions, tx hash: ${tx.hash}`);
    } catch (error) {
      this.logger.error('Error processing transactions:', error);
    }
  }

}
