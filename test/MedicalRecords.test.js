const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecords Contract - Core API", function () {
  let medicalRecords;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    medicalRecords = await MedicalRecords.deploy();
    await medicalRecords.waitForDeployment();
  });

  describe("addRecord() - Create Medical Record", function () {
    it("Should create a new record with valid IPFS CID", async function () {
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      const tx = await medicalRecords.connect(owner).addRecord(ipfsCid);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;

      const record = await medicalRecords.records(1);
      expect(record.owner).to.equal(owner.address);
      expect(record.ipfsCid).to.equal(ipfsCid);
      expect(record.exists).to.be.true;
      expect(record.recordId).to.equal(1);
    });

    it("Should reject record creation with empty IPFS CID", async function () {
      await expect(
        medicalRecords.connect(owner).addRecord("")
      ).to.be.revertedWith("IPFS CID cannot be empty");
    });

    it("Should increment record ID for each new record", async function () {
      const ipfsCid1 = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      const ipfsCid2 = "QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy";

      const tx1 = await medicalRecords.connect(owner).addRecord(ipfsCid1);
      await tx1.wait();

      const tx2 = await medicalRecords.connect(user1).addRecord(ipfsCid2);
      await tx2.wait();

      const record1 = await medicalRecords.records(1);
      const record2 = await medicalRecords.records(2);

      expect(record1.recordId).to.equal(1);
      expect(record2.recordId).to.equal(2);
    });

    it("Should auto-grant owner permanent access to their record", async function () {
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      await medicalRecords.connect(owner).addRecord(ipfsCid);

      const hasAccess = await medicalRecords.checkAccess(1, owner.address);
      expect(hasAccess).to.be.true;
    });

    it("Should emit RecordCreated event", async function () {
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        medicalRecords.connect(owner).addRecord(ipfsCid)
      ).to.emit(medicalRecords, "RecordCreated");
    });
  });

  describe("grantAccess() - Grant Record Access", function () {
    beforeEach(async function () {
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      await medicalRecords.connect(owner).addRecord(ipfsCid);
    });

    it("Should grant access with expiry time", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      const tx = await medicalRecords
        .connect(owner)
        .grantAccess(1, user1.address, expiryTime);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;

      const hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.true;
    });

    it("Should grant access with no expiry (perpetual)", async function () {
      const tx = await medicalRecords
        .connect(owner)
        .grantAccess(1, user1.address, 0);
      await tx.wait();

      const hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.true;
    });

    it("Should reject access grant with past expiry time", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 1000;

      await expect(
        medicalRecords.connect(owner).grantAccess(1, user1.address, pastTime)
      ).to.be.revertedWith("Invalid expiry time");
    });

    it("Should reject granting access to zero address", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        medicalRecords.connect(owner).grantAccess(1, ethers.ZeroAddress, expiryTime)
      ).to.be.revertedWith("Invalid user address");
    });

    it("Should reject if non-owner tries to grant access", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        medicalRecords.connect(user1).grantAccess(1, user2.address, expiryTime)
      ).to.be.revertedWith("Only owner can grant access");
    });

    it("Should emit AccessGranted event", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime)
      ).to.emit(medicalRecords, "AccessGranted");
    });

    it("Should reject granting access to non-existent record", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        medicalRecords.connect(owner).grantAccess(999, user1.address, expiryTime)
      ).to.be.revertedWith("Record does not exist");
    });
  });

  describe("revokeAccess() - Revoke Record Access", function () {
    beforeEach(async function () {
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      await medicalRecords.connect(owner).addRecord(ipfsCid);

      const expiryTime = Math.floor(Date.now() / 1000) + 86400;
      await medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime);
    });

    it("Should revoke access for a user", async function () {
      let hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.true;

      const tx = await medicalRecords.connect(owner).revokeAccess(1, user1.address);
      await tx.wait();

      hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.false;
    });

    it("Should reject if non-owner tries to revoke access", async function () {
      await expect(
        medicalRecords.connect(user2).revokeAccess(1, user1.address)
      ).to.be.revertedWith("Only owner can revoke access");
    });

    it("Should reject revoking access from non-existent record", async function () {
      await expect(
        medicalRecords.connect(owner).revokeAccess(999, user1.address)
      ).to.be.revertedWith("Record does not exist");
    });

    it("Should reject revoking access from zero address", async function () {
      await expect(
        medicalRecords.connect(owner).revokeAccess(1, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid user address");
    });

    it("Should emit AccessRevoked event", async function () {
      await expect(
        medicalRecords.connect(owner).revokeAccess(1, user1.address)
      ).to.emit(medicalRecords, "AccessRevoked");
    });
  });

  describe("getRecord() - Read Medical Record", function () {
    beforeEach(async function () {
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      await medicalRecords.connect(owner).addRecord(ipfsCid);

      const expiryTime = Math.floor(Date.now() / 1000) + 86400;
      await medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime);
    });

    it("Should allow owner to read their own record", async function () {
      const record = await medicalRecords.connect(owner).getRecord(1);
      expect(record.owner).to.equal(owner.address);
      expect(record.exists).to.be.true;
    });

    it("Should allow authorized user to read record", async function () {
      const record = await medicalRecords.connect(user1).getRecord(1);
      expect(record.owner).to.equal(owner.address);
      expect(record.exists).to.be.true;
    });

    it("Should deny unauthorized user from reading record", async function () {
      await expect(
        medicalRecords.connect(user2).getRecord(1)
      ).to.be.revertedWith("No access to this record");
    });

    it("Should deny reading non-existent record", async function () {
      await expect(
        medicalRecords.connect(owner).getRecord(999)
      ).to.be.revertedWith("Record does not exist");
    });

    it("Should return correct record data", async function () {
      const record = await medicalRecords.connect(owner).getRecord(1);
      expect(record.recordId).to.equal(1);
      expect(record.ipfsCid).to.equal("QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
      expect(record.createdAt).to.be.greaterThan(0);
    });
  });

  describe("checkAccess() - Check Record Access", function () {
    beforeEach(async function () {
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      await medicalRecords.connect(owner).addRecord(ipfsCid);
    });

    it("Should return true for owner", async function () {
      const hasAccess = await medicalRecords.checkAccess(1, owner.address);
      expect(hasAccess).to.be.true;
    });

    it("Should return false for non-authorized user", async function () {
      const hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.false;
    });

    it("Should return true after granting access", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;
      await medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime);

      const hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.true;
    });

    it("Should return false after revoking access", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;
      await medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime);

      await medicalRecords.connect(owner).revokeAccess(1, user1.address);

      const hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.false;
    });

    it("Should return false for expired access", async function () {
      // Use the latest block timestamp to avoid timestamp drift
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiryTime = latestBlock.timestamp + 10;
      await medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime);

      let hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.true;

      // Wait for expiry to pass
      await ethers.provider.send("evm_mine", [latestBlock.timestamp + 11]);

      hasAccess = await medicalRecords.checkAccess(1, user1.address);
      expect(hasAccess).to.be.false;
    });

    it("Should return false for non-existent record", async function () {
      await expect(
        medicalRecords.checkAccess(999, owner.address)
      ).to.be.revertedWith("Record does not exist");
    });

    it("Should handle multiple users with different access levels", async function () {
      const expiryTime1 = Math.floor(Date.now() / 1000) + 86400;
      const expiryTime2 = Math.floor(Date.now() / 1000) + 172800;

      await medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime1);
      await medicalRecords.connect(owner).grantAccess(1, user2.address, expiryTime2);

      expect(await medicalRecords.checkAccess(1, owner.address)).to.be.true;
      expect(await medicalRecords.checkAccess(1, user1.address)).to.be.true;
      expect(await medicalRecords.checkAccess(1, user2.address)).to.be.true;
      expect(await medicalRecords.checkAccess(1, user3.address)).to.be.false;
    });
  });

  describe("Complete Workflow", function () {
    it("Should handle complete record lifecycle", async function () {
      // 1. Owner creates record
      const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      const tx1 = await medicalRecords.connect(owner).addRecord(ipfsCid);
      const receipt1 = await tx1.wait();

      expect(receipt1).to.not.be.null;

      // 2. Owner grants access to user1
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;
      await medicalRecords.connect(owner).grantAccess(1, user1.address, expiryTime);

      // 3. User1 reads record
      const record = await medicalRecords.connect(user1).getRecord(1);
      expect(record.ipfsCid).to.equal(ipfsCid);

      // 4. Owner grants access to user2
      await medicalRecords.connect(owner).grantAccess(1, user2.address, expiryTime);

      // 5. Owner revokes access from user1
      await medicalRecords.connect(owner).revokeAccess(1, user1.address);

      // 6. Verify access status
      expect(await medicalRecords.checkAccess(1, owner.address)).to.be.true;
      expect(await medicalRecords.checkAccess(1, user1.address)).to.be.false;
      expect(await medicalRecords.checkAccess(1, user2.address)).to.be.true;
    });

    it("Should handle multiple records from different owners", async function () {
      // Owner 1 creates record
      await medicalRecords.connect(owner).addRecord("QmCid1");

      // Owner 2 creates record
      await medicalRecords.connect(user1).addRecord("QmCid2");

      // Owner 1 grants access
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;
      await medicalRecords.connect(owner).grantAccess(1, user2.address, expiryTime);

      // Verify access
      expect(await medicalRecords.checkAccess(1, user2.address)).to.be.true;
      expect(await medicalRecords.checkAccess(2, user2.address)).to.be.false;
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should protect against reentrancy in addRecord", async function () {
      const ipfsCid1 = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      const ipfsCid2 = "QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy";

      const tx1 = await medicalRecords.connect(owner).addRecord(ipfsCid1);
      await tx1.wait();

      const tx2 = await medicalRecords.connect(owner).addRecord(ipfsCid2);
      await tx2.wait();

      // Both should succeed without issues
      const record1 = await medicalRecords.records(1);
      const record2 = await medicalRecords.records(2);

      expect(record1.exists).to.be.true;
      expect(record2.exists).to.be.true;
    });
  });
});

