const Web3 = require("web3");
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
const { expect } = require("chai");
const BigNumber = require("bignumber.js");
const { constants } = require("@openzeppelin/test-helpers");
const timeMachine = require("ganache-time-traveler");
const truffleAssert = require("truffle-assertions");

const MyToken = artifacts.require("MyToken");
const VestingContract = artifacts.require("VestingContract");

BigNumber.config({ EXPONENTIAL_AT: 1e9 });

const DAY_IN_SECONDS = 24 * 3600
const VESTING_PERIOD = 5 * DAY_IN_SECONDS
const NUMBER_OF_TRANSHES = 5
const TOKENS_COUNT = 100

contract("Testset for instanceoftoken properties", () => {
    let deployer;
    let user1, user2, user3;

    let snapshotId;
    let instanceOfContract;
  

    before(async () => {
        [deployer, user1, user2, user3] = await web3.eth.getAccounts();

        instanceOfToken = await MyToken.new({from: deployer});
        instanceOfContract = await VestingContract.new(VESTING_PERIOD, NUMBER_OF_TRANSHES, instanceOfToken.address, { from: deployer } );
        
        console.log('instanceoftoken contract',await instanceOfToken.address);

        console.log('contract adress',instanceOfContract.address);
        
        console.log('balance', BigNumber(await instanceOfToken.balanceOf(instanceOfContract.address)).toFixed());
    });

    describe("Simple test", () => {
        beforeEach(async () => {
            // Create a snapshot
            const snapshot = await timeMachine.takeSnapshot();
            snapshotId = snapshot["result"];
        });

        afterEach(async () => await timeMachine.revertToSnapshot(snapshotId));

        // it("Test supply", async () => {
        //     expect((await instanceOfToken.totalSupply()).toNumber()).to.equal(0);
        // });

        it("Cannot mint zero amount", async () => {
            await truffleAssert.reverts( instanceOfToken.mint(0, { from: deployer }), "Incorrect amount");
        });

        it("cannot share more tokens that it has");

        it("should give tokens after first vesting period pasted", async () => {
            
            await instanceOfToken.mintFor(instanceOfContract.address, 10000);
        
            const oldBalance = await instanceOfToken.balanceOf(user1);
            console.log('oldBalanceOfUser1', oldBalance);

            await instanceOfContract.addRecipient(TOKENS_COUNT, user1);
        
            await timeMachine.advanceTime(VESTING_PERIOD);
            await timeMachine.advanceBlock(1);
        
            await instanceOfContract.claim({from: user1});
        
            const newBalance = await instanceOfToken.balanceOf(user1);
            // console.log('newBalanceOfUser1', newBalance);
            // console.log('difference', newBalance - oldBalance);

            const tokensFromSingleTransh = TOKENS_COUNT / NUMBER_OF_TRANSHES;
            
            // console.log('balance', BigNumber(await instanceOfToken.balanceOf(instanceOfContract.address)).toFixed());
            expect((newBalance - oldBalance)).to.equal(tokensFromSingleTransh);
            
        });

        it("should allow users to claim token period by period", async () => {
            
            await instanceOfToken.mintFor(instanceOfContract.address, 10000);
            await instanceOfContract.addRecipient(TOKENS_COUNT, user1);
            for (let iteration = 1; iteration <= NUMBER_OF_TRANSHES; iteration++) {
              const oldBalance =  await instanceOfToken.balanceOf(user1);
        
            //   await ethers.provider.send("evm_increaseTime", [VESTING_PERIOD])
              await timeMachine.advanceTimeAndBlock(VESTING_PERIOD);
            //   await instanceofcontract.connect(addr1).claim();
              await instanceOfContract.claim({from: user1})
        
              const newBalance =  await instanceOfToken.balanceOf(user1);
            //   console.log(BigNumber(newBalance).toFixed());
              expect((newBalance - oldBalance)).to.equal(TOKENS_COUNT / NUMBER_OF_TRANSHES);
            //   console.log(BigNumber(await instanceOfToken.balanceOf(instanceOfContract.address)).toFixed());

            }
          })

        it("should give all tokens after all periods are passed", async() => {

        });

        it("should give no tokens to not registred address", async() =>{
           
            await truffleAssert.reverts(instanceOfContract.claim({from: user1}), "Tokens not availavle for not registered user");

        });

        it("should allow add new recipients only to owner", async() =>{ 
            
            await truffleAssert.reverts(instanceOfContract.addRecipient(100, user1, {from: user1}), "Only owner can call this function")
        });

        
    });


});
