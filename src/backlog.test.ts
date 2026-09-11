import assert from 'node:assert/strict'
import test from 'node:test'
import { addGame, isEntryList, removeGame, setStatus, type Entry } from './backlog.ts'

const hollow = { id: 1, name: 'Hollow Knight' }
const celeste = { id: 2, name: 'Celeste' }

test('addGame is idempotent per game id', () => {
  const once = addGame([], hollow)
  assert.equal(once.length, 1)
  assert.equal(once[0].status, 'backlog')
  assert.equal(addGame(once, hollow), once)
})

test('setStatus only touches the target entry', () => {
  const list: Entry[] = addGame(addGame([], hollow), celeste)
  const next = setStatus(list, 2, 'beaten')
  assert.equal(next.find((e) => e.id === 2)?.status, 'beaten')
  assert.equal(next.find((e) => e.id === 1)?.status, 'backlog')
})

test('removeGame drops one entry', () => {
  const list = addGame(addGame([], hollow), celeste)
  assert.deepEqual(removeGame(list, 1).map((e) => e.id), [2])
})

test('isEntryList rejects malformed data', () => {
  assert.equal(isEntryList(addGame([], hollow)), true)
  assert.equal(isEntryList([]), true)
  assert.equal(isEntryList('nope'), false)
  assert.equal(isEntryList([{ id: 1, name: 'x', status: 'finished' }]), false)
  assert.equal(isEntryList([{ id: '1', name: 'x', status: 'backlog' }]), false)
})
