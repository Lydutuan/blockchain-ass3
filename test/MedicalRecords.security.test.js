/**
 * Security tests have been consolidated into MedicalRecords.test.js
 * All tests for the 5 core functions are in the main test suite:
 * - addRecord(string cid)
 * - grantAccess(uint recordId, address user, uint expiry)
 * - revokeAccess(uint recordId, address user)
 * - getRecord(uint recordId)
 * - checkAccess(uint recordId, address user)
 *
 * Run: npm test
 */

