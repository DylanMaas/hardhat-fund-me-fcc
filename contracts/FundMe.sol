// SPDX-License-Identifier: MIT

// 1. Pragma
pragma solidity ^0.8.8;

// 2. Imports

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// 3. Error Codes

error FundMe__NotOwner();

// 4. Interfaces

// 5. Libraries

// 6. Contracts

/**
 * @title Crowdfunding Contract
 * @author Dylan Maas (FreeCodeCamp Course)
 * @notice This contract is to demo a sample funding contract
 */

contract FundMe {
    // A. Type Declarations
    using PriceConverter for uint256;

    // B. State Variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] private funders;
    mapping(address => uint256) private addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface public priceFeed;

    // C. Events

    // D. Modifiers
    modifier onlyOwner() {
        // require(msg.sender == owner, "Sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // E. Functions
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // What happens if someone sends ETH to this contract without calling the fund function

    // receive() external payable {
    //     fund() ;
    // }

    // fallback() external payable {
    //     fund();
    // }

    function fund() public payable {
        // WITHOUT LIBRARY: require (getConversionRate(msg.value) >= MINIMUM_USD, "didn't send enough");
        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "didn't send enough"
        );
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        // looping through array for reset --> starting index, ending index, step amount
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        // resetting the array
        funders = new address[](0);

        // Sending ETH from a contract
        // 1. via Transer --> payable(msg.sender).transfer(address(this).balance);
        // 2. via Send --> bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //                 require (sendSuccess, "Send failed");

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory fundersCheaper = funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < fundersCheaper.length;
            funderIndex++
        ) {
            address funder = fundersCheaper[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return priceFeed;
    }
}
