const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe
          let signer
          const sendValue = ethers.parseEther("0.1")

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              signer = accounts[0]

              const FundMeDeployment = await deployments.get("FundMe")
              fundMe = await ethers.getContractAt(
                  FundMeDeployment.abi,
                  FundMeDeployment.address,
                  signer,
              )
          })

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingFundMeBalance = await ethers.provider.getBalance(
                  fundMe.target,
              )
              assert.equal(endingFundMeBalance, 0)
          })
      })
