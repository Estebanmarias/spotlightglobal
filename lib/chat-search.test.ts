import { describe, expect, it } from 'vitest'
import { matchQuestion } from './chat-search'

const label = (q: string) => {
  const m = matchQuestion(q)
  return m.kind === 'topic' ? m.id : m.kind
}

describe('matchQuestion', () => {
  it.each([
    ['what time is service', 'times'],
    ['sundy service', 'times'],
    ['address of the church', 'location'],
    ['how do i give my tithe', 'giving'],
    ['i need a ride', 'transport'],
    ['i need prayer', 'counselor'],
    ['when does the next class start', 'classes'],
    ['who is the pastor', 'pastor'],
    ['hello', 'smalltalk'],
    ['good morning', 'smalltalk'],
    ['thank you', 'smalltalk'],
    ['i want to kill myself', 'crisis'],
    ['I don\'t want to live', 'crisis'],
    ['asdfgh', 'none'],
    ['   ', 'none'],
  ])('%s -> %s', (question, expected) => {
    expect(label(question)).toBe(expected)
  })

  it('marks a clear single-topic question as confident', () => {
    expect(matchQuestion('how do i give my tithe')).toMatchObject({ kind: 'topic', confident: true })
  })

  it('uses the previous topic for a short follow-up', () => {
    expect(matchQuestion('and tomorrow?', 'times')).toMatchObject({ kind: 'topic', id: 'times', confident: true })
  })

  it('understands Nigerian phrasing', () => {
    expect(label('where una dey')).toBe('location')
    expect(label('how i fit join')).toBe('new')
  })

  it('smoke-tests key visitor intents', () => {
    expect(label('what is the latest sermon')).toBe('watch')
    expect(label('where can I register for the upcoming event')).toBe('events')
    expect(label('what account number can I use to give')).toBe('giving')
  })
})
