import { Injectable, Logger } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ethers, keccak256, solidityPacked } from 'ethers';
import { createPvtKey } from './utils/PvtKeyGen';
import FactoryAbi from "../abi/SmartFactory.json";
import PayMaster from "../abi/PayMaster.json"
import { ConfigService } from '@nestjs/config';
import { SmartAccInfoEntity } from './entities/account.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AccountService {

  // private PaymasterPvtkey: string;
  private readonly logger = new Logger('AccountService');
  private readonly provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/e7468d2d517b4aa28ba51a6e589558e2")
  private readonly FactoryAcc = "0x2d1bC1552548e0C236F2c856E02B77d1909AdA3d";
  private readonly PayMasterAcc = "0x7C949B040022F353293308De855bae8719800736";

  constructor(
    private configService: ConfigService,

    @InjectRepository(SmartAccInfoEntity)
    private readonly smartAccInfoEntity: Repository<SmartAccInfoEntity>
  ) {
    // this.PaymasterPvtkey = this.configService.get<string>('PRIVATE_KEY')
  }



  async createAcc(_data: CreateAccountDto) {
    const PaymasterPvtkey = this.configService.get<string>('PRIVATE_KEY');
    console.log(PaymasterPvtkey, 'paymaster')
    if (!PaymasterPvtkey) {
      throw new Error('PRIVATE_KEY is not set in environment variables');
    }
    // const PaymasterPvtkey = `${this.configService.get<string>('PRIVATE_KEY')}`
    const user = _data.id;
    const userpw = _data.userpw;
    const privateKey = createPvtKey(_data)
    const wallet = new ethers.Wallet(privateKey, this.provider)
    const PaymasterWallet = new ethers.Wallet(PaymasterPvtkey, this.provider)
    const FactoryContract = new ethers.Contract(this.FactoryAcc, FactoryAbi.abi, PaymasterWallet)
    const PayMasterContract = new ethers.Contract(this.PayMasterAcc, PayMaster.abi, PaymasterWallet)
    const owner = wallet.address;
    const data = this.smartAccInfoEntity.create({
      user,
      userpw,
      UserAddress: owner,
      smartAcc: '0x',
      privateKey,
      checkWhitelist: false
    })
    await this.smartAccInfoEntity.save(data);
    console.log('GG', data)
    try {
      let checkWhitelist = false;
      const tx = await FactoryContract.createAcc(wallet);
      const result = await tx.wait();
      const smartAcc = await FactoryContract.getAccount(owner)
      if (result) {
        const tx = await PayMasterContract.whiteListAdd(smartAcc)

        console.log('GG1', tx)
        const result = await tx.wait()
        const CheckWhitelist = await PayMasterContract.whiteList(smartAcc)
        if (CheckWhitelist) {
          checkWhitelist = true;
        }
      }
      const updatedata = await this.smartAccInfoEntity.update({user}, {smartAcc, checkWhitelist})
      console.log(updatedata)
      console.log(`Transaction hash : ${result.hash}`)
      // return ({ state: 200, message: 'createAcc successful' })
    } catch (error) {
      return ({ state: 401, message: 'createAcc Failed' + error })
    }
  }

  async getFindAll() {
    try {
      const data = await this.smartAccInfoEntity.find()
      if (data) return data
      return data
    } catch (error) {
      return error
    }
  }

  async getFindOne(user: string) {
    try {
      const data = await this.smartAccInfoEntity.findOne({ where: { user } })
      console.log(data)
      if (data) return ({ state: 201, message: data });
      return ({ state: 402, message: data })
    } catch (error) {
      return ({ state: 402, message: error })
    }
  }
}


// ssss 1bb48ef643ede40a87a2b32be5d9c11a0192490d94105dc6f81c0ae102dda212
// 0xeac16A47406bc33bA449977B7E9F21f433Bbd74E
// Wallet Address: 0xeac16A47406bc33bA449977B7E9F21f433Bbd74E
// Private Key :  0x6f581c41859fe4df0cba4e870ed59b80063be194d479c1a4d065b00390754179
// Smart Account : 0x7143ECbAc5a9d37d8450a6aFA5Cb0d1dd1E17E9A

// DeployAllModule#EntryPoint - 0xf4AeB6f0666B7e5DB603Edd05C0A2D0cE7ce7d09
// DeployAllModule#SmartFactory - 0xcc341eB3613dF646f1bB0a48f8F3134eb8d2b2De

// DeployAllModule#PayMaster - 0xfcdd758Ead52feCADb2FFCD84d36971f194784cA