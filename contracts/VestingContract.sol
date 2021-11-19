// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// interface TokenInterface{
//     function mint(address reciver, uint256 amount) external;
//     function balanceOf(address holder) external returns(uint256 balance);

// }

/// @title PortionalVesting
contract VestingContract {
    IERC20 public tokenContract;
    address public tokenContractAddress;
    address public owner;
    uint256 public vestingPeriod;
    uint256 public numberOfPeriods;

    mapping(address => Recipient) public recipients;

    struct Recipient {
        uint256 vestingStartDate;
        uint256 totalTokensToShare;
        uint256 tokensClaimed;
    }

    constructor(
        uint256 _vestingPeriod,
        uint256 _numberOfPeriods,
        address _tokenAddress
    ) {
        owner = msg.sender;
        vestingPeriod = _vestingPeriod;
        numberOfPeriods = _numberOfPeriods;
        tokenContractAddress = _tokenAddress;
        tokenContract = IERC20(_tokenAddress);
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Only owner can call this function");
        _;
    }

    function getVestingPeriod() public view returns (uint256) {
        return vestingPeriod;
    }

    function setVestingPeriod(uint256 _vestingPeriod) external onlyOwner {
        vestingPeriod = _vestingPeriod;
    }

    // function transferTokens(address reciver, uint256 amount) private{
    //     tokenContractAddress
    // }

    function addRecipient(uint256 _amountToShare, address _recipient) external onlyOwner {
        //require (_amountToShare * 10**uint256(18) <= token.balanceOf(address(this)), 'Not enough tokens to share!');

        recipients[_recipient] = Recipient(block.timestamp, _amountToShare, 0);
    }

    function claim() external {
        Recipient storage r = recipients[msg.sender];
        require(r.totalTokensToShare != 0, "Tokens not availavle for not registered user");

        require(r.tokensClaimed < r.totalTokensToShare, "All payments are paid");

        uint256 _timeDiff = block.timestamp - r.vestingStartDate;
        uint256 transhesToShare = _timeDiff / vestingPeriod;
        if (transhesToShare > numberOfPeriods) {
            transhesToShare = 5;
        }

        uint256 tokensToTransfer = transhesToShare * (r.totalTokensToShare / numberOfPeriods);
        tokensToTransfer = (tokensToTransfer - r.tokensClaimed);

        tokenContract.transfer(msg.sender, tokensToTransfer);
        r.tokensClaimed = r.tokensClaimed + tokensToTransfer;
    }
}
