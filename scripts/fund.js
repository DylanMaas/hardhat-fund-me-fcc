const { deployments, ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const accounts = await ethers.getSigners()
    signer = accounts[0]

    const FundMeDeployment = await deployments.get("FundMe")
    fundMe = await ethers.getContractAt(
        FundMeDeployment.abi,
        FundMeDeployment.address,
        signer,
    )
    console.log("Funding Contract...")
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.1"),
    })
    await transactionResponse.wait(1)
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
