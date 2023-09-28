const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe
          let signer
          let mockV3Aggregator
          const sendValue = ethers.parseEther("1")

          beforeEach(async () => {
              // don't use (await getNamedAccounts()).deployer, as a parameter to the getContractAt function, it will report an error !!!
              const accounts = await ethers.getSigners()
              signer = accounts[0]
              await deployments.fixture(["all"])

              // there is no getContract function in ethers, so using getContractAt
              const FundMeDeployment = await deployments.get("FundMe")
              fundMe = await ethers.getContractAt(
                  FundMeDeployment.abi,
                  FundMeDeployment.address,
                  signer,
              )

              const MockV3AggregatorDeployment =
                  await deployments.get("MockV3Aggregator")
              mockV3Aggregator = await ethers.getContractAt(
                  MockV3AggregatorDeployment.abi,
                  MockV3AggregatorDeployment.address,
                  signer,
              )
          })

          describe("constructor", async () => {
              it("sets the aggregator address correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target) // get address using target instead of address property
              })
          })

          describe("fund", async () => {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "didn't send enough",
                  )
              })
              it("Update the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(signer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funders", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, signer.address)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingSignerBalance =
                      await ethers.provider.getBalance(signer.address)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingSignerBalance = await ethers.provider.getBalance(
                      signer.address,
                  )
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingSignerBalance,
                      endingSignerBalance + gasCost,
                  )
              })
              it("Allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingSignerBalance =
                      await ethers.provider.getBalance(signer.address)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingSignerBalance = await ethers.provider.getBalance(
                      signer.address,
                  )

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingSignerBalance,
                      endingSignerBalance + gasCost,
                  )

                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })

              it("Only allows the owner to withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract =
                      await fundMe.connect(attacker)
                  await expect(
                      attackerConnectedContract.withdraw(),
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw testing..", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingSignerBalance =
                      await ethers.provider.getBalance(signer.address)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingSignerBalance = await ethers.provider.getBalance(
                      signer.address,
                  )

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingSignerBalance,
                      endingSignerBalance + gasCost,
                  )

                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })
          })
      })
