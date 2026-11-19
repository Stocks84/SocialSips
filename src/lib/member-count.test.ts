import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SEED_AUTHOR_ID, EXCLUDED_USERNAMES, MEMBER_GOAL,
  isExcludedMember, countTowardGoal,
} from './member-count.ts'

const friend = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'alex' }

describe('isExcludedMember', () => {
  it('excludes the seed/demo author by id, even with another username', () => {
    assert.equal(isExcludedMember({ id: SEED_AUTHOR_ID, username: 'demo' }), true)
  })
  it('excludes Will’s accounts and the test bot by username, case-insensitively', () => {
    for (const username of EXCLUDED_USERNAMES) {
      assert.equal(isExcludedMember({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', username }), true)
      assert.equal(isExcludedMember({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', username: username.toUpperCase() }), true)
    }
  })
  it('does not exclude an ordinary member', () => {
    assert.equal(isExcludedMember(friend), false)
    assert.equal(isExcludedMember({ id: friend.id, username: null }), false)
  })
})

describe('countTowardGoal', () => {
  it('is 50 as the goal, and counts only non-excluded rows', () => {
    assert.equal(MEMBER_GOAL, 50)
    const rows = [
      friend,
      { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', username: 'sam' },
      { id: SEED_AUTHOR_ID, username: 'seed' },
      { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', username: 'neon_host' },
      { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', username: 'Willow' },
      { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', username: 'ss_test_bot' },
    ]
    assert.equal(countTowardGoal(rows), 2)
    assert.equal(countTowardGoal([]), 0)
  })
})
