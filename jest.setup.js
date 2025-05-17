// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Fix for TextEncoder/TextDecoder not being available in JSDOM
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Add ReadableStream polyfill for LangChain
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = require('stream/web').ReadableStream
}