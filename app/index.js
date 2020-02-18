(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)

},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const poolData = {
  UserPoolId: 'us-east-1_tKSjw3xXu',
  ClientId: '1aosnlgh8roam75comsp77fhd1'
}
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

// The user should have signed in with Cognito.
const hashParams = new URLSearchParams(window.location.hash.substr(1))
const idToken = hashParams.get('id_token')
// console.log('id_token: ' + id_token);

const accessToken = hashParams.get('access_token')
// console.log('access_token: ' + access_token);

const queryParams = new URLSearchParams(window.location.search)
const code = queryParams.get('code')
// console.log('code: ' + code);

// Set up:
const api = 'https://api.imalogit.com/main/dev/'
const origin = 'https://imalogit.com'
const bearerType = 'id_token' // set to either id_token, access_token, or code
let bearerValue
if (bearerType === 'id_token') {
  bearerValue = idToken
} else if (bearerType === 'access_token') {
  bearerValue = accessToken
} else if (bearerType === 'code') {
  bearerValue = code
}
const authorization = 'Bearer ' + bearerValue

async function asyncIt (api, origin, authorization) {
  try {
    const response = await window.fetch(api, {
      headers: {
        Origin: origin,
        Authorization: authorization
      },
      method: 'GET'
    })

    const data = await response.json()
    console.log('data: ', data)
    if (data.session.isValid) {
      document.getElementById('asyncAnswer').innerHTML = '<mark>' + data.session.claims.email + '</mark> has signed in.'
    } else {
      throw JSON.stringify(data)
    }
  } catch (e) {
    console.log('Error: ', e)
    document.getElementById('asyncAnswer').innerHTML = 'Sorry, there was an error.'
  }
};
asyncIt(api, origin, authorization)

},{"amazon-cognito-identity-js":21}],5:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */

/** @class */
var AuthenticationDetails =
/*#__PURE__*/
function () {
  /**
   * Constructs a new AuthenticationDetails object
   * @param {object=} data Creation options.
   * @param {string} data.Username User being authenticated.
   * @param {string} data.Password Plain-text password to authenticate with.
   * @param {(AttributeArg[])?} data.ValidationData Application extra metadata.
   * @param {(AttributeArg[])?} data.AuthParamaters Authentication paramaters for custom auth.
   */
  function AuthenticationDetails(data) {
    var _ref = data || {},
        ValidationData = _ref.ValidationData,
        Username = _ref.Username,
        Password = _ref.Password,
        AuthParameters = _ref.AuthParameters,
        ClientMetadata = _ref.ClientMetadata;

    this.validationData = ValidationData || {};
    this.authParameters = AuthParameters || {};
    this.clientMetadata = ClientMetadata || {};
    this.username = Username;
    this.password = Password;
  }
  /**
   * @returns {string} the record's username
   */


  var _proto = AuthenticationDetails.prototype;

  _proto.getUsername = function getUsername() {
    return this.username;
  }
  /**
   * @returns {string} the record's password
   */
  ;

  _proto.getPassword = function getPassword() {
    return this.password;
  }
  /**
   * @returns {Array} the record's validationData
   */
  ;

  _proto.getValidationData = function getValidationData() {
    return this.validationData;
  }
  /**
   * @returns {Array} the record's authParameters
   */
  ;

  _proto.getAuthParameters = function getAuthParameters() {
    return this.authParameters;
  }
  /**
   * @returns {ClientMetadata} the clientMetadata for a Lambda trigger
   */
  ;

  _proto.getClientMetadata = function getClientMetadata() {
    return this.clientMetadata;
  };

  return AuthenticationDetails;
}();

exports["default"] = AuthenticationDetails;
},{}],6:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _buffer = require("buffer/");

var _core = _interopRequireDefault(require("crypto-js/core"));

require("crypto-js/lib-typedarrays");

var _sha = _interopRequireDefault(require("crypto-js/sha256"));

var _hmacSha = _interopRequireDefault(require("crypto-js/hmac-sha256"));

var _BigInteger = _interopRequireDefault(require("./BigInteger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */
// necessary for crypto js
var randomBytes = function randomBytes(nBytes) {
  return _buffer.Buffer.from(_core["default"].lib.WordArray.random(nBytes).toString(), 'hex');
};

var initN = 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' + '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' + 'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' + 'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' + 'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' + 'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' + '83655D23DCA3AD961C62F356208552BB9ED529077096966D' + '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' + 'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' + 'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' + '15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64' + 'ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7' + 'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B' + 'F12FFA06D98A0864D87602733EC86A64521F2B18177B200C' + 'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31' + '43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF';
var newPasswordRequiredChallengeUserAttributePrefix = 'userAttributes.';
/** @class */

var AuthenticationHelper =
/*#__PURE__*/
function () {
  /**
   * Constructs a new AuthenticationHelper object
   * @param {string} PoolName Cognito user pool name.
   */
  function AuthenticationHelper(PoolName) {
    this.N = new _BigInteger["default"](initN, 16);
    this.g = new _BigInteger["default"]('2', 16);
    this.k = new _BigInteger["default"](this.hexHash("00" + this.N.toString(16) + "0" + this.g.toString(16)), 16);
    this.smallAValue = this.generateRandomSmallA();
    this.getLargeAValue(function () {});
    this.infoBits = _buffer.Buffer.from('Caldera Derived Key', 'utf8');
    this.poolName = PoolName;
  }
  /**
   * @returns {BigInteger} small A, a random number
   */


  var _proto = AuthenticationHelper.prototype;

  _proto.getSmallAValue = function getSmallAValue() {
    return this.smallAValue;
  }
  /**
   * @param {nodeCallback<BigInteger>} callback Called with (err, largeAValue)
   * @returns {void}
   */
  ;

  _proto.getLargeAValue = function getLargeAValue(callback) {
    var _this = this;

    if (this.largeAValue) {
      callback(null, this.largeAValue);
    } else {
      this.calculateA(this.smallAValue, function (err, largeAValue) {
        if (err) {
          callback(err, null);
        }

        _this.largeAValue = largeAValue;
        callback(null, _this.largeAValue);
      });
    }
  }
  /**
   * helper function to generate a random big integer
   * @returns {BigInteger} a random value.
   * @private
   */
  ;

  _proto.generateRandomSmallA = function generateRandomSmallA() {
    var hexRandom = randomBytes(128).toString('hex');
    var randomBigInt = new _BigInteger["default"](hexRandom, 16);
    var smallABigInt = randomBigInt.mod(this.N);
    return smallABigInt;
  }
  /**
   * helper function to generate a random string
   * @returns {string} a random value.
   * @private
   */
  ;

  _proto.generateRandomString = function generateRandomString() {
    return randomBytes(40).toString('base64');
  }
  /**
   * @returns {string} Generated random value included in password hash.
   */
  ;

  _proto.getRandomPassword = function getRandomPassword() {
    return this.randomPassword;
  }
  /**
   * @returns {string} Generated random value included in devices hash.
   */
  ;

  _proto.getSaltDevices = function getSaltDevices() {
    return this.SaltToHashDevices;
  }
  /**
   * @returns {string} Value used to verify devices.
   */
  ;

  _proto.getVerifierDevices = function getVerifierDevices() {
    return this.verifierDevices;
  }
  /**
   * Generate salts and compute verifier.
   * @param {string} deviceGroupKey Devices to generate verifier for.
   * @param {string} username User to generate verifier for.
   * @param {nodeCallback<null>} callback Called with (err, null)
   * @returns {void}
   */
  ;

  _proto.generateHashDevice = function generateHashDevice(deviceGroupKey, username, callback) {
    var _this2 = this;

    this.randomPassword = this.generateRandomString();
    var combinedString = "" + deviceGroupKey + username + ":" + this.randomPassword;
    var hashedString = this.hash(combinedString);
    var hexRandom = randomBytes(16).toString('hex');
    this.SaltToHashDevices = this.padHex(new _BigInteger["default"](hexRandom, 16));
    this.g.modPow(new _BigInteger["default"](this.hexHash(this.SaltToHashDevices + hashedString), 16), this.N, function (err, verifierDevicesNotPadded) {
      if (err) {
        callback(err, null);
      }

      _this2.verifierDevices = _this2.padHex(verifierDevicesNotPadded);
      callback(null, null);
    });
  }
  /**
   * Calculate the client's public value A = g^a%N
   * with the generated random number a
   * @param {BigInteger} a Randomly generated small A.
   * @param {nodeCallback<BigInteger>} callback Called with (err, largeAValue)
   * @returns {void}
   * @private
   */
  ;

  _proto.calculateA = function calculateA(a, callback) {
    var _this3 = this;

    this.g.modPow(a, this.N, function (err, A) {
      if (err) {
        callback(err, null);
      }

      if (A.mod(_this3.N).equals(_BigInteger["default"].ZERO)) {
        callback(new Error('Illegal paramater. A mod N cannot be 0.'), null);
      }

      callback(null, A);
    });
  }
  /**
   * Calculate the client's value U which is the hash of A and B
   * @param {BigInteger} A Large A value.
   * @param {BigInteger} B Server B value.
   * @returns {BigInteger} Computed U value.
   * @private
   */
  ;

  _proto.calculateU = function calculateU(A, B) {
    this.UHexHash = this.hexHash(this.padHex(A) + this.padHex(B));
    var finalU = new _BigInteger["default"](this.UHexHash, 16);
    return finalU;
  }
  /**
   * Calculate a hash from a bitArray
   * @param {Buffer} buf Value to hash.
   * @returns {String} Hex-encoded hash.
   * @private
   */
  ;

  _proto.hash = function hash(buf) {
    var str = buf instanceof _buffer.Buffer ? _core["default"].lib.WordArray.create(buf) : buf;
    var hashHex = (0, _sha["default"])(str).toString();
    return new Array(64 - hashHex.length).join('0') + hashHex;
  }
  /**
   * Calculate a hash from a hex string
   * @param {String} hexStr Value to hash.
   * @returns {String} Hex-encoded hash.
   * @private
   */
  ;

  _proto.hexHash = function hexHash(hexStr) {
    return this.hash(_buffer.Buffer.from(hexStr, 'hex'));
  }
  /**
   * Standard hkdf algorithm
   * @param {Buffer} ikm Input key material.
   * @param {Buffer} salt Salt value.
   * @returns {Buffer} Strong key material.
   * @private
   */
  ;

  _proto.computehkdf = function computehkdf(ikm, salt) {
    var infoBitsWordArray = _core["default"].lib.WordArray.create(_buffer.Buffer.concat([this.infoBits, _buffer.Buffer.from(String.fromCharCode(1), 'utf8')]));

    var ikmWordArray = ikm instanceof _buffer.Buffer ? _core["default"].lib.WordArray.create(ikm) : ikm;
    var saltWordArray = salt instanceof _buffer.Buffer ? _core["default"].lib.WordArray.create(salt) : salt;
    var prk = (0, _hmacSha["default"])(ikmWordArray, saltWordArray);
    var hmac = (0, _hmacSha["default"])(infoBitsWordArray, prk);
    return _buffer.Buffer.from(hmac.toString(), 'hex').slice(0, 16);
  }
  /**
   * Calculates the final hkdf based on computed S value, and computed U value and the key
   * @param {String} username Username.
   * @param {String} password Password.
   * @param {BigInteger} serverBValue Server B value.
   * @param {BigInteger} salt Generated salt.
   * @param {nodeCallback<Buffer>} callback Called with (err, hkdfValue)
   * @returns {void}
   */
  ;

  _proto.getPasswordAuthenticationKey = function getPasswordAuthenticationKey(username, password, serverBValue, salt, callback) {
    var _this4 = this;

    if (serverBValue.mod(this.N).equals(_BigInteger["default"].ZERO)) {
      throw new Error('B cannot be zero.');
    }

    this.UValue = this.calculateU(this.largeAValue, serverBValue);

    if (this.UValue.equals(_BigInteger["default"].ZERO)) {
      throw new Error('U cannot be zero.');
    }

    var usernamePassword = "" + this.poolName + username + ":" + password;
    var usernamePasswordHash = this.hash(usernamePassword);
    var xValue = new _BigInteger["default"](this.hexHash(this.padHex(salt) + usernamePasswordHash), 16);
    this.calculateS(xValue, serverBValue, function (err, sValue) {
      if (err) {
        callback(err, null);
      }

      var hkdf = _this4.computehkdf(_buffer.Buffer.from(_this4.padHex(sValue), 'hex'), _buffer.Buffer.from(_this4.padHex(_this4.UValue.toString(16)), 'hex'));

      callback(null, hkdf);
    });
  }
  /**
   * Calculates the S value used in getPasswordAuthenticationKey
   * @param {BigInteger} xValue Salted password hash value.
   * @param {BigInteger} serverBValue Server B value.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.calculateS = function calculateS(xValue, serverBValue, callback) {
    var _this5 = this;

    this.g.modPow(xValue, this.N, function (err, gModPowXN) {
      if (err) {
        callback(err, null);
      }

      var intValue2 = serverBValue.subtract(_this5.k.multiply(gModPowXN));
      intValue2.modPow(_this5.smallAValue.add(_this5.UValue.multiply(xValue)), _this5.N, function (err2, result) {
        if (err2) {
          callback(err2, null);
        }

        callback(null, result.mod(_this5.N));
      });
    });
  }
  /**
   * Return constant newPasswordRequiredChallengeUserAttributePrefix
   * @return {newPasswordRequiredChallengeUserAttributePrefix} constant prefix value
   */
  ;

  _proto.getNewPasswordRequiredChallengeUserAttributePrefix = function getNewPasswordRequiredChallengeUserAttributePrefix() {
    return newPasswordRequiredChallengeUserAttributePrefix;
  }
  /**
   * Converts a BigInteger (or hex string) to hex format padded with zeroes for hashing
   * @param {BigInteger|String} bigInt Number or string to pad.
   * @returns {String} Padded hex string.
   */
  ;

  _proto.padHex = function padHex(bigInt) {
    var hashStr = bigInt.toString(16);

    if (hashStr.length % 2 === 1) {
      hashStr = "0" + hashStr;
    } else if ('89ABCDEFabcdef'.indexOf(hashStr[0]) !== -1) {
      hashStr = "00" + hashStr;
    }

    return hashStr;
  };

  return AuthenticationHelper;
}();

exports["default"] = AuthenticationHelper;
},{"./BigInteger":7,"buffer/":23,"crypto-js/core":24,"crypto-js/hmac-sha256":26,"crypto-js/lib-typedarrays":28,"crypto-js/sha256":29}],7:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;
// A small implementation of BigInteger based on http://www-cs-students.stanford.edu/~tjw/jsbn/
//
// All public methods have been removed except the following:
//   new BigInteger(a, b) (only radix 2, 4, 8, 16 and 32 supported)
//   toString (only radix 2, 4, 8, 16 and 32 supported)
//   negate
//   abs
//   compareTo
//   bitLength
//   mod
//   equals
//   add
//   subtract
//   multiply
//   divide
//   modPow
var _default = BigInteger;
/*
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */
// (public) Constructor

exports["default"] = _default;

function BigInteger(a, b) {
  if (a != null) this.fromString(a, b);
} // return new, unset BigInteger


function nbi() {
  return new BigInteger(null);
} // Bits per digit


var dbits; // JavaScript engine analysis

var canary = 0xdeadbeefcafe;
var j_lm = (canary & 0xffffff) == 0xefcafe; // am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.
// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)

function am1(i, x, w, j, c, n) {
  while (--n >= 0) {
    var v = x * this[i++] + w[j] + c;
    c = Math.floor(v / 0x4000000);
    w[j++] = v & 0x3ffffff;
  }

  return c;
} // am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)


function am2(i, x, w, j, c, n) {
  var xl = x & 0x7fff,
      xh = x >> 15;

  while (--n >= 0) {
    var l = this[i] & 0x7fff;
    var h = this[i++] >> 15;
    var m = xh * l + h * xl;
    l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
    c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
    w[j++] = l & 0x3fffffff;
  }

  return c;
} // Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.


function am3(i, x, w, j, c, n) {
  var xl = x & 0x3fff,
      xh = x >> 14;

  while (--n >= 0) {
    var l = this[i] & 0x3fff;
    var h = this[i++] >> 14;
    var m = xh * l + h * xl;
    l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
    c = (l >> 28) + (m >> 14) + xh * h;
    w[j++] = l & 0xfffffff;
  }

  return c;
}

var inBrowser = typeof navigator !== 'undefined';

if (inBrowser && j_lm && navigator.appName == 'Microsoft Internet Explorer') {
  BigInteger.prototype.am = am2;
  dbits = 30;
} else if (inBrowser && j_lm && navigator.appName != 'Netscape') {
  BigInteger.prototype.am = am1;
  dbits = 26;
} else {
  // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = (1 << dbits) - 1;
BigInteger.prototype.DV = 1 << dbits;
var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2, BI_FP);
BigInteger.prototype.F1 = BI_FP - dbits;
BigInteger.prototype.F2 = 2 * dbits - BI_FP; // Digit conversions

var BI_RM = '0123456789abcdefghijklmnopqrstuvwxyz';
var BI_RC = new Array();
var rr, vv;
rr = '0'.charCodeAt(0);

for (vv = 0; vv <= 9; ++vv) {
  BI_RC[rr++] = vv;
}

rr = 'a'.charCodeAt(0);

for (vv = 10; vv < 36; ++vv) {
  BI_RC[rr++] = vv;
}

rr = 'A'.charCodeAt(0);

for (vv = 10; vv < 36; ++vv) {
  BI_RC[rr++] = vv;
}

function int2char(n) {
  return BI_RM.charAt(n);
}

function intAt(s, i) {
  var c = BI_RC[s.charCodeAt(i)];
  return c == null ? -1 : c;
} // (protected) copy this to r


function bnpCopyTo(r) {
  for (var i = this.t - 1; i >= 0; --i) {
    r[i] = this[i];
  }

  r.t = this.t;
  r.s = this.s;
} // (protected) set from integer value x, -DV <= x < DV


function bnpFromInt(x) {
  this.t = 1;
  this.s = x < 0 ? -1 : 0;
  if (x > 0) this[0] = x;else if (x < -1) this[0] = x + this.DV;else this.t = 0;
} // return bigint initialized to value


function nbv(i) {
  var r = nbi();
  r.fromInt(i);
  return r;
} // (protected) set from string and radix


function bnpFromString(s, b) {
  var k;
  if (b == 16) k = 4;else if (b == 8) k = 3;else if (b == 2) k = 1;else if (b == 32) k = 5;else if (b == 4) k = 2;else throw new Error('Only radix 2, 4, 8, 16, 32 are supported');
  this.t = 0;
  this.s = 0;
  var i = s.length,
      mi = false,
      sh = 0;

  while (--i >= 0) {
    var x = intAt(s, i);

    if (x < 0) {
      if (s.charAt(i) == '-') mi = true;
      continue;
    }

    mi = false;
    if (sh == 0) this[this.t++] = x;else if (sh + k > this.DB) {
      this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
      this[this.t++] = x >> this.DB - sh;
    } else this[this.t - 1] |= x << sh;
    sh += k;
    if (sh >= this.DB) sh -= this.DB;
  }

  this.clamp();
  if (mi) BigInteger.ZERO.subTo(this, this);
} // (protected) clamp off excess high words


function bnpClamp() {
  var c = this.s & this.DM;

  while (this.t > 0 && this[this.t - 1] == c) {
    --this.t;
  }
} // (public) return string representation in given radix


function bnToString(b) {
  if (this.s < 0) return '-' + this.negate().toString(b);
  var k;
  if (b == 16) k = 4;else if (b == 8) k = 3;else if (b == 2) k = 1;else if (b == 32) k = 5;else if (b == 4) k = 2;else throw new Error('Only radix 2, 4, 8, 16, 32 are supported');
  var km = (1 << k) - 1,
      d,
      m = false,
      r = '',
      i = this.t;
  var p = this.DB - i * this.DB % k;

  if (i-- > 0) {
    if (p < this.DB && (d = this[i] >> p) > 0) {
      m = true;
      r = int2char(d);
    }

    while (i >= 0) {
      if (p < k) {
        d = (this[i] & (1 << p) - 1) << k - p;
        d |= this[--i] >> (p += this.DB - k);
      } else {
        d = this[i] >> (p -= k) & km;

        if (p <= 0) {
          p += this.DB;
          --i;
        }
      }

      if (d > 0) m = true;
      if (m) r += int2char(d);
    }
  }

  return m ? r : '0';
} // (public) -this


function bnNegate() {
  var r = nbi();
  BigInteger.ZERO.subTo(this, r);
  return r;
} // (public) |this|


function bnAbs() {
  return this.s < 0 ? this.negate() : this;
} // (public) return + if this > a, - if this < a, 0 if equal


function bnCompareTo(a) {
  var r = this.s - a.s;
  if (r != 0) return r;
  var i = this.t;
  r = i - a.t;
  if (r != 0) return this.s < 0 ? -r : r;

  while (--i >= 0) {
    if ((r = this[i] - a[i]) != 0) return r;
  }

  return 0;
} // returns bit length of the integer x


function nbits(x) {
  var r = 1,
      t;

  if ((t = x >>> 16) != 0) {
    x = t;
    r += 16;
  }

  if ((t = x >> 8) != 0) {
    x = t;
    r += 8;
  }

  if ((t = x >> 4) != 0) {
    x = t;
    r += 4;
  }

  if ((t = x >> 2) != 0) {
    x = t;
    r += 2;
  }

  if ((t = x >> 1) != 0) {
    x = t;
    r += 1;
  }

  return r;
} // (public) return the number of bits in "this"


function bnBitLength() {
  if (this.t <= 0) return 0;
  return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
} // (protected) r = this << n*DB


function bnpDLShiftTo(n, r) {
  var i;

  for (i = this.t - 1; i >= 0; --i) {
    r[i + n] = this[i];
  }

  for (i = n - 1; i >= 0; --i) {
    r[i] = 0;
  }

  r.t = this.t + n;
  r.s = this.s;
} // (protected) r = this >> n*DB


function bnpDRShiftTo(n, r) {
  for (var i = n; i < this.t; ++i) {
    r[i - n] = this[i];
  }

  r.t = Math.max(this.t - n, 0);
  r.s = this.s;
} // (protected) r = this << n


function bnpLShiftTo(n, r) {
  var bs = n % this.DB;
  var cbs = this.DB - bs;
  var bm = (1 << cbs) - 1;
  var ds = Math.floor(n / this.DB),
      c = this.s << bs & this.DM,
      i;

  for (i = this.t - 1; i >= 0; --i) {
    r[i + ds + 1] = this[i] >> cbs | c;
    c = (this[i] & bm) << bs;
  }

  for (i = ds - 1; i >= 0; --i) {
    r[i] = 0;
  }

  r[ds] = c;
  r.t = this.t + ds + 1;
  r.s = this.s;
  r.clamp();
} // (protected) r = this >> n


function bnpRShiftTo(n, r) {
  r.s = this.s;
  var ds = Math.floor(n / this.DB);

  if (ds >= this.t) {
    r.t = 0;
    return;
  }

  var bs = n % this.DB;
  var cbs = this.DB - bs;
  var bm = (1 << bs) - 1;
  r[0] = this[ds] >> bs;

  for (var i = ds + 1; i < this.t; ++i) {
    r[i - ds - 1] |= (this[i] & bm) << cbs;
    r[i - ds] = this[i] >> bs;
  }

  if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
  r.t = this.t - ds;
  r.clamp();
} // (protected) r = this - a


function bnpSubTo(a, r) {
  var i = 0,
      c = 0,
      m = Math.min(a.t, this.t);

  while (i < m) {
    c += this[i] - a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
  }

  if (a.t < this.t) {
    c -= a.s;

    while (i < this.t) {
      c += this[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }

    c += this.s;
  } else {
    c += this.s;

    while (i < a.t) {
      c -= a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }

    c -= a.s;
  }

  r.s = c < 0 ? -1 : 0;
  if (c < -1) r[i++] = this.DV + c;else if (c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
} // (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.


function bnpMultiplyTo(a, r) {
  var x = this.abs(),
      y = a.abs();
  var i = x.t;
  r.t = i + y.t;

  while (--i >= 0) {
    r[i] = 0;
  }

  for (i = 0; i < y.t; ++i) {
    r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
  }

  r.s = 0;
  r.clamp();
  if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
} // (protected) r = this^2, r != this (HAC 14.16)


function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2 * x.t;

  while (--i >= 0) {
    r[i] = 0;
  }

  for (i = 0; i < x.t - 1; ++i) {
    var c = x.am(i, x[i], r, 2 * i, 0, 1);

    if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
      r[i + x.t] -= x.DV;
      r[i + x.t + 1] = 1;
    }
  }

  if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
  r.s = 0;
  r.clamp();
} // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.


function bnpDivRemTo(m, q, r) {
  var pm = m.abs();
  if (pm.t <= 0) return;
  var pt = this.abs();

  if (pt.t < pm.t) {
    if (q != null) q.fromInt(0);
    if (r != null) this.copyTo(r);
    return;
  }

  if (r == null) r = nbi();
  var y = nbi(),
      ts = this.s,
      ms = m.s;
  var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus

  if (nsh > 0) {
    pm.lShiftTo(nsh, y);
    pt.lShiftTo(nsh, r);
  } else {
    pm.copyTo(y);
    pt.copyTo(r);
  }

  var ys = y.t;
  var y0 = y[ys - 1];
  if (y0 == 0) return;
  var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
  var d1 = this.FV / yt,
      d2 = (1 << this.F1) / yt,
      e = 1 << this.F2;
  var i = r.t,
      j = i - ys,
      t = q == null ? nbi() : q;
  y.dlShiftTo(j, t);

  if (r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t, r);
  }

  BigInteger.ONE.dlShiftTo(ys, t);
  t.subTo(y, y); // "negative" y so we can replace sub with am later

  while (y.t < ys) {
    y[y.t++] = 0;
  }

  while (--j >= 0) {
    // Estimate quotient digit
    var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);

    if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
      // Try it out
      y.dlShiftTo(j, t);
      r.subTo(t, r);

      while (r[i] < --qd) {
        r.subTo(t, r);
      }
    }
  }

  if (q != null) {
    r.drShiftTo(ys, q);
    if (ts != ms) BigInteger.ZERO.subTo(q, q);
  }

  r.t = ys;
  r.clamp();
  if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder

  if (ts < 0) BigInteger.ZERO.subTo(r, r);
} // (public) this mod a


function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a, null, r);
  if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
  return r;
} // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.


function bnpInvDigit() {
  if (this.t < 1) return 0;
  var x = this[0];
  if ((x & 1) == 0) return 0;
  var y = x & 3; // y == 1/x mod 2^2

  y = y * (2 - (x & 0xf) * y) & 0xf; // y == 1/x mod 2^4

  y = y * (2 - (x & 0xff) * y) & 0xff; // y == 1/x mod 2^8

  y = y * (2 - ((x & 0xffff) * y & 0xffff)) & 0xffff; // y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints

  y = y * (2 - x * y % this.DV) % this.DV; // y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV

  return y > 0 ? this.DV - y : -y;
}

function bnEquals(a) {
  return this.compareTo(a) == 0;
} // (protected) r = this + a


function bnpAddTo(a, r) {
  var i = 0,
      c = 0,
      m = Math.min(a.t, this.t);

  while (i < m) {
    c += this[i] + a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
  }

  if (a.t < this.t) {
    c += a.s;

    while (i < this.t) {
      c += this[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }

    c += this.s;
  } else {
    c += this.s;

    while (i < a.t) {
      c += a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }

    c += a.s;
  }

  r.s = c < 0 ? -1 : 0;
  if (c > 0) r[i++] = c;else if (c < -1) r[i++] = this.DV + c;
  r.t = i;
  r.clamp();
} // (public) this + a


function bnAdd(a) {
  var r = nbi();
  this.addTo(a, r);
  return r;
} // (public) this - a


function bnSubtract(a) {
  var r = nbi();
  this.subTo(a, r);
  return r;
} // (public) this * a


function bnMultiply(a) {
  var r = nbi();
  this.multiplyTo(a, r);
  return r;
} // (public) this / a


function bnDivide(a) {
  var r = nbi();
  this.divRemTo(a, r, null);
  return r;
} // Montgomery reduction


function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp & 0x7fff;
  this.mph = this.mp >> 15;
  this.um = (1 << m.DB - 15) - 1;
  this.mt2 = 2 * m.t;
} // xR mod m


function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t, r);
  r.divRemTo(this.m, null, r);
  if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
  return r;
} // x/R mod m


function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
} // x = x/R mod m (HAC 14.32)


function montReduce(x) {
  while (x.t <= this.mt2) {
    // pad x so am has enough room later
    x[x.t++] = 0;
  }

  for (var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i] & 0x7fff;
    var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM; // use am to combine the multiply-shift-add into one call

    j = i + this.m.t;
    x[j] += this.m.am(0, u0, x, i, 0, this.m.t); // propagate carry

    while (x[j] >= x.DV) {
      x[j] -= x.DV;
      x[++j]++;
    }
  }

  x.clamp();
  x.drShiftTo(this.m.t, x);
  if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
} // r = "x^2/R mod m"; x != r


function montSqrTo(x, r) {
  x.squareTo(r);
  this.reduce(r);
} // r = "xy/R mod m"; x,y != r


function montMulTo(x, y, r) {
  x.multiplyTo(y, r);
  this.reduce(r);
}

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo; // (public) this^e % m (HAC 14.85)

function bnModPow(e, m, callback) {
  var i = e.bitLength(),
      k,
      r = nbv(1),
      z = new Montgomery(m);
  if (i <= 0) return r;else if (i < 18) k = 1;else if (i < 48) k = 3;else if (i < 144) k = 4;else if (i < 768) k = 5;else k = 6; // precomputation

  var g = new Array(),
      n = 3,
      k1 = k - 1,
      km = (1 << k) - 1;
  g[1] = z.convert(this);

  if (k > 1) {
    var g2 = nbi();
    z.sqrTo(g[1], g2);

    while (n <= km) {
      g[n] = nbi();
      z.mulTo(g2, g[n - 2], g[n]);
      n += 2;
    }
  }

  var j = e.t - 1,
      w,
      is1 = true,
      r2 = nbi(),
      t;
  i = nbits(e[j]) - 1;

  while (j >= 0) {
    if (i >= k1) w = e[j] >> i - k1 & km;else {
      w = (e[j] & (1 << i + 1) - 1) << k1 - i;
      if (j > 0) w |= e[j - 1] >> this.DB + i - k1;
    }
    n = k;

    while ((w & 1) == 0) {
      w >>= 1;
      --n;
    }

    if ((i -= n) < 0) {
      i += this.DB;
      --j;
    }

    if (is1) {
      // ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    } else {
      while (n > 1) {
        z.sqrTo(r, r2);
        z.sqrTo(r2, r);
        n -= 2;
      }

      if (n > 0) z.sqrTo(r, r2);else {
        t = r;
        r = r2;
        r2 = t;
      }
      z.mulTo(r2, g[w], r);
    }

    while (j >= 0 && (e[j] & 1 << i) == 0) {
      z.sqrTo(r, r2);
      t = r;
      r = r2;
      r2 = t;

      if (--i < 0) {
        i = this.DB - 1;
        --j;
      }
    }
  }

  var result = z.revert(r);
  callback(null, result);
  return result;
} // protected


BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.addTo = bnpAddTo; // public

BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.modPow = bnModPow; // "constants"

BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
},{}],8:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _UserAgent = _interopRequireDefault(require("./UserAgent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/** @class */
var Client =
/*#__PURE__*/
function () {
  /**
   * Constructs a new AWS Cognito Identity Provider client object
   * @param {string} region AWS region
   * @param {string} endpoint endpoint
   */
  function Client(region, endpoint) {
    this.endpoint = endpoint || "https://cognito-idp." + region + ".amazonaws.com/";
    this.userAgent = _UserAgent["default"].prototype.userAgent || 'aws-amplify/0.1.x js';
  }
  /**
   * Makes an unauthenticated request on AWS Cognito Identity Provider API
   * using fetch
   * @param {string} operation API operation
   * @param {object} params Input parameters
   * @param {function} callback Callback called when a response is returned
   * @returns {void}
   */


  var _proto = Client.prototype;

  _proto.request = function request(operation, params, callback) {
    var headers = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': "AWSCognitoIdentityProviderService." + operation,
      'X-Amz-User-Agent': this.userAgent
    };
    var options = {
      headers: headers,
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(params)
    };
    var response;
    var responseJsonData;
    fetch(this.endpoint, options).then(function (resp) {
      response = resp;
      return resp;
    }, function (err) {
      // If error happens here, the request failed
      // if it is TypeError throw network error
      if (err instanceof TypeError) {
        throw new Error('Network error');
      }

      throw err;
    }).then(function (resp) {
      return resp.json()["catch"](function () {
        return {};
      });
    }).then(function (data) {
      // return parsed body stream
      if (response.ok) return callback(null, data);
      responseJsonData = data; // Taken from aws-sdk-js/lib/protocol/json.js
      // eslint-disable-next-line no-underscore-dangle

      var code = (data.__type || data.code).split('#').pop();
      var error = {
        code: code,
        name: code,
        message: data.message || data.Message || null
      };
      return callback(error);
    })["catch"](function (err) {
      // first check if we have a service error
      if (response && response.headers && response.headers.get('x-amzn-errortype')) {
        try {
          var code = response.headers.get('x-amzn-errortype').split(':')[0];
          var error = {
            code: code,
            name: code,
            statusCode: response.status,
            message: response.status ? response.status.toString() : null
          };
          return callback(error);
        } catch (ex) {
          return callback(err);
        } // otherwise check if error is Network error

      } else if (err instanceof Error && err.message === 'Network error') {
        var _error = {
          code: 'NetworkError',
          name: err.name,
          message: err.message
        };
        return callback(_error);
      } else {
        return callback(err);
      }
    });
  };

  return Client;
}();

exports["default"] = Client;
},{"./UserAgent":20}],9:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _CognitoJwtToken2 = _interopRequireDefault(require("./CognitoJwtToken"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/** @class */
var CognitoAccessToken =
/*#__PURE__*/
function (_CognitoJwtToken) {
  _inheritsLoose(CognitoAccessToken, _CognitoJwtToken);

  /**
   * Constructs a new CognitoAccessToken object
   * @param {string=} AccessToken The JWT access token.
   */
  function CognitoAccessToken(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        AccessToken = _ref.AccessToken;

    return _CognitoJwtToken.call(this, AccessToken || '') || this;
  }

  return CognitoAccessToken;
}(_CognitoJwtToken2["default"]);

exports["default"] = CognitoAccessToken;
},{"./CognitoJwtToken":11}],10:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _CognitoJwtToken2 = _interopRequireDefault(require("./CognitoJwtToken"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/** @class */
var CognitoIdToken =
/*#__PURE__*/
function (_CognitoJwtToken) {
  _inheritsLoose(CognitoIdToken, _CognitoJwtToken);

  /**
   * Constructs a new CognitoIdToken object
   * @param {string=} IdToken The JWT Id token
   */
  function CognitoIdToken(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        IdToken = _ref.IdToken;

    return _CognitoJwtToken.call(this, IdToken || '') || this;
  }

  return CognitoIdToken;
}(_CognitoJwtToken2["default"]);

exports["default"] = CognitoIdToken;
},{"./CognitoJwtToken":11}],11:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _buffer = require("buffer/");

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */

/** @class */
var CognitoJwtToken =
/*#__PURE__*/
function () {
  /**
   * Constructs a new CognitoJwtToken object
   * @param {string=} token The JWT token.
   */
  function CognitoJwtToken(token) {
    // Assign object
    this.jwtToken = token || '';
    this.payload = this.decodePayload();
  }
  /**
   * @returns {string} the record's token.
   */


  var _proto = CognitoJwtToken.prototype;

  _proto.getJwtToken = function getJwtToken() {
    return this.jwtToken;
  }
  /**
   * @returns {int} the token's expiration (exp member).
   */
  ;

  _proto.getExpiration = function getExpiration() {
    return this.payload.exp;
  }
  /**
   * @returns {int} the token's "issued at" (iat member).
   */
  ;

  _proto.getIssuedAt = function getIssuedAt() {
    return this.payload.iat;
  }
  /**
   * @returns {object} the token's payload.
   */
  ;

  _proto.decodePayload = function decodePayload() {
    var payload = this.jwtToken.split('.')[1];

    try {
      return JSON.parse(_buffer.Buffer.from(payload, 'base64').toString('utf8'));
    } catch (err) {
      return {};
    }
  };

  return CognitoJwtToken;
}();

exports["default"] = CognitoJwtToken;
},{"buffer/":23}],12:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */

/** @class */
var CognitoRefreshToken =
/*#__PURE__*/
function () {
  /**
   * Constructs a new CognitoRefreshToken object
   * @param {string=} RefreshToken The JWT refresh token.
   */
  function CognitoRefreshToken(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        RefreshToken = _ref.RefreshToken;

    // Assign object
    this.token = RefreshToken || '';
  }
  /**
   * @returns {string} the record's token.
   */


  var _proto = CognitoRefreshToken.prototype;

  _proto.getToken = function getToken() {
    return this.token;
  };

  return CognitoRefreshToken;
}();

exports["default"] = CognitoRefreshToken;
},{}],13:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _buffer = require("buffer/");

var _core = _interopRequireDefault(require("crypto-js/core"));

var _libTypedarrays = _interopRequireDefault(require("crypto-js/lib-typedarrays"));

var _encBase = _interopRequireDefault(require("crypto-js/enc-base64"));

var _hmacSha = _interopRequireDefault(require("crypto-js/hmac-sha256"));

var _BigInteger = _interopRequireDefault(require("./BigInteger"));

var _AuthenticationHelper = _interopRequireDefault(require("./AuthenticationHelper"));

var _CognitoAccessToken = _interopRequireDefault(require("./CognitoAccessToken"));

var _CognitoIdToken = _interopRequireDefault(require("./CognitoIdToken"));

var _CognitoRefreshToken = _interopRequireDefault(require("./CognitoRefreshToken"));

var _CognitoUserSession = _interopRequireDefault(require("./CognitoUserSession"));

var _DateHelper = _interopRequireDefault(require("./DateHelper"));

var _CognitoUserAttribute = _interopRequireDefault(require("./CognitoUserAttribute"));

var _StorageHelper = _interopRequireDefault(require("./StorageHelper"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */
// necessary for crypto js

/**
 * @callback nodeCallback
 * @template T result
 * @param {*} err The operation failure reason, or null.
 * @param {T} result The operation result.
 */

/**
 * @callback onFailure
 * @param {*} err Failure reason.
 */

/**
 * @callback onSuccess
 * @template T result
 * @param {T} result The operation result.
 */

/**
 * @callback mfaRequired
 * @param {*} details MFA challenge details.
 */

/**
 * @callback customChallenge
 * @param {*} details Custom challenge details.
 */

/**
 * @callback inputVerificationCode
 * @param {*} data Server response.
 */

/**
 * @callback authSuccess
 * @param {CognitoUserSession} session The new session.
 * @param {bool=} userConfirmationNecessary User must be confirmed.
 */
var isBrowser = typeof navigator !== "undefined";
var userAgent = isBrowser ? navigator.userAgent : "nodejs";
/** @class */

var CognitoUser =
/*#__PURE__*/
function () {
  /**
   * Constructs a new CognitoUser object
   * @param {object} data Creation options
   * @param {string} data.Username The user's username.
   * @param {CognitoUserPool} data.Pool Pool containing the user.
   * @param {object} data.Storage Optional storage object.
   */
  function CognitoUser(data) {
    if (data == null || data.Username == null || data.Pool == null) {
      throw new Error('Username and pool information are required.');
    }

    this.username = data.Username || '';
    this.pool = data.Pool;
    this.Session = null;
    this.client = data.Pool.client;
    this.signInUserSession = null;
    this.authenticationFlowType = 'USER_SRP_AUTH';
    this.storage = data.Storage || new _StorageHelper["default"]().getStorage();
    this.keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId();
    this.userDataKey = this.keyPrefix + "." + this.username + ".userData";
  }
  /**
   * Sets the session for this user
   * @param {CognitoUserSession} signInUserSession the session
   * @returns {void}
   */


  var _proto = CognitoUser.prototype;

  _proto.setSignInUserSession = function setSignInUserSession(signInUserSession) {
    this.clearCachedUserData();
    this.signInUserSession = signInUserSession;
    this.cacheTokens();
  }
  /**
   * @returns {CognitoUserSession} the current session for this user
   */
  ;

  _proto.getSignInUserSession = function getSignInUserSession() {
    return this.signInUserSession;
  }
  /**
   * @returns {string} the user's username
   */
  ;

  _proto.getUsername = function getUsername() {
    return this.username;
  }
  /**
   * @returns {String} the authentication flow type
   */
  ;

  _proto.getAuthenticationFlowType = function getAuthenticationFlowType() {
    return this.authenticationFlowType;
  }
  /**
   * sets authentication flow type
   * @param {string} authenticationFlowType New value.
   * @returns {void}
   */
  ;

  _proto.setAuthenticationFlowType = function setAuthenticationFlowType(authenticationFlowType) {
    this.authenticationFlowType = authenticationFlowType;
  }
  /**
   * This is used for authenticating the user through the custom authentication flow.
   * @param {AuthenticationDetails} authDetails Contains the authentication data
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {customChallenge} callback.customChallenge Custom challenge
   *        response required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   */
  ;

  _proto.initiateAuth = function initiateAuth(authDetails, callback) {
    var _this = this;

    var authParameters = authDetails.getAuthParameters();
    authParameters.USERNAME = this.username;
    var clientMetaData = Object.keys(authDetails.getValidationData()).length !== 0 ? authDetails.getValidationData() : authDetails.getClientMetadata();
    var jsonReq = {
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: this.pool.getClientId(),
      AuthParameters: authParameters,
      ClientMetadata: clientMetaData
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('InitiateAuth', jsonReq, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      var challengeName = data.ChallengeName;
      var challengeParameters = data.ChallengeParameters;

      if (challengeName === 'CUSTOM_CHALLENGE') {
        _this.Session = data.Session;
        return callback.customChallenge(challengeParameters);
      }

      _this.signInUserSession = _this.getCognitoUserSession(data.AuthenticationResult);

      _this.cacheTokens();

      return callback.onSuccess(_this.signInUserSession);
    });
  }
  /**
   * This is used for authenticating the user.
   * stuff
   * @param {AuthenticationDetails} authDetails Contains the authentication data
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {newPasswordRequired} callback.newPasswordRequired new
   *        password and any required attributes are required to continue
   * @param {mfaRequired} callback.mfaRequired MFA code
   *        required to continue.
   * @param {customChallenge} callback.customChallenge Custom challenge
   *        response required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   */
  ;

  _proto.authenticateUser = function authenticateUser(authDetails, callback) {
    if (this.authenticationFlowType === 'USER_PASSWORD_AUTH') {
      return this.authenticateUserPlainUsernamePassword(authDetails, callback);
    } else if (this.authenticationFlowType === 'USER_SRP_AUTH' || this.authenticationFlowType === 'CUSTOM_AUTH') {
      return this.authenticateUserDefaultAuth(authDetails, callback);
    }

    return callback.onFailure(new Error('Authentication flow type is invalid.'));
  }
  /**
   * PRIVATE ONLY: This is an internal only method and should not
   * be directly called by the consumers.
   * It calls the AuthenticationHelper for SRP related
   * stuff
   * @param {AuthenticationDetails} authDetails Contains the authentication data
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {newPasswordRequired} callback.newPasswordRequired new
   *        password and any required attributes are required to continue
   * @param {mfaRequired} callback.mfaRequired MFA code
   *        required to continue.
   * @param {customChallenge} callback.customChallenge Custom challenge
   *        response required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   */
  ;

  _proto.authenticateUserDefaultAuth = function authenticateUserDefaultAuth(authDetails, callback) {
    var _this2 = this;

    var authenticationHelper = new _AuthenticationHelper["default"](this.pool.getUserPoolId().split('_')[1]);
    var dateHelper = new _DateHelper["default"]();
    var serverBValue;
    var salt;
    var authParameters = {};

    if (this.deviceKey != null) {
      authParameters.DEVICE_KEY = this.deviceKey;
    }

    authParameters.USERNAME = this.username;
    authenticationHelper.getLargeAValue(function (errOnAValue, aValue) {
      // getLargeAValue callback start
      if (errOnAValue) {
        callback.onFailure(errOnAValue);
      }

      authParameters.SRP_A = aValue.toString(16);

      if (_this2.authenticationFlowType === 'CUSTOM_AUTH') {
        authParameters.CHALLENGE_NAME = 'SRP_A';
      }

      var clientMetaData = Object.keys(authDetails.getValidationData()).length !== 0 ? authDetails.getValidationData() : authDetails.getClientMetadata();
      var jsonReq = {
        AuthFlow: _this2.authenticationFlowType,
        ClientId: _this2.pool.getClientId(),
        AuthParameters: authParameters,
        ClientMetadata: clientMetaData
      };

      if (_this2.getUserContextData(_this2.username)) {
        jsonReq.UserContextData = _this2.getUserContextData(_this2.username);
      }

      _this2.client.request('InitiateAuth', jsonReq, function (err, data) {
        if (err) {
          return callback.onFailure(err);
        }

        var challengeParameters = data.ChallengeParameters;
        _this2.username = challengeParameters.USER_ID_FOR_SRP;
        serverBValue = new _BigInteger["default"](challengeParameters.SRP_B, 16);
        salt = new _BigInteger["default"](challengeParameters.SALT, 16);

        _this2.getCachedDeviceKeyAndPassword();

        authenticationHelper.getPasswordAuthenticationKey(_this2.username, authDetails.getPassword(), serverBValue, salt, function (errOnHkdf, hkdf) {
          // getPasswordAuthenticationKey callback start
          if (errOnHkdf) {
            callback.onFailure(errOnHkdf);
          }

          var dateNow = dateHelper.getNowString();

          var message = _core["default"].lib.WordArray.create(_buffer.Buffer.concat([_buffer.Buffer.from(_this2.pool.getUserPoolId().split('_')[1], 'utf8'), _buffer.Buffer.from(_this2.username, 'utf8'), _buffer.Buffer.from(challengeParameters.SECRET_BLOCK, 'base64'), _buffer.Buffer.from(dateNow, 'utf8')]));

          var key = _core["default"].lib.WordArray.create(hkdf);

          var signatureString = _encBase["default"].stringify((0, _hmacSha["default"])(message, key));

          var challengeResponses = {};
          challengeResponses.USERNAME = _this2.username;
          challengeResponses.PASSWORD_CLAIM_SECRET_BLOCK = challengeParameters.SECRET_BLOCK;
          challengeResponses.TIMESTAMP = dateNow;
          challengeResponses.PASSWORD_CLAIM_SIGNATURE = signatureString;

          if (_this2.deviceKey != null) {
            challengeResponses.DEVICE_KEY = _this2.deviceKey;
          }

          var respondToAuthChallenge = function respondToAuthChallenge(challenge, challengeCallback) {
            return _this2.client.request('RespondToAuthChallenge', challenge, function (errChallenge, dataChallenge) {
              if (errChallenge && errChallenge.code === 'ResourceNotFoundException' && errChallenge.message.toLowerCase().indexOf('device') !== -1) {
                challengeResponses.DEVICE_KEY = null;
                _this2.deviceKey = null;
                _this2.randomPassword = null;
                _this2.deviceGroupKey = null;

                _this2.clearCachedDeviceKeyAndPassword();

                return respondToAuthChallenge(challenge, challengeCallback);
              }

              return challengeCallback(errChallenge, dataChallenge);
            });
          };

          var jsonReqResp = {
            ChallengeName: 'PASSWORD_VERIFIER',
            ClientId: _this2.pool.getClientId(),
            ChallengeResponses: challengeResponses,
            Session: data.Session,
            ClientMetadata: clientMetaData
          };

          if (_this2.getUserContextData()) {
            jsonReqResp.UserContextData = _this2.getUserContextData();
          }

          respondToAuthChallenge(jsonReqResp, function (errAuthenticate, dataAuthenticate) {
            if (errAuthenticate) {
              return callback.onFailure(errAuthenticate);
            }

            return _this2.authenticateUserInternal(dataAuthenticate, authenticationHelper, callback);
          });
          return undefined; // getPasswordAuthenticationKey callback end
        });
        return undefined;
      }); // getLargeAValue callback end

    });
  }
  /**
   * PRIVATE ONLY: This is an internal only method and should not
   * be directly called by the consumers.
   * @param {AuthenticationDetails} authDetails Contains the authentication data.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {mfaRequired} callback.mfaRequired MFA code
   *        required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   */
  ;

  _proto.authenticateUserPlainUsernamePassword = function authenticateUserPlainUsernamePassword(authDetails, callback) {
    var _this3 = this;

    var authParameters = {};
    authParameters.USERNAME = this.username;
    authParameters.PASSWORD = authDetails.getPassword();

    if (!authParameters.PASSWORD) {
      callback.onFailure(new Error('PASSWORD parameter is required'));
      return;
    }

    var authenticationHelper = new _AuthenticationHelper["default"](this.pool.getUserPoolId().split('_')[1]);
    this.getCachedDeviceKeyAndPassword();

    if (this.deviceKey != null) {
      authParameters.DEVICE_KEY = this.deviceKey;
    }

    var clientMetaData = Object.keys(authDetails.getValidationData()).length !== 0 ? authDetails.getValidationData() : authDetails.getClientMetadata();
    var jsonReq = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.pool.getClientId(),
      AuthParameters: authParameters,
      ClientMetadata: clientMetaData
    };

    if (this.getUserContextData(this.username)) {
      jsonReq.UserContextData = this.getUserContextData(this.username);
    } // USER_PASSWORD_AUTH happens in a single round-trip: client sends userName and password,
    // Cognito UserPools verifies password and returns tokens.


    this.client.request('InitiateAuth', jsonReq, function (err, authResult) {
      if (err) {
        return callback.onFailure(err);
      }

      return _this3.authenticateUserInternal(authResult, authenticationHelper, callback);
    });
  }
  /**
   * PRIVATE ONLY: This is an internal only method and should not
   * be directly called by the consumers.
   * @param {object} dataAuthenticate authentication data
   * @param {object} authenticationHelper helper created
   * @param {callback} callback passed on from caller
   * @returns {void}
   */
  ;

  _proto.authenticateUserInternal = function authenticateUserInternal(dataAuthenticate, authenticationHelper, callback) {
    var _this4 = this;

    var challengeName = dataAuthenticate.ChallengeName;
    var challengeParameters = dataAuthenticate.ChallengeParameters;

    if (challengeName === 'SMS_MFA') {
      this.Session = dataAuthenticate.Session;
      return callback.mfaRequired(challengeName, challengeParameters);
    }

    if (challengeName === 'SELECT_MFA_TYPE') {
      this.Session = dataAuthenticate.Session;
      return callback.selectMFAType(challengeName, challengeParameters);
    }

    if (challengeName === 'MFA_SETUP') {
      this.Session = dataAuthenticate.Session;
      return callback.mfaSetup(challengeName, challengeParameters);
    }

    if (challengeName === 'SOFTWARE_TOKEN_MFA') {
      this.Session = dataAuthenticate.Session;
      return callback.totpRequired(challengeName, challengeParameters);
    }

    if (challengeName === 'CUSTOM_CHALLENGE') {
      this.Session = dataAuthenticate.Session;
      return callback.customChallenge(challengeParameters);
    }

    if (challengeName === 'NEW_PASSWORD_REQUIRED') {
      this.Session = dataAuthenticate.Session;
      var userAttributes = null;
      var rawRequiredAttributes = null;
      var requiredAttributes = [];
      var userAttributesPrefix = authenticationHelper.getNewPasswordRequiredChallengeUserAttributePrefix();

      if (challengeParameters) {
        userAttributes = JSON.parse(dataAuthenticate.ChallengeParameters.userAttributes);
        rawRequiredAttributes = JSON.parse(dataAuthenticate.ChallengeParameters.requiredAttributes);
      }

      if (rawRequiredAttributes) {
        for (var i = 0; i < rawRequiredAttributes.length; i++) {
          requiredAttributes[i] = rawRequiredAttributes[i].substr(userAttributesPrefix.length);
        }
      }

      return callback.newPasswordRequired(userAttributes, requiredAttributes);
    }

    if (challengeName === 'DEVICE_SRP_AUTH') {
      this.getDeviceResponse(callback);
      return undefined;
    }

    this.signInUserSession = this.getCognitoUserSession(dataAuthenticate.AuthenticationResult);
    this.challengeName = challengeName;
    this.cacheTokens();
    var newDeviceMetadata = dataAuthenticate.AuthenticationResult.NewDeviceMetadata;

    if (newDeviceMetadata == null) {
      return callback.onSuccess(this.signInUserSession);
    }

    authenticationHelper.generateHashDevice(dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey, dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey, function (errGenHash) {
      if (errGenHash) {
        return callback.onFailure(errGenHash);
      }

      var deviceSecretVerifierConfig = {
        Salt: _buffer.Buffer.from(authenticationHelper.getSaltDevices(), 'hex').toString('base64'),
        PasswordVerifier: _buffer.Buffer.from(authenticationHelper.getVerifierDevices(), 'hex').toString('base64')
      };
      _this4.verifierDevices = deviceSecretVerifierConfig.PasswordVerifier;
      _this4.deviceGroupKey = newDeviceMetadata.DeviceGroupKey;
      _this4.randomPassword = authenticationHelper.getRandomPassword();

      _this4.client.request('ConfirmDevice', {
        DeviceKey: newDeviceMetadata.DeviceKey,
        AccessToken: _this4.signInUserSession.getAccessToken().getJwtToken(),
        DeviceSecretVerifierConfig: deviceSecretVerifierConfig,
        DeviceName: userAgent
      }, function (errConfirm, dataConfirm) {
        if (errConfirm) {
          return callback.onFailure(errConfirm);
        }

        _this4.deviceKey = dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey;

        _this4.cacheDeviceKeyAndPassword();

        if (dataConfirm.UserConfirmationNecessary === true) {
          return callback.onSuccess(_this4.signInUserSession, dataConfirm.UserConfirmationNecessary);
        }

        return callback.onSuccess(_this4.signInUserSession);
      });

      return undefined;
    });
    return undefined;
  }
  /**
   * This method is user to complete the NEW_PASSWORD_REQUIRED challenge.
   * Pass the new password with any new user attributes to be updated.
   * User attribute keys must be of format userAttributes.<attribute_name>.
   * @param {string} newPassword new password for this user
   * @param {object} requiredAttributeData map with values for all required attributes
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {mfaRequired} callback.mfaRequired MFA code required to continue.
   * @param {customChallenge} callback.customChallenge Custom challenge
   *         response required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.completeNewPasswordChallenge = function completeNewPasswordChallenge(newPassword, requiredAttributeData, callback, clientMetadata) {
    var _this5 = this;

    if (!newPassword) {
      return callback.onFailure(new Error('New password is required.'));
    }

    var authenticationHelper = new _AuthenticationHelper["default"](this.pool.getUserPoolId().split('_')[1]);
    var userAttributesPrefix = authenticationHelper.getNewPasswordRequiredChallengeUserAttributePrefix();
    var finalUserAttributes = {};

    if (requiredAttributeData) {
      Object.keys(requiredAttributeData).forEach(function (key) {
        finalUserAttributes[userAttributesPrefix + key] = requiredAttributeData[key];
      });
    }

    finalUserAttributes.NEW_PASSWORD = newPassword;
    finalUserAttributes.USERNAME = this.username;
    var jsonReq = {
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: this.pool.getClientId(),
      ChallengeResponses: finalUserAttributes,
      Session: this.Session,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('RespondToAuthChallenge', jsonReq, function (errAuthenticate, dataAuthenticate) {
      if (errAuthenticate) {
        return callback.onFailure(errAuthenticate);
      }

      return _this5.authenticateUserInternal(dataAuthenticate, authenticationHelper, callback);
    });
    return undefined;
  }
  /**
   * This is used to get a session using device authentication. It is called at the end of user
   * authentication
   *
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   * @private
   */
  ;

  _proto.getDeviceResponse = function getDeviceResponse(callback, clientMetadata) {
    var _this6 = this;

    var authenticationHelper = new _AuthenticationHelper["default"](this.deviceGroupKey);
    var dateHelper = new _DateHelper["default"]();
    var authParameters = {};
    authParameters.USERNAME = this.username;
    authParameters.DEVICE_KEY = this.deviceKey;
    authenticationHelper.getLargeAValue(function (errAValue, aValue) {
      // getLargeAValue callback start
      if (errAValue) {
        callback.onFailure(errAValue);
      }

      authParameters.SRP_A = aValue.toString(16);
      var jsonReq = {
        ChallengeName: 'DEVICE_SRP_AUTH',
        ClientId: _this6.pool.getClientId(),
        ChallengeResponses: authParameters,
        ClientMetadata: clientMetadata
      };

      if (_this6.getUserContextData()) {
        jsonReq.UserContextData = _this6.getUserContextData();
      }

      _this6.client.request('RespondToAuthChallenge', jsonReq, function (err, data) {
        if (err) {
          return callback.onFailure(err);
        }

        var challengeParameters = data.ChallengeParameters;
        var serverBValue = new _BigInteger["default"](challengeParameters.SRP_B, 16);
        var salt = new _BigInteger["default"](challengeParameters.SALT, 16);
        authenticationHelper.getPasswordAuthenticationKey(_this6.deviceKey, _this6.randomPassword, serverBValue, salt, function (errHkdf, hkdf) {
          // getPasswordAuthenticationKey callback start
          if (errHkdf) {
            return callback.onFailure(errHkdf);
          }

          var dateNow = dateHelper.getNowString();

          var message = _core["default"].lib.WordArray.create(_buffer.Buffer.concat([_buffer.Buffer.from(_this6.deviceGroupKey, 'utf8'), _buffer.Buffer.from(_this6.deviceKey, 'utf8'), _buffer.Buffer.from(challengeParameters.SECRET_BLOCK, 'base64'), _buffer.Buffer.from(dateNow, 'utf8')]));

          var key = _core["default"].lib.WordArray.create(hkdf);

          var signatureString = _encBase["default"].stringify((0, _hmacSha["default"])(message, key));

          var challengeResponses = {};
          challengeResponses.USERNAME = _this6.username;
          challengeResponses.PASSWORD_CLAIM_SECRET_BLOCK = challengeParameters.SECRET_BLOCK;
          challengeResponses.TIMESTAMP = dateNow;
          challengeResponses.PASSWORD_CLAIM_SIGNATURE = signatureString;
          challengeResponses.DEVICE_KEY = _this6.deviceKey;
          var jsonReqResp = {
            ChallengeName: 'DEVICE_PASSWORD_VERIFIER',
            ClientId: _this6.pool.getClientId(),
            ChallengeResponses: challengeResponses,
            Session: data.Session
          };

          if (_this6.getUserContextData()) {
            jsonReqResp.UserContextData = _this6.getUserContextData();
          }

          _this6.client.request('RespondToAuthChallenge', jsonReqResp, function (errAuthenticate, dataAuthenticate) {
            if (errAuthenticate) {
              return callback.onFailure(errAuthenticate);
            }

            _this6.signInUserSession = _this6.getCognitoUserSession(dataAuthenticate.AuthenticationResult);

            _this6.cacheTokens();

            return callback.onSuccess(_this6.signInUserSession);
          });

          return undefined; // getPasswordAuthenticationKey callback end
        });
        return undefined;
      }); // getLargeAValue callback end

    });
  }
  /**
   * This is used for a certain user to confirm the registration by using a confirmation code
   * @param {string} confirmationCode Code entered by user.
   * @param {bool} forceAliasCreation Allow migrating from an existing email / phone number.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.confirmRegistration = function confirmRegistration(confirmationCode, forceAliasCreation, callback, clientMetadata) {
    var jsonReq = {
      ClientId: this.pool.getClientId(),
      ConfirmationCode: confirmationCode,
      Username: this.username,
      ForceAliasCreation: forceAliasCreation,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('ConfirmSignUp', jsonReq, function (err) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, 'SUCCESS');
    });
  }
  /**
   * This is used by the user once he has the responses to a custom challenge
   * @param {string} answerChallenge The custom challenge answer.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {customChallenge} callback.customChallenge
   *    Custom challenge response required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.sendCustomChallengeAnswer = function sendCustomChallengeAnswer(answerChallenge, callback, clientMetadata) {
    var _this7 = this;

    var challengeResponses = {};
    challengeResponses.USERNAME = this.username;
    challengeResponses.ANSWER = answerChallenge;
    var authenticationHelper = new _AuthenticationHelper["default"](this.pool.getUserPoolId().split('_')[1]);
    this.getCachedDeviceKeyAndPassword();

    if (this.deviceKey != null) {
      challengeResponses.DEVICE_KEY = this.deviceKey;
    }

    var jsonReq = {
      ChallengeName: 'CUSTOM_CHALLENGE',
      ChallengeResponses: challengeResponses,
      ClientId: this.pool.getClientId(),
      Session: this.Session,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('RespondToAuthChallenge', jsonReq, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      return _this7.authenticateUserInternal(data, authenticationHelper, callback);
    });
  }
  /**
   * This is used by the user once he has an MFA code
   * @param {string} confirmationCode The MFA code entered by the user.
   * @param {object} callback Result callback map.
   * @param {string} mfaType The mfa we are replying to.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.sendMFACode = function sendMFACode(confirmationCode, callback, mfaType, clientMetadata) {
    var _this8 = this;

    var challengeResponses = {};
    challengeResponses.USERNAME = this.username;
    challengeResponses.SMS_MFA_CODE = confirmationCode;
    var mfaTypeSelection = mfaType || 'SMS_MFA';

    if (mfaTypeSelection === 'SOFTWARE_TOKEN_MFA') {
      challengeResponses.SOFTWARE_TOKEN_MFA_CODE = confirmationCode;
    }

    if (this.deviceKey != null) {
      challengeResponses.DEVICE_KEY = this.deviceKey;
    }

    var jsonReq = {
      ChallengeName: mfaTypeSelection,
      ChallengeResponses: challengeResponses,
      ClientId: this.pool.getClientId(),
      Session: this.Session,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('RespondToAuthChallenge', jsonReq, function (err, dataAuthenticate) {
      if (err) {
        return callback.onFailure(err);
      }

      var challengeName = dataAuthenticate.ChallengeName;

      if (challengeName === 'DEVICE_SRP_AUTH') {
        _this8.getDeviceResponse(callback);

        return undefined;
      }

      _this8.signInUserSession = _this8.getCognitoUserSession(dataAuthenticate.AuthenticationResult);

      _this8.cacheTokens();

      if (dataAuthenticate.AuthenticationResult.NewDeviceMetadata == null) {
        return callback.onSuccess(_this8.signInUserSession);
      }

      var authenticationHelper = new _AuthenticationHelper["default"](_this8.pool.getUserPoolId().split('_')[1]);
      authenticationHelper.generateHashDevice(dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey, dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey, function (errGenHash) {
        if (errGenHash) {
          return callback.onFailure(errGenHash);
        }

        var deviceSecretVerifierConfig = {
          Salt: _buffer.Buffer.from(authenticationHelper.getSaltDevices(), 'hex').toString('base64'),
          PasswordVerifier: _buffer.Buffer.from(authenticationHelper.getVerifierDevices(), 'hex').toString('base64')
        };
        _this8.verifierDevices = deviceSecretVerifierConfig.PasswordVerifier;
        _this8.deviceGroupKey = dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey;
        _this8.randomPassword = authenticationHelper.getRandomPassword();

        _this8.client.request('ConfirmDevice', {
          DeviceKey: dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey,
          AccessToken: _this8.signInUserSession.getAccessToken().getJwtToken(),
          DeviceSecretVerifierConfig: deviceSecretVerifierConfig,
          DeviceName: userAgent
        }, function (errConfirm, dataConfirm) {
          if (errConfirm) {
            return callback.onFailure(errConfirm);
          }

          _this8.deviceKey = dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey;

          _this8.cacheDeviceKeyAndPassword();

          if (dataConfirm.UserConfirmationNecessary === true) {
            return callback.onSuccess(_this8.signInUserSession, dataConfirm.UserConfirmationNecessary);
          }

          return callback.onSuccess(_this8.signInUserSession);
        });

        return undefined;
      });
      return undefined;
    });
  }
  /**
   * This is used by an authenticated user to change the current password
   * @param {string} oldUserPassword The current password.
   * @param {string} newUserPassword The requested new password.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.changePassword = function changePassword(oldUserPassword, newUserPassword, callback, clientMetadata) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.request('ChangePassword', {
      PreviousPassword: oldUserPassword,
      ProposedPassword: newUserPassword,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      ClientMetadata: clientMetadata
    }, function (err) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, 'SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used by an authenticated user to enable MFA for itself
   * @deprecated
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.enableMFA = function enableMFA(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    var mfaOptions = [];
    var mfaEnabled = {
      DeliveryMedium: 'SMS',
      AttributeName: 'phone_number'
    };
    mfaOptions.push(mfaEnabled);
    this.client.request('SetUserSettings', {
      MFAOptions: mfaOptions,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, 'SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used by an authenticated user to enable MFA for itself
   * @param {IMfaSettings} smsMfaSettings the sms mfa settings
   * @param {IMFASettings} softwareTokenMfaSettings the software token mfa settings
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.setUserMfaPreference = function setUserMfaPreference(smsMfaSettings, softwareTokenMfaSettings, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.request('SetUserMFAPreference', {
      SMSMfaSettings: smsMfaSettings,
      SoftwareTokenMfaSettings: softwareTokenMfaSettings,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, 'SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used by an authenticated user to disable MFA for itself
   * @deprecated
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.disableMFA = function disableMFA(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    var mfaOptions = [];
    this.client.request('SetUserSettings', {
      MFAOptions: mfaOptions,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, 'SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used by an authenticated user to delete itself
   * @param {nodeCallback<string>} callback Called on success or error.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.deleteUser = function deleteUser(callback, clientMetadata) {
    var _this9 = this;

    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.request('DeleteUser', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      ClientMetadata: clientMetadata
    }, function (err) {
      if (err) {
        return callback(err, null);
      }

      _this9.clearCachedUser();

      return callback(null, 'SUCCESS');
    });
    return undefined;
  }
  /**
   * @typedef {CognitoUserAttribute | { Name:string, Value:string }} AttributeArg
   */

  /**
   * This is used by an authenticated user to change a list of attributes
   * @param {AttributeArg[]} attributes A list of the new user attributes.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.updateAttributes = function updateAttributes(attributes, callback, clientMetadata) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.request('UpdateUserAttributes', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      UserAttributes: attributes,
      ClientMetadata: clientMetadata
    }, function (err) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, 'SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used by an authenticated user to get a list of attributes
   * @param {nodeCallback<CognitoUserAttribute[]>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.getUserAttributes = function getUserAttributes(callback) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.request('GetUser', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err, userData) {
      if (err) {
        return callback(err, null);
      }

      var attributeList = [];

      for (var i = 0; i < userData.UserAttributes.length; i++) {
        var attribute = {
          Name: userData.UserAttributes[i].Name,
          Value: userData.UserAttributes[i].Value
        };
        var userAttribute = new _CognitoUserAttribute["default"](attribute);
        attributeList.push(userAttribute);
      }

      return callback(null, attributeList);
    });
    return undefined;
  }
  /**
   * This is used by an authenticated user to get the MFAOptions
   * @param {nodeCallback<MFAOptions>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.getMFAOptions = function getMFAOptions(callback) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.request('GetUser', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err, userData) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, userData.MFAOptions);
    });
    return undefined;
  }
  /**
   * This is used by an authenticated users to get the userData
   * @param {nodeCallback<UserData>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.getUserData = function getUserData(callback, params) {
    var _this10 = this;

    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      this.clearCachedUserData();
      return callback(new Error('User is not authenticated'), null);
    }

    var bypassCache = params ? params.bypassCache : false;
    var userData = this.storage.getItem(this.userDataKey); // get the cached user data

    if (!userData || bypassCache) {
      this.client.request('GetUser', {
        AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
      }, function (err, latestUserData) {
        if (err) {
          return callback(err, null);
        }

        _this10.cacheUserData(latestUserData);

        var refresh = _this10.signInUserSession.getRefreshToken();

        if (refresh && refresh.getToken()) {
          _this10.refreshSession(refresh, function (refreshError, data) {
            if (refreshError) {
              return callback(refreshError, null);
            }

            return callback(null, latestUserData);
          });
        } else {
          return callback(null, latestUserData);
        }
      });
    } else {
      try {
        return callback(null, JSON.parse(userData));
      } catch (err) {
        this.clearCachedUserData();
        return callback(err, null);
      }
    }

    return undefined;
  }
  /**
   * This is used by an authenticated user to delete a list of attributes
   * @param {string[]} attributeList Names of the attributes to delete.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.deleteAttributes = function deleteAttributes(attributeList, callback) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.request('DeleteUserAttributes', {
      UserAttributeNames: attributeList,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, 'SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used by a user to resend a confirmation code
   * @param {nodeCallback<string>} callback Called on success or error.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.resendConfirmationCode = function resendConfirmationCode(callback, clientMetadata) {
    var jsonReq = {
      ClientId: this.pool.getClientId(),
      Username: this.username,
      ClientMetadata: clientMetadata
    };
    this.client.request('ResendConfirmationCode', jsonReq, function (err, result) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, result);
    });
  }
  /**
   * This is used to get a session, either from the session object
   * or from  the local storage, or by using a refresh token
   *
   * @param {nodeCallback<CognitoUserSession>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.getSession = function getSession(callback) {
    if (this.username == null) {
      return callback(new Error('Username is null. Cannot retrieve a new session'), null);
    }

    if (this.signInUserSession != null && this.signInUserSession.isValid()) {
      return callback(null, this.signInUserSession);
    }

    var keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId() + "." + this.username;
    var idTokenKey = keyPrefix + ".idToken";
    var accessTokenKey = keyPrefix + ".accessToken";
    var refreshTokenKey = keyPrefix + ".refreshToken";
    var clockDriftKey = keyPrefix + ".clockDrift";

    if (this.storage.getItem(idTokenKey)) {
      var idToken = new _CognitoIdToken["default"]({
        IdToken: this.storage.getItem(idTokenKey)
      });
      var accessToken = new _CognitoAccessToken["default"]({
        AccessToken: this.storage.getItem(accessTokenKey)
      });
      var refreshToken = new _CognitoRefreshToken["default"]({
        RefreshToken: this.storage.getItem(refreshTokenKey)
      });
      var clockDrift = parseInt(this.storage.getItem(clockDriftKey), 0) || 0;
      var sessionData = {
        IdToken: idToken,
        AccessToken: accessToken,
        RefreshToken: refreshToken,
        ClockDrift: clockDrift
      };
      var cachedSession = new _CognitoUserSession["default"](sessionData);

      if (cachedSession.isValid()) {
        this.signInUserSession = cachedSession;
        return callback(null, this.signInUserSession);
      }

      if (!refreshToken.getToken()) {
        return callback(new Error('Cannot retrieve a new session. Please authenticate.'), null);
      }

      this.refreshSession(refreshToken, callback);
    } else {
      callback(new Error('Local storage is missing an ID Token, Please authenticate'), null);
    }

    return undefined;
  }
  /**
   * This uses the refreshToken to retrieve a new session
   * @param {CognitoRefreshToken} refreshToken A previous session's refresh token.
   * @param {nodeCallback<CognitoUserSession>} callback Called on success or error.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.refreshSession = function refreshSession(refreshToken, callback, clientMetadata) {
    var _this11 = this;

    var authParameters = {};
    authParameters.REFRESH_TOKEN = refreshToken.getToken();
    var keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId();
    var lastUserKey = keyPrefix + ".LastAuthUser";

    if (this.storage.getItem(lastUserKey)) {
      this.username = this.storage.getItem(lastUserKey);
      var deviceKeyKey = keyPrefix + "." + this.username + ".deviceKey";
      this.deviceKey = this.storage.getItem(deviceKeyKey);
      authParameters.DEVICE_KEY = this.deviceKey;
    }

    var jsonReq = {
      ClientId: this.pool.getClientId(),
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: authParameters,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('InitiateAuth', jsonReq, function (err, authResult) {
      if (err) {
        if (err.code === 'NotAuthorizedException') {
          _this11.clearCachedUser();
        }

        return callback(err, null);
      }

      if (authResult) {
        var authenticationResult = authResult.AuthenticationResult;

        if (!Object.prototype.hasOwnProperty.call(authenticationResult, 'RefreshToken')) {
          authenticationResult.RefreshToken = refreshToken.getToken();
        }

        _this11.signInUserSession = _this11.getCognitoUserSession(authenticationResult);

        _this11.cacheTokens();

        return callback(null, _this11.signInUserSession);
      }

      return undefined;
    });
  }
  /**
   * This is used to save the session tokens to local storage
   * @returns {void}
   */
  ;

  _proto.cacheTokens = function cacheTokens() {
    var keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId();
    var idTokenKey = keyPrefix + "." + this.username + ".idToken";
    var accessTokenKey = keyPrefix + "." + this.username + ".accessToken";
    var refreshTokenKey = keyPrefix + "." + this.username + ".refreshToken";
    var clockDriftKey = keyPrefix + "." + this.username + ".clockDrift";
    var lastUserKey = keyPrefix + ".LastAuthUser";
    this.storage.setItem(idTokenKey, this.signInUserSession.getIdToken().getJwtToken());
    this.storage.setItem(accessTokenKey, this.signInUserSession.getAccessToken().getJwtToken());
    this.storage.setItem(refreshTokenKey, this.signInUserSession.getRefreshToken().getToken());
    this.storage.setItem(clockDriftKey, "" + this.signInUserSession.getClockDrift());
    this.storage.setItem(lastUserKey, this.username);
  }
  /**
   * This is to cache user data
   */
  ;

  _proto.cacheUserData = function cacheUserData(userData) {
    this.storage.setItem(this.userDataKey, JSON.stringify(userData));
  }
  /**
   * This is to remove cached user data
   */
  ;

  _proto.clearCachedUserData = function clearCachedUserData() {
    this.storage.removeItem(this.userDataKey);
  };

  _proto.clearCachedUser = function clearCachedUser() {
    this.clearCachedTokens();
    this.clearCachedUserData();
  }
  /**
   * This is used to cache the device key and device group and device password
   * @returns {void}
   */
  ;

  _proto.cacheDeviceKeyAndPassword = function cacheDeviceKeyAndPassword() {
    var keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId() + "." + this.username;
    var deviceKeyKey = keyPrefix + ".deviceKey";
    var randomPasswordKey = keyPrefix + ".randomPasswordKey";
    var deviceGroupKeyKey = keyPrefix + ".deviceGroupKey";
    this.storage.setItem(deviceKeyKey, this.deviceKey);
    this.storage.setItem(randomPasswordKey, this.randomPassword);
    this.storage.setItem(deviceGroupKeyKey, this.deviceGroupKey);
  }
  /**
   * This is used to get current device key and device group and device password
   * @returns {void}
   */
  ;

  _proto.getCachedDeviceKeyAndPassword = function getCachedDeviceKeyAndPassword() {
    var keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId() + "." + this.username;
    var deviceKeyKey = keyPrefix + ".deviceKey";
    var randomPasswordKey = keyPrefix + ".randomPasswordKey";
    var deviceGroupKeyKey = keyPrefix + ".deviceGroupKey";

    if (this.storage.getItem(deviceKeyKey)) {
      this.deviceKey = this.storage.getItem(deviceKeyKey);
      this.randomPassword = this.storage.getItem(randomPasswordKey);
      this.deviceGroupKey = this.storage.getItem(deviceGroupKeyKey);
    }
  }
  /**
   * This is used to clear the device key info from local storage
   * @returns {void}
   */
  ;

  _proto.clearCachedDeviceKeyAndPassword = function clearCachedDeviceKeyAndPassword() {
    var keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId() + "." + this.username;
    var deviceKeyKey = keyPrefix + ".deviceKey";
    var randomPasswordKey = keyPrefix + ".randomPasswordKey";
    var deviceGroupKeyKey = keyPrefix + ".deviceGroupKey";
    this.storage.removeItem(deviceKeyKey);
    this.storage.removeItem(randomPasswordKey);
    this.storage.removeItem(deviceGroupKeyKey);
  }
  /**
   * This is used to clear the session tokens from local storage
   * @returns {void}
   */
  ;

  _proto.clearCachedTokens = function clearCachedTokens() {
    var keyPrefix = "CognitoIdentityServiceProvider." + this.pool.getClientId();
    var idTokenKey = keyPrefix + "." + this.username + ".idToken";
    var accessTokenKey = keyPrefix + "." + this.username + ".accessToken";
    var refreshTokenKey = keyPrefix + "." + this.username + ".refreshToken";
    var lastUserKey = keyPrefix + ".LastAuthUser";
    var clockDriftKey = keyPrefix + "." + this.username + ".clockDrift";
    this.storage.removeItem(idTokenKey);
    this.storage.removeItem(accessTokenKey);
    this.storage.removeItem(refreshTokenKey);
    this.storage.removeItem(lastUserKey);
    this.storage.removeItem(clockDriftKey);
  }
  /**
   * This is used to build a user session from tokens retrieved in the authentication result
   * @param {object} authResult Successful auth response from server.
   * @returns {CognitoUserSession} The new user session.
   * @private
   */
  ;

  _proto.getCognitoUserSession = function getCognitoUserSession(authResult) {
    var idToken = new _CognitoIdToken["default"](authResult);
    var accessToken = new _CognitoAccessToken["default"](authResult);
    var refreshToken = new _CognitoRefreshToken["default"](authResult);
    var sessionData = {
      IdToken: idToken,
      AccessToken: accessToken,
      RefreshToken: refreshToken
    };
    return new _CognitoUserSession["default"](sessionData);
  }
  /**
   * This is used to initiate a forgot password request
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {inputVerificationCode?} callback.inputVerificationCode
   *    Optional callback raised instead of onSuccess with response data.
   * @param {onSuccess} callback.onSuccess Called on success.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.forgotPassword = function forgotPassword(callback, clientMetadata) {
    var jsonReq = {
      ClientId: this.pool.getClientId(),
      Username: this.username,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('ForgotPassword', jsonReq, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      if (typeof callback.inputVerificationCode === 'function') {
        return callback.inputVerificationCode(data);
      }

      return callback.onSuccess(data);
    });
  }
  /**
   * This is used to confirm a new password using a confirmationCode
   * @param {string} confirmationCode Code entered by user.
   * @param {string} newPassword Confirm new password.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<void>} callback.onSuccess Called on success.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.confirmPassword = function confirmPassword(confirmationCode, newPassword, callback, clientMetadata) {
    var jsonReq = {
      ClientId: this.pool.getClientId(),
      Username: this.username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('ConfirmForgotPassword', jsonReq, function (err) {
      if (err) {
        return callback.onFailure(err);
      }

      return callback.onSuccess();
    });
  }
  /**
   * This is used to initiate an attribute confirmation request
   * @param {string} attributeName User attribute that needs confirmation.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {inputVerificationCode} callback.inputVerificationCode Called on success.
   * @param {ClientMetadata} clientMetadata object which is passed from client to Cognito Lambda trigger
   * @returns {void}
   */
  ;

  _proto.getAttributeVerificationCode = function getAttributeVerificationCode(attributeName, callback, clientMetadata) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('GetUserAttributeVerificationCode', {
      AttributeName: attributeName,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      ClientMetadata: clientMetadata
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      if (typeof callback.inputVerificationCode === 'function') {
        return callback.inputVerificationCode(data);
      }

      return callback.onSuccess();
    });
    return undefined;
  }
  /**
   * This is used to confirm an attribute using a confirmation code
   * @param {string} attributeName Attribute being confirmed.
   * @param {string} confirmationCode Code entered by user.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */
  ;

  _proto.verifyAttribute = function verifyAttribute(attributeName, confirmationCode, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('VerifyUserAttribute', {
      AttributeName: attributeName,
      Code: confirmationCode,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }

      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used to get the device information using the current device key
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<*>} callback.onSuccess Called on success with device data.
   * @returns {void}
   */
  ;

  _proto.getDevice = function getDevice(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('GetDevice', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: this.deviceKey
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      return callback.onSuccess(data);
    });
    return undefined;
  }
  /**
   * This is used to forget a specific device
   * @param {string} deviceKey Device key.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */
  ;

  _proto.forgetSpecificDevice = function forgetSpecificDevice(deviceKey, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('ForgetDevice', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: deviceKey
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }

      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used to forget the current device
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */
  ;

  _proto.forgetDevice = function forgetDevice(callback) {
    var _this12 = this;

    this.forgetSpecificDevice(this.deviceKey, {
      onFailure: callback.onFailure,
      onSuccess: function onSuccess(result) {
        _this12.deviceKey = null;
        _this12.deviceGroupKey = null;
        _this12.randomPassword = null;

        _this12.clearCachedDeviceKeyAndPassword();

        return callback.onSuccess(result);
      }
    });
  }
  /**
   * This is used to set the device status as remembered
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */
  ;

  _proto.setDeviceStatusRemembered = function setDeviceStatusRemembered(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('UpdateDeviceStatus', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: this.deviceKey,
      DeviceRememberedStatus: 'remembered'
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }

      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used to set the device status as not remembered
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */
  ;

  _proto.setDeviceStatusNotRemembered = function setDeviceStatusNotRemembered(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('UpdateDeviceStatus', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: this.deviceKey,
      DeviceRememberedStatus: 'not_remembered'
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }

      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used to list all devices for a user
   *
   * @param {int} limit the number of devices returned in a call
   * @param {string} paginationToken the pagination token in case any was returned before
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<*>} callback.onSuccess Called on success with device list.
   * @returns {void}
   */
  ;

  _proto.listDevices = function listDevices(limit, paginationToken, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('ListDevices', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      Limit: limit,
      PaginationToken: paginationToken
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      return callback.onSuccess(data);
    });
    return undefined;
  }
  /**
   * This is used to globally revoke all tokens issued to a user
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */
  ;

  _proto.globalSignOut = function globalSignOut(callback) {
    var _this13 = this;

    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.request('GlobalSignOut', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }

      _this13.clearCachedUser();

      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  }
  /**
   * This is used for the user to signOut of the application and clear the cached tokens.
   * @returns {void}
   */
  ;

  _proto.signOut = function signOut() {
    this.signInUserSession = null;
    this.clearCachedUser();
  }
  /**
   * This is used by a user trying to select a given MFA
   * @param {string} answerChallenge the mfa the user wants
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.sendMFASelectionAnswer = function sendMFASelectionAnswer(answerChallenge, callback) {
    var _this14 = this;

    var challengeResponses = {};
    challengeResponses.USERNAME = this.username;
    challengeResponses.ANSWER = answerChallenge;
    var jsonReq = {
      ChallengeName: 'SELECT_MFA_TYPE',
      ChallengeResponses: challengeResponses,
      ClientId: this.pool.getClientId(),
      Session: this.Session
    };

    if (this.getUserContextData()) {
      jsonReq.UserContextData = this.getUserContextData();
    }

    this.client.request('RespondToAuthChallenge', jsonReq, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      _this14.Session = data.Session;

      if (answerChallenge === 'SMS_MFA') {
        return callback.mfaRequired(data.challengeName, data.challengeParameters);
      }

      if (answerChallenge === 'SOFTWARE_TOKEN_MFA') {
        return callback.totpRequired(data.challengeName, data.challengeParameters);
      }

      return undefined;
    });
  }
  /**
   * This returns the user context data for advanced security feature.
   * @returns {void}
   */
  ;

  _proto.getUserContextData = function getUserContextData() {
    var pool = this.pool;
    return pool.getUserContextData(this.username);
  }
  /**
   * This is used by an authenticated or a user trying to authenticate to associate a TOTP MFA
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.associateSoftwareToken = function associateSoftwareToken(callback) {
    var _this15 = this;

    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      this.client.request('AssociateSoftwareToken', {
        Session: this.Session
      }, function (err, data) {
        if (err) {
          return callback.onFailure(err);
        }

        _this15.Session = data.Session;
        return callback.associateSecretCode(data.SecretCode);
      });
    } else {
      this.client.request('AssociateSoftwareToken', {
        AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
      }, function (err, data) {
        if (err) {
          return callback.onFailure(err);
        }

        return callback.associateSecretCode(data.SecretCode);
      });
    }
  }
  /**
   * This is used by an authenticated or a user trying to authenticate to verify a TOTP MFA
   * @param {string} totpCode The MFA code entered by the user.
   * @param {string} friendlyDeviceName The device name we are assigning to the device.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */
  ;

  _proto.verifySoftwareToken = function verifySoftwareToken(totpCode, friendlyDeviceName, callback) {
    var _this16 = this;

    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      this.client.request('VerifySoftwareToken', {
        Session: this.Session,
        UserCode: totpCode,
        FriendlyDeviceName: friendlyDeviceName
      }, function (err, data) {
        if (err) {
          return callback.onFailure(err);
        }

        _this16.Session = data.Session;
        var challengeResponses = {};
        challengeResponses.USERNAME = _this16.username;
        var jsonReq = {
          ChallengeName: 'MFA_SETUP',
          ClientId: _this16.pool.getClientId(),
          ChallengeResponses: challengeResponses,
          Session: _this16.Session
        };

        if (_this16.getUserContextData()) {
          jsonReq.UserContextData = _this16.getUserContextData();
        }

        _this16.client.request('RespondToAuthChallenge', jsonReq, function (errRespond, dataRespond) {
          if (errRespond) {
            return callback.onFailure(errRespond);
          }

          _this16.signInUserSession = _this16.getCognitoUserSession(dataRespond.AuthenticationResult);

          _this16.cacheTokens();

          return callback.onSuccess(_this16.signInUserSession);
        });

        return undefined;
      });
    } else {
      this.client.request('VerifySoftwareToken', {
        AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
        UserCode: totpCode,
        FriendlyDeviceName: friendlyDeviceName
      }, function (err, data) {
        if (err) {
          return callback.onFailure(err);
        }

        return callback.onSuccess(data);
      });
    }
  };

  return CognitoUser;
}();

exports["default"] = CognitoUser;
},{"./AuthenticationHelper":6,"./BigInteger":7,"./CognitoAccessToken":9,"./CognitoIdToken":10,"./CognitoRefreshToken":12,"./CognitoUserAttribute":14,"./CognitoUserSession":16,"./DateHelper":18,"./StorageHelper":19,"buffer/":23,"crypto-js/core":24,"crypto-js/enc-base64":25,"crypto-js/hmac-sha256":26,"crypto-js/lib-typedarrays":28}],14:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */

/** @class */
var CognitoUserAttribute =
/*#__PURE__*/
function () {
  /**
   * Constructs a new CognitoUserAttribute object
   * @param {string=} Name The record's name
   * @param {string=} Value The record's value
   */
  function CognitoUserAttribute(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        Name = _ref.Name,
        Value = _ref.Value;

    this.Name = Name || '';
    this.Value = Value || '';
  }
  /**
   * @returns {string} the record's value.
   */


  var _proto = CognitoUserAttribute.prototype;

  _proto.getValue = function getValue() {
    return this.Value;
  }
  /**
   * Sets the record's value.
   * @param {string} value The new value.
   * @returns {CognitoUserAttribute} The record for method chaining.
   */
  ;

  _proto.setValue = function setValue(value) {
    this.Value = value;
    return this;
  }
  /**
   * @returns {string} the record's name.
   */
  ;

  _proto.getName = function getName() {
    return this.Name;
  }
  /**
   * Sets the record's name
   * @param {string} name The new name.
   * @returns {CognitoUserAttribute} The record for method chaining.
   */
  ;

  _proto.setName = function setName(name) {
    this.Name = name;
    return this;
  }
  /**
   * @returns {string} a string representation of the record.
   */
  ;

  _proto.toString = function toString() {
    return JSON.stringify(this);
  }
  /**
   * @returns {object} a flat object representing the record.
   */
  ;

  _proto.toJSON = function toJSON() {
    return {
      Name: this.Name,
      Value: this.Value
    };
  };

  return CognitoUserAttribute;
}();

exports["default"] = CognitoUserAttribute;
},{}],15:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _Client = _interopRequireDefault(require("./Client"));

var _CognitoUser = _interopRequireDefault(require("./CognitoUser"));

var _StorageHelper = _interopRequireDefault(require("./StorageHelper"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */

/** @class */
var CognitoUserPool =
/*#__PURE__*/
function () {
  /**
   * Constructs a new CognitoUserPool object
   * @param {object} data Creation options.
   * @param {string} data.UserPoolId Cognito user pool id.
   * @param {string} data.ClientId User pool application client id.
   * @param {object} data.Storage Optional storage object.
   * @param {boolean} data.AdvancedSecurityDataCollectionFlag Optional:
   *        boolean flag indicating if the data collection is enabled
   *        to support cognito advanced security features. By default, this
   *        flag is set to true.
   */
  function CognitoUserPool(data) {
    var _ref = data || {},
        UserPoolId = _ref.UserPoolId,
        ClientId = _ref.ClientId,
        endpoint = _ref.endpoint,
        AdvancedSecurityDataCollectionFlag = _ref.AdvancedSecurityDataCollectionFlag;

    if (!UserPoolId || !ClientId) {
      throw new Error('Both UserPoolId and ClientId are required.');
    }

    if (!/^[\w-]+_.+$/.test(UserPoolId)) {
      throw new Error('Invalid UserPoolId format.');
    }

    var region = UserPoolId.split('_')[0];
    this.userPoolId = UserPoolId;
    this.clientId = ClientId;
    this.client = new _Client["default"](region, endpoint);
    /**
     * By default, AdvancedSecurityDataCollectionFlag is set to true,
     * if no input value is provided.
     */

    this.advancedSecurityDataCollectionFlag = AdvancedSecurityDataCollectionFlag !== false;
    this.storage = data.Storage || new _StorageHelper["default"]().getStorage();
  }
  /**
   * @returns {string} the user pool id
   */


  var _proto = CognitoUserPool.prototype;

  _proto.getUserPoolId = function getUserPoolId() {
    return this.userPoolId;
  }
  /**
   * @returns {string} the client id
   */
  ;

  _proto.getClientId = function getClientId() {
    return this.clientId;
  }
  /**
   * @typedef {object} SignUpResult
   * @property {CognitoUser} user New user.
   * @property {bool} userConfirmed If the user is already confirmed.
   */

  /**
   * method for signing up a user
   * @param {string} username User's username.
   * @param {string} password Plain-text initial password entered by user.
   * @param {(AttributeArg[])=} userAttributes New user attributes.
   * @param {(AttributeArg[])=} validationData Application metadata.
   * @param {(AttributeArg[])=} clientMetadata Client metadata.
   * @param {nodeCallback<SignUpResult>} callback Called on error or with the new user.
   * @returns {void}
   */
  ;

  _proto.signUp = function signUp(username, password, userAttributes, validationData, callback, clientMetadata) {
    var _this = this;

    var jsonReq = {
      ClientId: this.clientId,
      Username: username,
      Password: password,
      UserAttributes: userAttributes,
      ValidationData: validationData,
      ClientMetadata: clientMetadata
    };

    if (this.getUserContextData(username)) {
      jsonReq.UserContextData = this.getUserContextData(username);
    }

    this.client.request('SignUp', jsonReq, function (err, data) {
      if (err) {
        return callback(err, null);
      }

      var cognitoUser = {
        Username: username,
        Pool: _this,
        Storage: _this.storage
      };
      var returnData = {
        user: new _CognitoUser["default"](cognitoUser),
        userConfirmed: data.UserConfirmed,
        userSub: data.UserSub,
        codeDeliveryDetails: data.CodeDeliveryDetails
      };
      return callback(null, returnData);
    });
  }
  /**
   * method for getting the current user of the application from the local storage
   *
   * @returns {CognitoUser} the user retrieved from storage
   */
  ;

  _proto.getCurrentUser = function getCurrentUser() {
    var lastUserKey = "CognitoIdentityServiceProvider." + this.clientId + ".LastAuthUser";
    var lastAuthUser = this.storage.getItem(lastUserKey);

    if (lastAuthUser) {
      var cognitoUser = {
        Username: lastAuthUser,
        Pool: this,
        Storage: this.storage
      };
      return new _CognitoUser["default"](cognitoUser);
    }

    return null;
  }
  /**
   * This method returns the encoded data string used for cognito advanced security feature.
   * This would be generated only when developer has included the JS used for collecting the
   * data on their client. Please refer to documentation to know more about using AdvancedSecurity
   * features
   * @param {string} username the username for the context data
   * @returns {string} the user context data
   **/
  ;

  _proto.getUserContextData = function getUserContextData(username) {
    if (typeof AmazonCognitoAdvancedSecurityData === 'undefined') {
      return undefined;
    }
    /* eslint-disable */


    var amazonCognitoAdvancedSecurityDataConst = AmazonCognitoAdvancedSecurityData;
    /* eslint-enable */

    if (this.advancedSecurityDataCollectionFlag) {
      var advancedSecurityData = amazonCognitoAdvancedSecurityDataConst.getData(username, this.userPoolId, this.clientId);

      if (advancedSecurityData) {
        var userContextData = {
          EncodedData: advancedSecurityData
        };
        return userContextData;
      }
    }

    return {};
  };

  return CognitoUserPool;
}();

exports["default"] = CognitoUserPool;
},{"./Client":8,"./CognitoUser":13,"./StorageHelper":19}],16:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */

/** @class */
var CognitoUserSession =
/*#__PURE__*/
function () {
  /**
   * Constructs a new CognitoUserSession object
   * @param {CognitoIdToken} IdToken The session's Id token.
   * @param {CognitoRefreshToken=} RefreshToken The session's refresh token.
   * @param {CognitoAccessToken} AccessToken The session's access token.
   * @param {int} ClockDrift The saved computer's clock drift or undefined to force calculation.
   */
  function CognitoUserSession(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        IdToken = _ref.IdToken,
        RefreshToken = _ref.RefreshToken,
        AccessToken = _ref.AccessToken,
        ClockDrift = _ref.ClockDrift;

    if (AccessToken == null || IdToken == null) {
      throw new Error('Id token and Access Token must be present.');
    }

    this.idToken = IdToken;
    this.refreshToken = RefreshToken;
    this.accessToken = AccessToken;
    this.clockDrift = ClockDrift === undefined ? this.calculateClockDrift() : ClockDrift;
  }
  /**
   * @returns {CognitoIdToken} the session's Id token
   */


  var _proto = CognitoUserSession.prototype;

  _proto.getIdToken = function getIdToken() {
    return this.idToken;
  }
  /**
   * @returns {CognitoRefreshToken} the session's refresh token
   */
  ;

  _proto.getRefreshToken = function getRefreshToken() {
    return this.refreshToken;
  }
  /**
   * @returns {CognitoAccessToken} the session's access token
   */
  ;

  _proto.getAccessToken = function getAccessToken() {
    return this.accessToken;
  }
  /**
   * @returns {int} the session's clock drift
   */
  ;

  _proto.getClockDrift = function getClockDrift() {
    return this.clockDrift;
  }
  /**
   * @returns {int} the computer's clock drift
   */
  ;

  _proto.calculateClockDrift = function calculateClockDrift() {
    var now = Math.floor(new Date() / 1000);
    var iat = Math.min(this.accessToken.getIssuedAt(), this.idToken.getIssuedAt());
    return now - iat;
  }
  /**
   * Checks to see if the session is still valid based on session expiry information found
   * in tokens and the current time (adjusted with clock drift)
   * @returns {boolean} if the session is still valid
   */
  ;

  _proto.isValid = function isValid() {
    var now = Math.floor(new Date() / 1000);
    var adjusted = now - this.clockDrift;
    return adjusted < this.accessToken.getExpiration() && adjusted < this.idToken.getExpiration();
  };

  return CognitoUserSession;
}();

exports["default"] = CognitoUserSession;
},{}],17:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var Cookies = _interopRequireWildcard(require("js-cookie"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/** @class */
var CookieStorage =
/*#__PURE__*/
function () {
  /**
   * Constructs a new CookieStorage object
   * @param {object} data Creation options.
   * @param {string} data.domain Cookies domain (mandatory).
   * @param {string} data.path Cookies path (default: '/')
   * @param {integer} data.expires Cookie expiration (in days, default: 365)
   * @param {boolean} data.secure Cookie secure flag (default: true)
   */
  function CookieStorage(data) {
    if (data.domain) {
      this.domain = data.domain;
    } else {
      throw new Error('The domain of cookieStorage can not be undefined.');
    }

    if (data.path) {
      this.path = data.path;
    } else {
      this.path = '/';
    }

    if (Object.prototype.hasOwnProperty.call(data, 'expires')) {
      this.expires = data.expires;
    } else {
      this.expires = 365;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'secure')) {
      this.secure = data.secure;
    } else {
      this.secure = true;
    }
  }
  /**
   * This is used to set a specific item in storage
   * @param {string} key - the key for the item
   * @param {object} value - the value
   * @returns {string} value that was set
   */


  var _proto = CookieStorage.prototype;

  _proto.setItem = function setItem(key, value) {
    Cookies.set(key, value, {
      path: this.path,
      expires: this.expires,
      domain: this.domain,
      secure: this.secure
    });
    return Cookies.get(key);
  }
  /**
   * This is used to get a specific key from storage
   * @param {string} key - the key for the item
   * This is used to clear the storage
   * @returns {string} the data item
   */
  ;

  _proto.getItem = function getItem(key) {
    return Cookies.get(key);
  }
  /**
   * This is used to remove an item from storage
   * @param {string} key - the key being set
   * @returns {string} value - value that was deleted
   */
  ;

  _proto.removeItem = function removeItem(key) {
    return Cookies.remove(key, {
      path: this.path,
      domain: this.domain,
      secure: this.secure
    });
  }
  /**
   * This is used to clear the storage
   * @returns {string} nothing
   */
  ;

  _proto.clear = function clear() {
    var cookies = Cookies.get();
    var index;

    for (index = 0; index < cookies.length; ++index) {
      Cookies.remove(cookies[index]);
    }

    return {};
  };

  return CookieStorage;
}();

exports["default"] = CookieStorage;
},{"js-cookie":32}],18:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */
var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** @class */

var DateHelper =
/*#__PURE__*/
function () {
  function DateHelper() {}

  var _proto = DateHelper.prototype;

  /**
   * @returns {string} The current time in "ddd MMM D HH:mm:ss UTC YYYY" format.
   */
  _proto.getNowString = function getNowString() {
    var now = new Date();
    var weekDay = weekNames[now.getUTCDay()];
    var month = monthNames[now.getUTCMonth()];
    var day = now.getUTCDate();
    var hours = now.getUTCHours();

    if (hours < 10) {
      hours = "0" + hours;
    }

    var minutes = now.getUTCMinutes();

    if (minutes < 10) {
      minutes = "0" + minutes;
    }

    var seconds = now.getUTCSeconds();

    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    var year = now.getUTCFullYear(); // ddd MMM D HH:mm:ss UTC YYYY

    var dateNow = weekDay + " " + month + " " + day + " " + hours + ":" + minutes + ":" + seconds + " UTC " + year;
    return dateNow;
  };

  return DateHelper;
}();

exports["default"] = DateHelper;
},{}],19:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */
var dataMemory = {};
/** @class */

var MemoryStorage =
/*#__PURE__*/
function () {
  function MemoryStorage() {}

  /**
   * This is used to set a specific item in storage
   * @param {string} key - the key for the item
   * @param {object} value - the value
   * @returns {string} value that was set
   */
  MemoryStorage.setItem = function setItem(key, value) {
    dataMemory[key] = value;
    return dataMemory[key];
  }
  /**
   * This is used to get a specific key from storage
   * @param {string} key - the key for the item
   * This is used to clear the storage
   * @returns {string} the data item
   */
  ;

  MemoryStorage.getItem = function getItem(key) {
    return Object.prototype.hasOwnProperty.call(dataMemory, key) ? dataMemory[key] : undefined;
  }
  /**
   * This is used to remove an item from storage
   * @param {string} key - the key being set
   * @returns {string} value - value that was deleted
   */
  ;

  MemoryStorage.removeItem = function removeItem(key) {
    return delete dataMemory[key];
  }
  /**
   * This is used to clear the storage
   * @returns {string} nothing
   */
  ;

  MemoryStorage.clear = function clear() {
    dataMemory = {};
    return dataMemory;
  };

  return MemoryStorage;
}();
/** @class */


var StorageHelper =
/*#__PURE__*/
function () {
  /**
   * This is used to get a storage object
   * @returns {object} the storage
   */
  function StorageHelper() {
    try {
      this.storageWindow = window.localStorage;
      this.storageWindow.setItem('aws.cognito.test-ls', 1);
      this.storageWindow.removeItem('aws.cognito.test-ls');
    } catch (exception) {
      this.storageWindow = MemoryStorage;
    }
  }
  /**
   * This is used to return the storage
   * @returns {object} the storage
   */


  var _proto = StorageHelper.prototype;

  _proto.getStorage = function getStorage() {
    return this.storageWindow;
  };

  return StorageHelper;
}();

exports["default"] = StorageHelper;
},{}],20:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = void 0;
// class for defining the amzn user-agent
var _default = UserAgent; // constructor

exports["default"] = _default;

function UserAgent() {} // public


UserAgent.prototype.userAgent = 'aws-amplify/0.1.x js';
},{}],21:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.DateHelper = exports.CookieStorage = exports.CognitoUserSession = exports.CognitoUserPool = exports.CognitoUserAttribute = exports.CognitoUser = exports.CognitoRefreshToken = exports.CognitoIdToken = exports.CognitoAccessToken = exports.AuthenticationHelper = exports.AuthenticationDetails = void 0;

var _AuthenticationDetails = _interopRequireDefault(require("./AuthenticationDetails"));

exports.AuthenticationDetails = _AuthenticationDetails["default"];

var _AuthenticationHelper = _interopRequireDefault(require("./AuthenticationHelper"));

exports.AuthenticationHelper = _AuthenticationHelper["default"];

var _CognitoAccessToken = _interopRequireDefault(require("./CognitoAccessToken"));

exports.CognitoAccessToken = _CognitoAccessToken["default"];

var _CognitoIdToken = _interopRequireDefault(require("./CognitoIdToken"));

exports.CognitoIdToken = _CognitoIdToken["default"];

var _CognitoRefreshToken = _interopRequireDefault(require("./CognitoRefreshToken"));

exports.CognitoRefreshToken = _CognitoRefreshToken["default"];

var _CognitoUser = _interopRequireDefault(require("./CognitoUser"));

exports.CognitoUser = _CognitoUser["default"];

var _CognitoUserAttribute = _interopRequireDefault(require("./CognitoUserAttribute"));

exports.CognitoUserAttribute = _CognitoUserAttribute["default"];

var _CognitoUserPool = _interopRequireDefault(require("./CognitoUserPool"));

exports.CognitoUserPool = _CognitoUserPool["default"];

var _CognitoUserSession = _interopRequireDefault(require("./CognitoUserSession"));

exports.CognitoUserSession = _CognitoUserSession["default"];

var _CookieStorage = _interopRequireDefault(require("./CookieStorage"));

exports.CookieStorage = _CookieStorage["default"];

var _DateHelper = _interopRequireDefault(require("./DateHelper"));

exports.DateHelper = _DateHelper["default"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
},{"./AuthenticationDetails":5,"./AuthenticationHelper":6,"./CognitoAccessToken":9,"./CognitoIdToken":10,"./CognitoRefreshToken":12,"./CognitoUser":13,"./CognitoUserAttribute":14,"./CognitoUserPool":15,"./CognitoUserSession":16,"./CookieStorage":17,"./DateHelper":18}],22:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],23:[function(require,module,exports){
(function (global,Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"base64-js":22,"buffer":2,"ieee754":30,"isarray":31}],24:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory();
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define([], factory);
	}
	else {
		// Global (browser)
		root.CryptoJS = factory();
	}
}(this, function () {

	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = CryptoJS || (function (Math, undefined) {
	    /*
	     * Local polyfil of Object.create
	     */
	    var create = Object.create || (function () {
	        function F() {};

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }())

	    /**
	     * CryptoJS namespace.
	     */
	    var C = {};

	    /**
	     * Library namespace.
	     */
	    var C_lib = C.lib = {};

	    /**
	     * Base object for prototypal inheritance.
	     */
	    var Base = C_lib.Base = (function () {


	        return {
	            /**
	             * Creates a new object that inherits from this object.
	             *
	             * @param {Object} overrides Properties to copy into the new object.
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         field: 'value',
	             *
	             *         method: function () {
	             *         }
	             *     });
	             */
	            extend: function (overrides) {
	                // Spawn
	                var subtype = create(this);

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                // Initializer's prototype is the subtype object
	                subtype.init.prototype = subtype;

	                // Reference supertype
	                subtype.$super = this;

	                return subtype;
	            },

	            /**
	             * Extends this object and runs the init method.
	             * Arguments to create() will be passed to init().
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var instance = MyType.create();
	             */
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            /**
	             * Initializes a newly created object.
	             * Override this method to add some logic when your objects are created.
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         init: function () {
	             *             // ...
	             *         }
	             *     });
	             */
	            init: function () {
	            },

	            /**
	             * Copies properties into this object.
	             *
	             * @param {Object} properties The properties to mix in.
	             *
	             * @example
	             *
	             *     MyType.mixIn({
	             *         field: 'value'
	             *     });
	             */
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                // IE won't copy toString using the loop above
	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            /**
	             * Creates a copy of this object.
	             *
	             * @return {Object} The clone.
	             *
	             * @example
	             *
	             *     var clone = instance.clone();
	             */
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    /**
	     * An array of 32-bit words.
	     *
	     * @property {Array} words The array of 32-bit words.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var WordArray = C_lib.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of 32-bit words.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.create();
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        /**
	         * Converts this word array to a string.
	         *
	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
	         *
	         * @return {string} The stringified word array.
	         *
	         * @example
	         *
	         *     var string = wordArray + '';
	         *     var string = wordArray.toString();
	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
	         */
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        /**
	         * Concatenates a word array to this word array.
	         *
	         * @param {WordArray} wordArray The word array to append.
	         *
	         * @return {WordArray} This word array.
	         *
	         * @example
	         *
	         *     wordArray1.concat(wordArray2);
	         */
	        concat: function (wordArray) {
	            // Shortcuts
	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            // Clamp excess bits
	            this.clamp();

	            // Concat
	            if (thisSigBytes % 4) {
	                // Copy one byte at a time
	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {
	                // Copy one word at a time
	                for (var i = 0; i < thatSigBytes; i += 4) {
	                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            // Chainable
	            return this;
	        },

	        /**
	         * Removes insignificant bits.
	         *
	         * @example
	         *
	         *     wordArray.clamp();
	         */
	        clamp: function () {
	            // Shortcuts
	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            // Clamp
	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = wordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        /**
	         * Creates a word array filled with random bytes.
	         *
	         * @param {number} nBytes The number of random bytes to generate.
	         *
	         * @return {WordArray} The random word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
	         */
	        random: function (nBytes) {
	            var words = [];

	            var r = (function (m_w) {
	                var m_w = m_w;
	                var m_z = 0x3ade68b1;
	                var mask = 0xffffffff;

	                return function () {
	                    m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
	                    m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
	                    var result = ((m_z << 0x10) + m_w) & mask;
	                    result /= 0x100000000;
	                    result += 0.5;
	                    return result * (Math.random() > .5 ? 1 : -1);
	                }
	            });

	            for (var i = 0, rcache; i < nBytes; i += 4) {
	                var _r = r((rcache || Math.random()) * 0x100000000);

	                rcache = _r() * 0x3ade67b7;
	                words.push((_r() * 0x100000000) | 0);
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    /**
	     * Encoder namespace.
	     */
	    var C_enc = C.enc = {};

	    /**
	     * Hex encoding strategy.
	     */
	    var Hex = C_enc.Hex = {
	        /**
	         * Converts a word array to a hex string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The hex string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        /**
	         * Converts a hex string to a word array.
	         *
	         * @param {string} hexStr The hex string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
	         */
	        parse: function (hexStr) {
	            // Shortcut
	            var hexStrLength = hexStr.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    /**
	     * Latin1 encoding strategy.
	     */
	    var Latin1 = C_enc.Latin1 = {
	        /**
	         * Converts a word array to a Latin1 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Latin1 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        /**
	         * Converts a Latin1 string to a word array.
	         *
	         * @param {string} latin1Str The Latin1 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
	         */
	        parse: function (latin1Str) {
	            // Shortcut
	            var latin1StrLength = latin1Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    /**
	     * UTF-8 encoding strategy.
	     */
	    var Utf8 = C_enc.Utf8 = {
	        /**
	         * Converts a word array to a UTF-8 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-8 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        /**
	         * Converts a UTF-8 string to a word array.
	         *
	         * @param {string} utf8Str The UTF-8 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
	         */
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    /**
	     * Abstract buffered block algorithm template.
	     *
	     * The property blockSize must be implemented in a concrete subtype.
	     *
	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
	     */
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        /**
	         * Resets this block algorithm's data buffer to its initial state.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm.reset();
	         */
	        reset: function () {
	            // Initial values
	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        /**
	         * Adds new data to this block algorithm's buffer.
	         *
	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm._append('data');
	         *     bufferedBlockAlgorithm._append(wordArray);
	         */
	        _append: function (data) {
	            // Convert string to WordArray, else assume WordArray already
	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            // Append
	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        /**
	         * Processes available data blocks.
	         *
	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
	         *
	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
	         *
	         * @return {WordArray} The processed data.
	         *
	         * @example
	         *
	         *     var processedData = bufferedBlockAlgorithm._process();
	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
	         */
	        _process: function (doFlush) {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            // Count blocks ready
	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {
	                // Round up to include partial blocks
	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {
	                // Round down to include only full blocks,
	                // less the number of blocks that must remain in the buffer
	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            // Count words ready
	            var nWordsReady = nBlocksReady * blockSize;

	            // Count bytes ready
	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            // Process blocks
	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
	                    // Perform concrete-algorithm logic
	                    this._doProcessBlock(dataWords, offset);
	                }

	                // Remove processed words
	                var processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            // Return processed words
	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        /**
	         * Creates a copy of this object.
	         *
	         * @return {Object} The clone.
	         *
	         * @example
	         *
	         *     var clone = bufferedBlockAlgorithm.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    /**
	     * Abstract hasher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
	     */
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         */
	        cfg: Base.extend(),

	        /**
	         * Initializes a newly created hasher.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
	         *
	         * @example
	         *
	         *     var hasher = CryptoJS.algo.SHA256.create();
	         */
	        init: function (cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this hasher to its initial state.
	         *
	         * @example
	         *
	         *     hasher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-hasher logic
	            this._doReset();
	        },

	        /**
	         * Updates this hasher with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {Hasher} This hasher.
	         *
	         * @example
	         *
	         *     hasher.update('message');
	         *     hasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            // Append
	            this._append(messageUpdate);

	            // Update the hash
	            this._process();

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the hash computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The hash.
	         *
	         * @example
	         *
	         *     var hash = hasher.finalize();
	         *     var hash = hasher.finalize('message');
	         *     var hash = hasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Final message update
	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            // Perform concrete-hasher logic
	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        /**
	         * Creates a shortcut function to a hasher's object interface.
	         *
	         * @param {Hasher} hasher The hasher to create a helper for.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
	         */
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        /**
	         * Creates a shortcut function to the HMAC's object interface.
	         *
	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
	         */
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    /**
	     * Algorithm namespace.
	     */
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	return CryptoJS;

}));
},{}],25:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    /**
	     * Base64 encoding strategy.
	     */
	    var Base64 = C_enc.Base64 = {
	        /**
	         * Converts a word array to a Base64 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Base64 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;
	            var map = this._map;

	            // Clamp excess bits
	            wordArray.clamp();

	            // Convert
	            var base64Chars = [];
	            for (var i = 0; i < sigBytes; i += 3) {
	                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
	                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
	                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

	                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

	                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
	                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
	                }
	            }

	            // Add padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                while (base64Chars.length % 4) {
	                    base64Chars.push(paddingChar);
	                }
	            }

	            return base64Chars.join('');
	        },

	        /**
	         * Converts a Base64 string to a word array.
	         *
	         * @param {string} base64Str The Base64 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
	         */
	        parse: function (base64Str) {
	            // Shortcuts
	            var base64StrLength = base64Str.length;
	            var map = this._map;
	            var reverseMap = this._reverseMap;

	            if (!reverseMap) {
	                    reverseMap = this._reverseMap = [];
	                    for (var j = 0; j < map.length; j++) {
	                        reverseMap[map.charCodeAt(j)] = j;
	                    }
	            }

	            // Ignore padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                var paddingIndex = base64Str.indexOf(paddingChar);
	                if (paddingIndex !== -1) {
	                    base64StrLength = paddingIndex;
	                }
	            }

	            // Convert
	            return parseLoop(base64Str, base64StrLength, reverseMap);

	        },

	        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	    };

	    function parseLoop(base64Str, base64StrLength, reverseMap) {
	      var words = [];
	      var nBytes = 0;
	      for (var i = 0; i < base64StrLength; i++) {
	          if (i % 4) {
	              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
	              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
	              words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
	              nBytes++;
	          }
	      }
	      return WordArray.create(words, nBytes);
	    }
	}());


	return CryptoJS.enc.Base64;

}));
},{"./core":24}],26:[function(require,module,exports){
;(function (root, factory, undef) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"), require("./sha256"), require("./hmac"));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core", "./sha256", "./hmac"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	return CryptoJS.HmacSHA256;

}));
},{"./core":24,"./hmac":27,"./sha256":29}],27:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var C_algo = C.algo;

	    /**
	     * HMAC algorithm.
	     */
	    var HMAC = C_algo.HMAC = Base.extend({
	        /**
	         * Initializes a newly created HMAC.
	         *
	         * @param {Hasher} hasher The hash algorithm to use.
	         * @param {WordArray|string} key The secret key.
	         *
	         * @example
	         *
	         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
	         */
	        init: function (hasher, key) {
	            // Init hasher
	            hasher = this._hasher = new hasher.init();

	            // Convert string to WordArray, else assume WordArray already
	            if (typeof key == 'string') {
	                key = Utf8.parse(key);
	            }

	            // Shortcuts
	            var hasherBlockSize = hasher.blockSize;
	            var hasherBlockSizeBytes = hasherBlockSize * 4;

	            // Allow arbitrary length keys
	            if (key.sigBytes > hasherBlockSizeBytes) {
	                key = hasher.finalize(key);
	            }

	            // Clamp excess bits
	            key.clamp();

	            // Clone key for inner and outer pads
	            var oKey = this._oKey = key.clone();
	            var iKey = this._iKey = key.clone();

	            // Shortcuts
	            var oKeyWords = oKey.words;
	            var iKeyWords = iKey.words;

	            // XOR keys with pad constants
	            for (var i = 0; i < hasherBlockSize; i++) {
	                oKeyWords[i] ^= 0x5c5c5c5c;
	                iKeyWords[i] ^= 0x36363636;
	            }
	            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this HMAC to its initial state.
	         *
	         * @example
	         *
	         *     hmacHasher.reset();
	         */
	        reset: function () {
	            // Shortcut
	            var hasher = this._hasher;

	            // Reset
	            hasher.reset();
	            hasher.update(this._iKey);
	        },

	        /**
	         * Updates this HMAC with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {HMAC} This HMAC instance.
	         *
	         * @example
	         *
	         *     hmacHasher.update('message');
	         *     hmacHasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            this._hasher.update(messageUpdate);

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the HMAC computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The HMAC.
	         *
	         * @example
	         *
	         *     var hmac = hmacHasher.finalize();
	         *     var hmac = hmacHasher.finalize('message');
	         *     var hmac = hmacHasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Shortcut
	            var hasher = this._hasher;

	            // Compute HMAC
	            var innerHash = hasher.finalize(messageUpdate);
	            hasher.reset();
	            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

	            return hmac;
	        }
	    });
	}());


}));
},{"./core":24}],28:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	(function () {
	    // Check if typed arrays are supported
	    if (typeof ArrayBuffer != 'function') {
	        return;
	    }

	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;

	    // Reference original init
	    var superInit = WordArray.init;

	    // Augment WordArray.init to handle typed arrays
	    var subInit = WordArray.init = function (typedArray) {
	        // Convert buffers to uint8
	        if (typedArray instanceof ArrayBuffer) {
	            typedArray = new Uint8Array(typedArray);
	        }

	        // Convert other array views to uint8
	        if (
	            typedArray instanceof Int8Array ||
	            (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
	            typedArray instanceof Int16Array ||
	            typedArray instanceof Uint16Array ||
	            typedArray instanceof Int32Array ||
	            typedArray instanceof Uint32Array ||
	            typedArray instanceof Float32Array ||
	            typedArray instanceof Float64Array
	        ) {
	            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
	        }

	        // Handle Uint8Array
	        if (typedArray instanceof Uint8Array) {
	            // Shortcut
	            var typedArrayByteLength = typedArray.byteLength;

	            // Extract bytes
	            var words = [];
	            for (var i = 0; i < typedArrayByteLength; i++) {
	                words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
	            }

	            // Initialize this word array
	            superInit.call(this, words, typedArrayByteLength);
	        } else {
	            // Else call normal init
	            superInit.apply(this, arguments);
	        }
	    };

	    subInit.prototype = WordArray;
	}());


	return CryptoJS.lib.WordArray;

}));
},{"./core":24}],29:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Initialization and round constants tables
	    var H = [];
	    var K = [];

	    // Compute constants
	    (function () {
	        function isPrime(n) {
	            var sqrtN = Math.sqrt(n);
	            for (var factor = 2; factor <= sqrtN; factor++) {
	                if (!(n % factor)) {
	                    return false;
	                }
	            }

	            return true;
	        }

	        function getFractionalBits(n) {
	            return ((n - (n | 0)) * 0x100000000) | 0;
	        }

	        var n = 2;
	        var nPrime = 0;
	        while (nPrime < 64) {
	            if (isPrime(n)) {
	                if (nPrime < 8) {
	                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
	                }
	                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

	                nPrime++;
	            }

	            n++;
	        }
	    }());

	    // Reusable object
	    var W = [];

	    /**
	     * SHA-256 hash algorithm.
	     */
	    var SHA256 = C_algo.SHA256 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init(H.slice(0));
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var H = this._hash.words;

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];
	            var f = H[5];
	            var g = H[6];
	            var h = H[7];

	            // Computation
	            for (var i = 0; i < 64; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var gamma0x = W[i - 15];
	                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
	                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
	                                   (gamma0x >>> 3);

	                    var gamma1x = W[i - 2];
	                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
	                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
	                                   (gamma1x >>> 10);

	                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
	                }

	                var ch  = (e & f) ^ (~e & g);
	                var maj = (a & b) ^ (a & c) ^ (b & c);

	                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
	                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

	                var t1 = h + sigma1 + ch + K[i] + W[i];
	                var t2 = sigma0 + maj;

	                h = g;
	                g = f;
	                f = e;
	                e = (d + t1) | 0;
	                d = c;
	                c = b;
	                b = a;
	                a = (t1 + t2) | 0;
	            }

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	            H[5] = (H[5] + f) | 0;
	            H[6] = (H[6] + g) | 0;
	            H[7] = (H[7] + h) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Return final computed hash
	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA256('message');
	     *     var hash = CryptoJS.SHA256(wordArray);
	     */
	    C.SHA256 = Hasher._createHelper(SHA256);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA256(message, key);
	     */
	    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
	}(Math));


	return CryptoJS.SHA256;

}));
},{"./core":24}],30:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],31:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],32:[function(require,module,exports){
/*!
 * JavaScript Cookie v2.2.1
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if (typeof exports === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
}(function () {
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function decode (s) {
		return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
	}

	function init (converter) {
		function api() {}

		function set (key, value, attributes) {
			if (typeof document === 'undefined') {
				return;
			}

			attributes = extend({
				path: '/'
			}, api.defaults, attributes);

			if (typeof attributes.expires === 'number') {
				attributes.expires = new Date(new Date() * 1 + attributes.expires * 864e+5);
			}

			// We're using "expires" because "max-age" is not supported by IE
			attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

			try {
				var result = JSON.stringify(value);
				if (/^[\{\[]/.test(result)) {
					value = result;
				}
			} catch (e) {}

			value = converter.write ?
				converter.write(value, key) :
				encodeURIComponent(String(value))
					.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

			key = encodeURIComponent(String(key))
				.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
				.replace(/[\(\)]/g, escape);

			var stringifiedAttributes = '';
			for (var attributeName in attributes) {
				if (!attributes[attributeName]) {
					continue;
				}
				stringifiedAttributes += '; ' + attributeName;
				if (attributes[attributeName] === true) {
					continue;
				}

				// Considers RFC 6265 section 5.2:
				// ...
				// 3.  If the remaining unparsed-attributes contains a %x3B (";")
				//     character:
				// Consume the characters of the unparsed-attributes up to,
				// not including, the first %x3B (";") character.
				// ...
				stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
			}

			return (document.cookie = key + '=' + value + stringifiedAttributes);
		}

		function get (key, json) {
			if (typeof document === 'undefined') {
				return;
			}

			var jar = {};
			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all.
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (!json && cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = decode(parts[0]);
					cookie = (converter.read || converter)(cookie, name) ||
						decode(cookie);

					if (json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					jar[name] = cookie;

					if (key === name) {
						break;
					}
				} catch (e) {}
			}

			return key ? jar[key] : jar;
		}

		api.set = set;
		api.get = function (key) {
			return get(key, false /* read as raw */);
		};
		api.getJSON = function (key) {
			return get(key, true /* read as json */);
		};
		api.remove = function (key, attributes) {
			set(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.defaults = {};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
}));

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIi4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJpbmRleFNyYy5qcyIsIi4uL25vZGVfbW9kdWxlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9saWIvQXV0aGVudGljYXRpb25EZXRhaWxzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2xpYi9BdXRoZW50aWNhdGlvbkhlbHBlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9saWIvQmlnSW50ZWdlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9saWIvQ2xpZW50LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2xpYi9Db2duaXRvQWNjZXNzVG9rZW4uanMiLCIuLi9ub2RlX21vZHVsZXMvYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMvbGliL0NvZ25pdG9JZFRva2VuLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2xpYi9Db2duaXRvSnd0VG9rZW4uanMiLCIuLi9ub2RlX21vZHVsZXMvYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMvbGliL0NvZ25pdG9SZWZyZXNoVG9rZW4uanMiLCIuLi9ub2RlX21vZHVsZXMvYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMvbGliL0NvZ25pdG9Vc2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2xpYi9Db2duaXRvVXNlckF0dHJpYnV0ZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9saWIvQ29nbml0b1VzZXJQb29sLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2xpYi9Db2duaXRvVXNlclNlc3Npb24uanMiLCIuLi9ub2RlX21vZHVsZXMvYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMvbGliL0Nvb2tpZVN0b3JhZ2UuanMiLCIuLi9ub2RlX21vZHVsZXMvYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMvbGliL0RhdGVIZWxwZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMvbGliL1N0b3JhZ2VIZWxwZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMvbGliL1VzZXJBZ2VudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9saWIvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2NyeXB0by1qcy9jb3JlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2NyeXB0by1qcy9lbmMtYmFzZTY0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2NyeXB0by1qcy9obWFjLXNoYTI1Ni5qcyIsIi4uL25vZGVfbW9kdWxlcy9jcnlwdG8tanMvaG1hYy5qcyIsIi4uL25vZGVfbW9kdWxlcy9jcnlwdG8tanMvbGliLXR5cGVkYXJyYXlzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2NyeXB0by1qcy9zaGEyNTYuanMiLCIuLi9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9qcy1jb29raWUvc3JjL2pzLmNvb2tpZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3Z3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzcyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2dkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsoXG4gICAgICB1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpXG4gICAgKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDJdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl0gK1xuICAgICAgJz09J1xuICAgIClcbiAgfSBlbHNlIGlmIChleHRyYUJ5dGVzID09PSAyKSB7XG4gICAgdG1wID0gKHVpbnQ4W2xlbiAtIDJdIDw8IDgpICsgdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAxMF0gK1xuICAgICAgbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdICtcbiAgICAgICc9J1xuICAgIClcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGN1c3RvbUluc3BlY3RTeW1ib2wgPVxuICAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLmZvciA9PT0gJ2Z1bmN0aW9uJylcbiAgICA/IFN5bWJvbC5mb3IoJ25vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tJylcbiAgICA6IG51bGxcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgdmFyIHByb3RvID0geyBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH0gfVxuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihwcm90bywgVWludDhBcnJheS5wcm90b3R5cGUpXG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGFyciwgcHJvdG8pXG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIE9iamVjdC5zZXRQcm90b3R5cGVPZihidWYsIEJ1ZmZlci5wcm90b3R5cGUpXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gICAgKVxuICB9XG5cbiAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fFxuICAgICAgKHZhbHVlICYmIGlzSW5zdGFuY2UodmFsdWUuYnVmZmVyLCBBcnJheUJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgIClcbiAgfVxuXG4gIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZiAmJiB2YWx1ZS52YWx1ZU9mKClcbiAgaWYgKHZhbHVlT2YgIT0gbnVsbCAmJiB2YWx1ZU9mICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbSh2YWx1ZU9mLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICB2YXIgYiA9IGZyb21PYmplY3QodmFsdWUpXG4gIGlmIChiKSByZXR1cm4gYlxuXG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9QcmltaXRpdmUgIT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKCdzdHJpbmcnKSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICApXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20odmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gTm90ZTogQ2hhbmdlIHByb3RvdHlwZSAqYWZ0ZXIqIEJ1ZmZlci5mcm9tIGlzIGRlZmluZWQgdG8gd29ya2Fyb3VuZCBDaHJvbWUgYnVnOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC8xNDhcbk9iamVjdC5zZXRQcm90b3R5cGVPZihCdWZmZXIucHJvdG90eXBlLCBVaW50OEFycmF5LnByb3RvdHlwZSlcbk9iamVjdC5zZXRQcm90b3R5cGVPZihCdWZmZXIsIFVpbnQ4QXJyYXkpXG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGJ1ZiwgQnVmZmVyLnByb3RvdHlwZSlcblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5pZiAoY3VzdG9tSW5zcGVjdFN5bWJvbCkge1xuICBCdWZmZXIucHJvdG90eXBlW2N1c3RvbUluc3BlY3RTeW1ib2xdID0gQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgW3ZhbF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIHZhciBpbmRleFNpemUgPSAxXG4gIHZhciBhcnJMZW5ndGggPSBhcnIubGVuZ3RoXG4gIHZhciB2YWxMZW5ndGggPSB2YWwubGVuZ3RoXG5cbiAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgIGlmIChlbmNvZGluZyA9PT0gJ3VjczInIHx8IGVuY29kaW5nID09PSAndWNzLTInIHx8XG4gICAgICAgIGVuY29kaW5nID09PSAndXRmMTZsZScgfHwgZW5jb2RpbmcgPT09ICd1dGYtMTZsZScpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoIDwgMiB8fCB2YWwubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICAgIGluZGV4U2l6ZSA9IDJcbiAgICAgIGFyckxlbmd0aCAvPSAyXG4gICAgICB2YWxMZW5ndGggLz0gMlxuICAgICAgYnl0ZU9mZnNldCAvPSAyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoYnVmLCBpKSB7XG4gICAgaWYgKGluZGV4U2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGJ1ZltpXVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpICogaW5kZXhTaXplKVxuICAgIH1cbiAgfVxuXG4gIHZhciBpXG4gIGlmIChkaXIpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVhZChhcnIsIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYnl0ZU9mZnNldCArIHZhbExlbmd0aCA+IGFyckxlbmd0aCkgYnl0ZU9mZnNldCA9IGFyckxlbmd0aCAtIHZhbExlbmd0aFxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgZm91bmQgPSB0cnVlXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbExlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgdHJ1ZSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChudW1iZXJJc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCA+Pj4gMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSBoZXhTbGljZUxvb2t1cFRhYmxlW2J1ZltpXV1cbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKG5ld0J1ZiwgQnVmZmVyLnByb3RvdHlwZSlcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdib29sZWFuJykge1xuICAgIHZhbCA9IE51bWJlcih2YWwpXG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG5cbi8vIENyZWF0ZSBsb29rdXAgdGFibGUgZm9yIGB0b1N0cmluZygnaGV4JylgXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8yMTlcbnZhciBoZXhTbGljZUxvb2t1cFRhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFscGhhYmV0ID0gJzAxMjM0NTY3ODlhYmNkZWYnXG4gIHZhciB0YWJsZSA9IG5ldyBBcnJheSgyNTYpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7ICsraSkge1xuICAgIHZhciBpMTYgPSBpICogMTZcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDE2OyArK2opIHtcbiAgICAgIHRhYmxlW2kxNiArIGpdID0gYWxwaGFiZXRbaV0gKyBhbHBoYWJldFtqXVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFibGVcbn0pKClcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsImNvbnN0IEFtYXpvbkNvZ25pdG9JZGVudGl0eSA9IHJlcXVpcmUoJ2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzJylcclxuY29uc3QgcG9vbERhdGEgPSB7XHJcbiAgVXNlclBvb2xJZDogJ3VzLWVhc3QtMV90S1NqdzN4WHUnLFxyXG4gIENsaWVudElkOiAnMWFvc25sZ2g4cm9hbTc1Y29tc3A3N2ZoZDEnXHJcbn1cclxuY29uc3QgdXNlclBvb2wgPSBuZXcgQW1hem9uQ29nbml0b0lkZW50aXR5LkNvZ25pdG9Vc2VyUG9vbChwb29sRGF0YSlcclxuXHJcbi8vIFRoZSB1c2VyIHNob3VsZCBoYXZlIHNpZ25lZCBpbiB3aXRoIENvZ25pdG8uXHJcbmNvbnN0IGhhc2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKSlcclxuY29uc3QgaWRUb2tlbiA9IGhhc2hQYXJhbXMuZ2V0KCdpZF90b2tlbicpXHJcbi8vIGNvbnNvbGUubG9nKCdpZF90b2tlbjogJyArIGlkX3Rva2VuKTtcclxuXHJcbmNvbnN0IGFjY2Vzc1Rva2VuID0gaGFzaFBhcmFtcy5nZXQoJ2FjY2Vzc190b2tlbicpXHJcbi8vIGNvbnNvbGUubG9nKCdhY2Nlc3NfdG9rZW46ICcgKyBhY2Nlc3NfdG9rZW4pO1xyXG5cclxuY29uc3QgcXVlcnlQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpXHJcbmNvbnN0IGNvZGUgPSBxdWVyeVBhcmFtcy5nZXQoJ2NvZGUnKVxyXG4vLyBjb25zb2xlLmxvZygnY29kZTogJyArIGNvZGUpO1xyXG5cclxuLy8gU2V0IHVwOlxyXG5jb25zdCBhcGkgPSAnaHR0cHM6Ly9hcGkuaW1hbG9naXQuY29tL21haW4vZGV2LydcclxuY29uc3Qgb3JpZ2luID0gJ2h0dHBzOi8vaW1hbG9naXQuY29tJ1xyXG5jb25zdCBiZWFyZXJUeXBlID0gJ2lkX3Rva2VuJyAvLyBzZXQgdG8gZWl0aGVyIGlkX3Rva2VuLCBhY2Nlc3NfdG9rZW4sIG9yIGNvZGVcclxubGV0IGJlYXJlclZhbHVlXHJcbmlmIChiZWFyZXJUeXBlID09PSAnaWRfdG9rZW4nKSB7XHJcbiAgYmVhcmVyVmFsdWUgPSBpZFRva2VuXHJcbn0gZWxzZSBpZiAoYmVhcmVyVHlwZSA9PT0gJ2FjY2Vzc190b2tlbicpIHtcclxuICBiZWFyZXJWYWx1ZSA9IGFjY2Vzc1Rva2VuXHJcbn0gZWxzZSBpZiAoYmVhcmVyVHlwZSA9PT0gJ2NvZGUnKSB7XHJcbiAgYmVhcmVyVmFsdWUgPSBjb2RlXHJcbn1cclxuY29uc3QgYXV0aG9yaXphdGlvbiA9ICdCZWFyZXIgJyArIGJlYXJlclZhbHVlXHJcblxyXG5hc3luYyBmdW5jdGlvbiBhc3luY0l0IChhcGksIG9yaWdpbiwgYXV0aG9yaXphdGlvbikge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHdpbmRvdy5mZXRjaChhcGksIHtcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIE9yaWdpbjogb3JpZ2luLFxyXG4gICAgICAgIEF1dGhvcml6YXRpb246IGF1dGhvcml6YXRpb25cclxuICAgICAgfSxcclxuICAgICAgbWV0aG9kOiAnR0VUJ1xyXG4gICAgfSlcclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXHJcbiAgICBjb25zb2xlLmxvZygnZGF0YTogJywgZGF0YSlcclxuICAgIGlmIChkYXRhLnNlc3Npb24uaXNWYWxpZCkge1xyXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXN5bmNBbnN3ZXInKS5pbm5lckhUTUwgPSAnPG1hcms+JyArIGRhdGEuc2Vzc2lvbi5jbGFpbXMuZW1haWwgKyAnPC9tYXJrPiBoYXMgc2lnbmVkIGluLidcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IEpTT04uc3RyaW5naWZ5KGRhdGEpXHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5sb2coJ0Vycm9yOiAnLCBlKVxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FzeW5jQW5zd2VyJykuaW5uZXJIVE1MID0gJ1NvcnJ5LCB0aGVyZSB3YXMgYW4gZXJyb3IuJ1xyXG4gIH1cclxufTtcclxuYXN5bmNJdChhcGksIG9yaWdpbiwgYXV0aG9yaXphdGlvbilcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxuLyohXG4gKiBDb3B5cmlnaHQgMjAxNiBBbWF6b24uY29tLFxuICogSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQW1hem9uIFNvZnR3YXJlIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIikuXG4gKiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlXG4gKiBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwOi8vYXdzLmFtYXpvbi5jb20vYXNsL1xuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpc1xuICogZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlXG4gKiBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY2xhc3MgKi9cbnZhciBBdXRoZW50aWNhdGlvbkRldGFpbHMgPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBBdXRoZW50aWNhdGlvbkRldGFpbHMgb2JqZWN0XG4gICAqIEBwYXJhbSB7b2JqZWN0PX0gZGF0YSBDcmVhdGlvbiBvcHRpb25zLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YS5Vc2VybmFtZSBVc2VyIGJlaW5nIGF1dGhlbnRpY2F0ZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhLlBhc3N3b3JkIFBsYWluLXRleHQgcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGguXG4gICAqIEBwYXJhbSB7KEF0dHJpYnV0ZUFyZ1tdKT99IGRhdGEuVmFsaWRhdGlvbkRhdGEgQXBwbGljYXRpb24gZXh0cmEgbWV0YWRhdGEuXG4gICAqIEBwYXJhbSB7KEF0dHJpYnV0ZUFyZ1tdKT99IGRhdGEuQXV0aFBhcmFtYXRlcnMgQXV0aGVudGljYXRpb24gcGFyYW1hdGVycyBmb3IgY3VzdG9tIGF1dGguXG4gICAqL1xuICBmdW5jdGlvbiBBdXRoZW50aWNhdGlvbkRldGFpbHMoZGF0YSkge1xuICAgIHZhciBfcmVmID0gZGF0YSB8fCB7fSxcbiAgICAgICAgVmFsaWRhdGlvbkRhdGEgPSBfcmVmLlZhbGlkYXRpb25EYXRhLFxuICAgICAgICBVc2VybmFtZSA9IF9yZWYuVXNlcm5hbWUsXG4gICAgICAgIFBhc3N3b3JkID0gX3JlZi5QYXNzd29yZCxcbiAgICAgICAgQXV0aFBhcmFtZXRlcnMgPSBfcmVmLkF1dGhQYXJhbWV0ZXJzLFxuICAgICAgICBDbGllbnRNZXRhZGF0YSA9IF9yZWYuQ2xpZW50TWV0YWRhdGE7XG5cbiAgICB0aGlzLnZhbGlkYXRpb25EYXRhID0gVmFsaWRhdGlvbkRhdGEgfHwge307XG4gICAgdGhpcy5hdXRoUGFyYW1ldGVycyA9IEF1dGhQYXJhbWV0ZXJzIHx8IHt9O1xuICAgIHRoaXMuY2xpZW50TWV0YWRhdGEgPSBDbGllbnRNZXRhZGF0YSB8fCB7fTtcbiAgICB0aGlzLnVzZXJuYW1lID0gVXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IFBhc3N3b3JkO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgcmVjb3JkJ3MgdXNlcm5hbWVcbiAgICovXG5cblxuICB2YXIgX3Byb3RvID0gQXV0aGVudGljYXRpb25EZXRhaWxzLnByb3RvdHlwZTtcblxuICBfcHJvdG8uZ2V0VXNlcm5hbWUgPSBmdW5jdGlvbiBnZXRVc2VybmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VybmFtZTtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIHJlY29yZCdzIHBhc3N3b3JkXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldFBhc3N3b3JkID0gZnVuY3Rpb24gZ2V0UGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMucGFzc3dvcmQ7XG4gIH1cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtBcnJheX0gdGhlIHJlY29yZCdzIHZhbGlkYXRpb25EYXRhXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldFZhbGlkYXRpb25EYXRhID0gZnVuY3Rpb24gZ2V0VmFsaWRhdGlvbkRhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsaWRhdGlvbkRhdGE7XG4gIH1cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtBcnJheX0gdGhlIHJlY29yZCdzIGF1dGhQYXJhbWV0ZXJzXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldEF1dGhQYXJhbWV0ZXJzID0gZnVuY3Rpb24gZ2V0QXV0aFBhcmFtZXRlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXV0aFBhcmFtZXRlcnM7XG4gIH1cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtDbGllbnRNZXRhZGF0YX0gdGhlIGNsaWVudE1ldGFkYXRhIGZvciBhIExhbWJkYSB0cmlnZ2VyXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldENsaWVudE1ldGFkYXRhID0gZnVuY3Rpb24gZ2V0Q2xpZW50TWV0YWRhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xpZW50TWV0YWRhdGE7XG4gIH07XG5cbiAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uRGV0YWlscztcbn0oKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBBdXRoZW50aWNhdGlvbkRldGFpbHM7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9idWZmZXIgPSByZXF1aXJlKFwiYnVmZmVyL1wiKTtcblxudmFyIF9jb3JlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiY3J5cHRvLWpzL2NvcmVcIikpO1xuXG5yZXF1aXJlKFwiY3J5cHRvLWpzL2xpYi10eXBlZGFycmF5c1wiKTtcblxudmFyIF9zaGEgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCJjcnlwdG8tanMvc2hhMjU2XCIpKTtcblxudmFyIF9obWFjU2hhID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiY3J5cHRvLWpzL2htYWMtc2hhMjU2XCIpKTtcblxudmFyIF9CaWdJbnRlZ2VyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9CaWdJbnRlZ2VyXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbi8qIVxuICogQ29weXJpZ2h0IDIwMTYgQW1hem9uLmNvbSxcbiAqIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFtYXpvbiBTb2Z0d2FyZSBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpLlxuICogWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZVxuICogTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cDovL2F3cy5hbWF6b24uY29tL2FzbC9cbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXNcbiAqIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZVxuICogZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLy8gbmVjZXNzYXJ5IGZvciBjcnlwdG8ganNcbnZhciByYW5kb21CeXRlcyA9IGZ1bmN0aW9uIHJhbmRvbUJ5dGVzKG5CeXRlcykge1xuICByZXR1cm4gX2J1ZmZlci5CdWZmZXIuZnJvbShfY29yZVtcImRlZmF1bHRcIl0ubGliLldvcmRBcnJheS5yYW5kb20obkJ5dGVzKS50b1N0cmluZygpLCAnaGV4Jyk7XG59O1xuXG52YXIgaW5pdE4gPSAnRkZGRkZGRkZGRkZGRkZGRkM5MEZEQUEyMjE2OEMyMzRDNEM2NjI4QjgwREMxQ0QxJyArICcyOTAyNEUwODhBNjdDQzc0MDIwQkJFQTYzQjEzOUIyMjUxNEEwODc5OEUzNDA0REQnICsgJ0VGOTUxOUIzQ0QzQTQzMUIzMDJCMEE2REYyNUYxNDM3NEZFMTM1NkQ2RDUxQzI0NScgKyAnRTQ4NUI1NzY2MjVFN0VDNkY0NEM0MkU5QTYzN0VENkIwQkZGNUNCNkY0MDZCN0VEJyArICdFRTM4NkJGQjVBODk5RkE1QUU5RjI0MTE3QzRCMUZFNjQ5Mjg2NjUxRUNFNDVCM0QnICsgJ0MyMDA3Q0I4QTE2M0JGMDU5OERBNDgzNjFDNTVEMzlBNjkxNjNGQThGRDI0Q0Y1RicgKyAnODM2NTVEMjNEQ0EzQUQ5NjFDNjJGMzU2MjA4NTUyQkI5RUQ1MjkwNzcwOTY5NjZEJyArICc2NzBDMzU0RTRBQkM5ODA0RjE3NDZDMDhDQTE4MjE3QzMyOTA1RTQ2MkUzNkNFM0InICsgJ0UzOUU3NzJDMTgwRTg2MDM5QjI3ODNBMkVDMDdBMjhGQjVDNTVERjA2RjRDNTJDOScgKyAnREUyQkNCRjY5NTU4MTcxODM5OTU0OTdDRUE5NTZBRTUxNUQyMjYxODk4RkEwNTEwJyArICcxNTcyOEU1QThBQUFDNDJEQUQzMzE3MEQwNDUwN0EzM0E4NTUyMUFCREYxQ0JBNjQnICsgJ0VDRkI4NTA0NThEQkVGMEE4QUVBNzE1NzVEMDYwQzdEQjM5NzBGODVBNkUxRTRDNycgKyAnQUJGNUFFOENEQjA5MzNENzFFOEM5NEUwNEEyNTYxOURDRUUzRDIyNjFBRDJFRTZCJyArICdGMTJGRkEwNkQ5OEEwODY0RDg3NjAyNzMzRUM4NkE2NDUyMUYyQjE4MTc3QjIwMEMnICsgJ0JCRTExNzU3N0E2MTVENkM3NzA5ODhDMEJBRDk0NkUyMDhFMjRGQTA3NEU1QUIzMScgKyAnNDNEQjVCRkNFMEZEMTA4RTRCODJEMTIwQTkzQUQyQ0FGRkZGRkZGRkZGRkZGRkZGJztcbnZhciBuZXdQYXNzd29yZFJlcXVpcmVkQ2hhbGxlbmdlVXNlckF0dHJpYnV0ZVByZWZpeCA9ICd1c2VyQXR0cmlidXRlcy4nO1xuLyoqIEBjbGFzcyAqL1xuXG52YXIgQXV0aGVudGljYXRpb25IZWxwZXIgPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBBdXRoZW50aWNhdGlvbkhlbHBlciBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFBvb2xOYW1lIENvZ25pdG8gdXNlciBwb29sIG5hbWUuXG4gICAqL1xuICBmdW5jdGlvbiBBdXRoZW50aWNhdGlvbkhlbHBlcihQb29sTmFtZSkge1xuICAgIHRoaXMuTiA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0oaW5pdE4sIDE2KTtcbiAgICB0aGlzLmcgPSBuZXcgX0JpZ0ludGVnZXJbXCJkZWZhdWx0XCJdKCcyJywgMTYpO1xuICAgIHRoaXMuayA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0odGhpcy5oZXhIYXNoKFwiMDBcIiArIHRoaXMuTi50b1N0cmluZygxNikgKyBcIjBcIiArIHRoaXMuZy50b1N0cmluZygxNikpLCAxNik7XG4gICAgdGhpcy5zbWFsbEFWYWx1ZSA9IHRoaXMuZ2VuZXJhdGVSYW5kb21TbWFsbEEoKTtcbiAgICB0aGlzLmdldExhcmdlQVZhbHVlKGZ1bmN0aW9uICgpIHt9KTtcbiAgICB0aGlzLmluZm9CaXRzID0gX2J1ZmZlci5CdWZmZXIuZnJvbSgnQ2FsZGVyYSBEZXJpdmVkIEtleScsICd1dGY4Jyk7XG4gICAgdGhpcy5wb29sTmFtZSA9IFBvb2xOYW1lO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7QmlnSW50ZWdlcn0gc21hbGwgQSwgYSByYW5kb20gbnVtYmVyXG4gICAqL1xuXG5cbiAgdmFyIF9wcm90byA9IEF1dGhlbnRpY2F0aW9uSGVscGVyLnByb3RvdHlwZTtcblxuICBfcHJvdG8uZ2V0U21hbGxBVmFsdWUgPSBmdW5jdGlvbiBnZXRTbWFsbEFWYWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5zbWFsbEFWYWx1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8QmlnSW50ZWdlcj59IGNhbGxiYWNrIENhbGxlZCB3aXRoIChlcnIsIGxhcmdlQVZhbHVlKVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0TGFyZ2VBVmFsdWUgPSBmdW5jdGlvbiBnZXRMYXJnZUFWYWx1ZShjYWxsYmFjaykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy5sYXJnZUFWYWx1ZSkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgdGhpcy5sYXJnZUFWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FsY3VsYXRlQSh0aGlzLnNtYWxsQVZhbHVlLCBmdW5jdGlvbiAoZXJyLCBsYXJnZUFWYWx1ZSkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzLmxhcmdlQVZhbHVlID0gbGFyZ2VBVmFsdWU7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIF90aGlzLmxhcmdlQVZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGEgcmFuZG9tIGJpZyBpbnRlZ2VyXG4gICAqIEByZXR1cm5zIHtCaWdJbnRlZ2VyfSBhIHJhbmRvbSB2YWx1ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2VuZXJhdGVSYW5kb21TbWFsbEEgPSBmdW5jdGlvbiBnZW5lcmF0ZVJhbmRvbVNtYWxsQSgpIHtcbiAgICB2YXIgaGV4UmFuZG9tID0gcmFuZG9tQnl0ZXMoMTI4KS50b1N0cmluZygnaGV4Jyk7XG4gICAgdmFyIHJhbmRvbUJpZ0ludCA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0oaGV4UmFuZG9tLCAxNik7XG4gICAgdmFyIHNtYWxsQUJpZ0ludCA9IHJhbmRvbUJpZ0ludC5tb2QodGhpcy5OKTtcbiAgICByZXR1cm4gc21hbGxBQmlnSW50O1xuICB9XG4gIC8qKlxuICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgYSByYW5kb20gc3RyaW5nXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IGEgcmFuZG9tIHZhbHVlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZW5lcmF0ZVJhbmRvbVN0cmluZyA9IGZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tU3RyaW5nKCkge1xuICAgIHJldHVybiByYW5kb21CeXRlcyg0MCkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBHZW5lcmF0ZWQgcmFuZG9tIHZhbHVlIGluY2x1ZGVkIGluIHBhc3N3b3JkIGhhc2guXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldFJhbmRvbVBhc3N3b3JkID0gZnVuY3Rpb24gZ2V0UmFuZG9tUGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMucmFuZG9tUGFzc3dvcmQ7XG4gIH1cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IEdlbmVyYXRlZCByYW5kb20gdmFsdWUgaW5jbHVkZWQgaW4gZGV2aWNlcyBoYXNoLlxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXRTYWx0RGV2aWNlcyA9IGZ1bmN0aW9uIGdldFNhbHREZXZpY2VzKCkge1xuICAgIHJldHVybiB0aGlzLlNhbHRUb0hhc2hEZXZpY2VzO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBWYWx1ZSB1c2VkIHRvIHZlcmlmeSBkZXZpY2VzLlxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXRWZXJpZmllckRldmljZXMgPSBmdW5jdGlvbiBnZXRWZXJpZmllckRldmljZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMudmVyaWZpZXJEZXZpY2VzO1xuICB9XG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBzYWx0cyBhbmQgY29tcHV0ZSB2ZXJpZmllci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGRldmljZUdyb3VwS2V5IERldmljZXMgdG8gZ2VuZXJhdGUgdmVyaWZpZXIgZm9yLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcm5hbWUgVXNlciB0byBnZW5lcmF0ZSB2ZXJpZmllciBmb3IuXG4gICAqIEBwYXJhbSB7bm9kZUNhbGxiYWNrPG51bGw+fSBjYWxsYmFjayBDYWxsZWQgd2l0aCAoZXJyLCBudWxsKVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2VuZXJhdGVIYXNoRGV2aWNlID0gZnVuY3Rpb24gZ2VuZXJhdGVIYXNoRGV2aWNlKGRldmljZUdyb3VwS2V5LCB1c2VybmFtZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgIHRoaXMucmFuZG9tUGFzc3dvcmQgPSB0aGlzLmdlbmVyYXRlUmFuZG9tU3RyaW5nKCk7XG4gICAgdmFyIGNvbWJpbmVkU3RyaW5nID0gXCJcIiArIGRldmljZUdyb3VwS2V5ICsgdXNlcm5hbWUgKyBcIjpcIiArIHRoaXMucmFuZG9tUGFzc3dvcmQ7XG4gICAgdmFyIGhhc2hlZFN0cmluZyA9IHRoaXMuaGFzaChjb21iaW5lZFN0cmluZyk7XG4gICAgdmFyIGhleFJhbmRvbSA9IHJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnaGV4Jyk7XG4gICAgdGhpcy5TYWx0VG9IYXNoRGV2aWNlcyA9IHRoaXMucGFkSGV4KG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0oaGV4UmFuZG9tLCAxNikpO1xuICAgIHRoaXMuZy5tb2RQb3cobmV3IF9CaWdJbnRlZ2VyW1wiZGVmYXVsdFwiXSh0aGlzLmhleEhhc2godGhpcy5TYWx0VG9IYXNoRGV2aWNlcyArIGhhc2hlZFN0cmluZyksIDE2KSwgdGhpcy5OLCBmdW5jdGlvbiAoZXJyLCB2ZXJpZmllckRldmljZXNOb3RQYWRkZWQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMyLnZlcmlmaWVyRGV2aWNlcyA9IF90aGlzMi5wYWRIZXgodmVyaWZpZXJEZXZpY2VzTm90UGFkZGVkKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIG51bGwpO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgdGhlIGNsaWVudCdzIHB1YmxpYyB2YWx1ZSBBID0gZ15hJU5cbiAgICogd2l0aCB0aGUgZ2VuZXJhdGVkIHJhbmRvbSBudW1iZXIgYVxuICAgKiBAcGFyYW0ge0JpZ0ludGVnZXJ9IGEgUmFuZG9tbHkgZ2VuZXJhdGVkIHNtYWxsIEEuXG4gICAqIEBwYXJhbSB7bm9kZUNhbGxiYWNrPEJpZ0ludGVnZXI+fSBjYWxsYmFjayBDYWxsZWQgd2l0aCAoZXJyLCBsYXJnZUFWYWx1ZSlcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmNhbGN1bGF0ZUEgPSBmdW5jdGlvbiBjYWxjdWxhdGVBKGEsIGNhbGxiYWNrKSB7XG4gICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICB0aGlzLmcubW9kUG93KGEsIHRoaXMuTiwgZnVuY3Rpb24gKGVyciwgQSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoQS5tb2QoX3RoaXMzLk4pLmVxdWFscyhfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0uWkVSTykpIHtcbiAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdJbGxlZ2FsIHBhcmFtYXRlci4gQSBtb2QgTiBjYW5ub3QgYmUgMC4nKSwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrKG51bGwsIEEpO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgdGhlIGNsaWVudCdzIHZhbHVlIFUgd2hpY2ggaXMgdGhlIGhhc2ggb2YgQSBhbmQgQlxuICAgKiBAcGFyYW0ge0JpZ0ludGVnZXJ9IEEgTGFyZ2UgQSB2YWx1ZS5cbiAgICogQHBhcmFtIHtCaWdJbnRlZ2VyfSBCIFNlcnZlciBCIHZhbHVlLlxuICAgKiBAcmV0dXJucyB7QmlnSW50ZWdlcn0gQ29tcHV0ZWQgVSB2YWx1ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIDtcblxuICBfcHJvdG8uY2FsY3VsYXRlVSA9IGZ1bmN0aW9uIGNhbGN1bGF0ZVUoQSwgQikge1xuICAgIHRoaXMuVUhleEhhc2ggPSB0aGlzLmhleEhhc2godGhpcy5wYWRIZXgoQSkgKyB0aGlzLnBhZEhleChCKSk7XG4gICAgdmFyIGZpbmFsVSA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0odGhpcy5VSGV4SGFzaCwgMTYpO1xuICAgIHJldHVybiBmaW5hbFU7XG4gIH1cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBhIGhhc2ggZnJvbSBhIGJpdEFycmF5XG4gICAqIEBwYXJhbSB7QnVmZmVyfSBidWYgVmFsdWUgdG8gaGFzaC5cbiAgICogQHJldHVybnMge1N0cmluZ30gSGV4LWVuY29kZWQgaGFzaC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIDtcblxuICBfcHJvdG8uaGFzaCA9IGZ1bmN0aW9uIGhhc2goYnVmKSB7XG4gICAgdmFyIHN0ciA9IGJ1ZiBpbnN0YW5jZW9mIF9idWZmZXIuQnVmZmVyID8gX2NvcmVbXCJkZWZhdWx0XCJdLmxpYi5Xb3JkQXJyYXkuY3JlYXRlKGJ1ZikgOiBidWY7XG4gICAgdmFyIGhhc2hIZXggPSAoMCwgX3NoYVtcImRlZmF1bHRcIl0pKHN0cikudG9TdHJpbmcoKTtcbiAgICByZXR1cm4gbmV3IEFycmF5KDY0IC0gaGFzaEhleC5sZW5ndGgpLmpvaW4oJzAnKSArIGhhc2hIZXg7XG4gIH1cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBhIGhhc2ggZnJvbSBhIGhleCBzdHJpbmdcbiAgICogQHBhcmFtIHtTdHJpbmd9IGhleFN0ciBWYWx1ZSB0byBoYXNoLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBIZXgtZW5jb2RlZCBoYXNoLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5oZXhIYXNoID0gZnVuY3Rpb24gaGV4SGFzaChoZXhTdHIpIHtcbiAgICByZXR1cm4gdGhpcy5oYXNoKF9idWZmZXIuQnVmZmVyLmZyb20oaGV4U3RyLCAnaGV4JykpO1xuICB9XG4gIC8qKlxuICAgKiBTdGFuZGFyZCBoa2RmIGFsZ29yaXRobVxuICAgKiBAcGFyYW0ge0J1ZmZlcn0gaWttIElucHV0IGtleSBtYXRlcmlhbC5cbiAgICogQHBhcmFtIHtCdWZmZXJ9IHNhbHQgU2FsdCB2YWx1ZS5cbiAgICogQHJldHVybnMge0J1ZmZlcn0gU3Ryb25nIGtleSBtYXRlcmlhbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIDtcblxuICBfcHJvdG8uY29tcHV0ZWhrZGYgPSBmdW5jdGlvbiBjb21wdXRlaGtkZihpa20sIHNhbHQpIHtcbiAgICB2YXIgaW5mb0JpdHNXb3JkQXJyYXkgPSBfY29yZVtcImRlZmF1bHRcIl0ubGliLldvcmRBcnJheS5jcmVhdGUoX2J1ZmZlci5CdWZmZXIuY29uY2F0KFt0aGlzLmluZm9CaXRzLCBfYnVmZmVyLkJ1ZmZlci5mcm9tKFN0cmluZy5mcm9tQ2hhckNvZGUoMSksICd1dGY4JyldKSk7XG5cbiAgICB2YXIgaWttV29yZEFycmF5ID0gaWttIGluc3RhbmNlb2YgX2J1ZmZlci5CdWZmZXIgPyBfY29yZVtcImRlZmF1bHRcIl0ubGliLldvcmRBcnJheS5jcmVhdGUoaWttKSA6IGlrbTtcbiAgICB2YXIgc2FsdFdvcmRBcnJheSA9IHNhbHQgaW5zdGFuY2VvZiBfYnVmZmVyLkJ1ZmZlciA/IF9jb3JlW1wiZGVmYXVsdFwiXS5saWIuV29yZEFycmF5LmNyZWF0ZShzYWx0KSA6IHNhbHQ7XG4gICAgdmFyIHByayA9ICgwLCBfaG1hY1NoYVtcImRlZmF1bHRcIl0pKGlrbVdvcmRBcnJheSwgc2FsdFdvcmRBcnJheSk7XG4gICAgdmFyIGhtYWMgPSAoMCwgX2htYWNTaGFbXCJkZWZhdWx0XCJdKShpbmZvQml0c1dvcmRBcnJheSwgcHJrKTtcbiAgICByZXR1cm4gX2J1ZmZlci5CdWZmZXIuZnJvbShobWFjLnRvU3RyaW5nKCksICdoZXgnKS5zbGljZSgwLCAxNik7XG4gIH1cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGZpbmFsIGhrZGYgYmFzZWQgb24gY29tcHV0ZWQgUyB2YWx1ZSwgYW5kIGNvbXB1dGVkIFUgdmFsdWUgYW5kIHRoZSBrZXlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHVzZXJuYW1lIFVzZXJuYW1lLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGFzc3dvcmQgUGFzc3dvcmQuXG4gICAqIEBwYXJhbSB7QmlnSW50ZWdlcn0gc2VydmVyQlZhbHVlIFNlcnZlciBCIHZhbHVlLlxuICAgKiBAcGFyYW0ge0JpZ0ludGVnZXJ9IHNhbHQgR2VuZXJhdGVkIHNhbHQuXG4gICAqIEBwYXJhbSB7bm9kZUNhbGxiYWNrPEJ1ZmZlcj59IGNhbGxiYWNrIENhbGxlZCB3aXRoIChlcnIsIGhrZGZWYWx1ZSlcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldFBhc3N3b3JkQXV0aGVudGljYXRpb25LZXkgPSBmdW5jdGlvbiBnZXRQYXNzd29yZEF1dGhlbnRpY2F0aW9uS2V5KHVzZXJuYW1lLCBwYXNzd29yZCwgc2VydmVyQlZhbHVlLCBzYWx0LCBjYWxsYmFjaykge1xuICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgaWYgKHNlcnZlckJWYWx1ZS5tb2QodGhpcy5OKS5lcXVhbHMoX0JpZ0ludGVnZXJbXCJkZWZhdWx0XCJdLlpFUk8pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0IgY2Fubm90IGJlIHplcm8uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5VVmFsdWUgPSB0aGlzLmNhbGN1bGF0ZVUodGhpcy5sYXJnZUFWYWx1ZSwgc2VydmVyQlZhbHVlKTtcblxuICAgIGlmICh0aGlzLlVWYWx1ZS5lcXVhbHMoX0JpZ0ludGVnZXJbXCJkZWZhdWx0XCJdLlpFUk8pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1UgY2Fubm90IGJlIHplcm8uJyk7XG4gICAgfVxuXG4gICAgdmFyIHVzZXJuYW1lUGFzc3dvcmQgPSBcIlwiICsgdGhpcy5wb29sTmFtZSArIHVzZXJuYW1lICsgXCI6XCIgKyBwYXNzd29yZDtcbiAgICB2YXIgdXNlcm5hbWVQYXNzd29yZEhhc2ggPSB0aGlzLmhhc2godXNlcm5hbWVQYXNzd29yZCk7XG4gICAgdmFyIHhWYWx1ZSA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0odGhpcy5oZXhIYXNoKHRoaXMucGFkSGV4KHNhbHQpICsgdXNlcm5hbWVQYXNzd29yZEhhc2gpLCAxNik7XG4gICAgdGhpcy5jYWxjdWxhdGVTKHhWYWx1ZSwgc2VydmVyQlZhbHVlLCBmdW5jdGlvbiAoZXJyLCBzVmFsdWUpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGhrZGYgPSBfdGhpczQuY29tcHV0ZWhrZGYoX2J1ZmZlci5CdWZmZXIuZnJvbShfdGhpczQucGFkSGV4KHNWYWx1ZSksICdoZXgnKSwgX2J1ZmZlci5CdWZmZXIuZnJvbShfdGhpczQucGFkSGV4KF90aGlzNC5VVmFsdWUudG9TdHJpbmcoMTYpKSwgJ2hleCcpKTtcblxuICAgICAgY2FsbGJhY2sobnVsbCwgaGtkZik7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIFMgdmFsdWUgdXNlZCBpbiBnZXRQYXNzd29yZEF1dGhlbnRpY2F0aW9uS2V5XG4gICAqIEBwYXJhbSB7QmlnSW50ZWdlcn0geFZhbHVlIFNhbHRlZCBwYXNzd29yZCBoYXNoIHZhbHVlLlxuICAgKiBAcGFyYW0ge0JpZ0ludGVnZXJ9IHNlcnZlckJWYWx1ZSBTZXJ2ZXIgQiB2YWx1ZS5cbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8c3RyaW5nPn0gY2FsbGJhY2sgQ2FsbGVkIG9uIHN1Y2Nlc3Mgb3IgZXJyb3IuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5jYWxjdWxhdGVTID0gZnVuY3Rpb24gY2FsY3VsYXRlUyh4VmFsdWUsIHNlcnZlckJWYWx1ZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgIHRoaXMuZy5tb2RQb3coeFZhbHVlLCB0aGlzLk4sIGZ1bmN0aW9uIChlcnIsIGdNb2RQb3dYTikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW50VmFsdWUyID0gc2VydmVyQlZhbHVlLnN1YnRyYWN0KF90aGlzNS5rLm11bHRpcGx5KGdNb2RQb3dYTikpO1xuICAgICAgaW50VmFsdWUyLm1vZFBvdyhfdGhpczUuc21hbGxBVmFsdWUuYWRkKF90aGlzNS5VVmFsdWUubXVsdGlwbHkoeFZhbHVlKSksIF90aGlzNS5OLCBmdW5jdGlvbiAoZXJyMiwgcmVzdWx0KSB7XG4gICAgICAgIGlmIChlcnIyKSB7XG4gICAgICAgICAgY2FsbGJhY2soZXJyMiwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQubW9kKF90aGlzNS5OKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJuIGNvbnN0YW50IG5ld1Bhc3N3b3JkUmVxdWlyZWRDaGFsbGVuZ2VVc2VyQXR0cmlidXRlUHJlZml4XG4gICAqIEByZXR1cm4ge25ld1Bhc3N3b3JkUmVxdWlyZWRDaGFsbGVuZ2VVc2VyQXR0cmlidXRlUHJlZml4fSBjb25zdGFudCBwcmVmaXggdmFsdWVcbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0TmV3UGFzc3dvcmRSZXF1aXJlZENoYWxsZW5nZVVzZXJBdHRyaWJ1dGVQcmVmaXggPSBmdW5jdGlvbiBnZXROZXdQYXNzd29yZFJlcXVpcmVkQ2hhbGxlbmdlVXNlckF0dHJpYnV0ZVByZWZpeCgpIHtcbiAgICByZXR1cm4gbmV3UGFzc3dvcmRSZXF1aXJlZENoYWxsZW5nZVVzZXJBdHRyaWJ1dGVQcmVmaXg7XG4gIH1cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgQmlnSW50ZWdlciAob3IgaGV4IHN0cmluZykgdG8gaGV4IGZvcm1hdCBwYWRkZWQgd2l0aCB6ZXJvZXMgZm9yIGhhc2hpbmdcbiAgICogQHBhcmFtIHtCaWdJbnRlZ2VyfFN0cmluZ30gYmlnSW50IE51bWJlciBvciBzdHJpbmcgdG8gcGFkLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBQYWRkZWQgaGV4IHN0cmluZy5cbiAgICovXG4gIDtcblxuICBfcHJvdG8ucGFkSGV4ID0gZnVuY3Rpb24gcGFkSGV4KGJpZ0ludCkge1xuICAgIHZhciBoYXNoU3RyID0gYmlnSW50LnRvU3RyaW5nKDE2KTtcblxuICAgIGlmIChoYXNoU3RyLmxlbmd0aCAlIDIgPT09IDEpIHtcbiAgICAgIGhhc2hTdHIgPSBcIjBcIiArIGhhc2hTdHI7XG4gICAgfSBlbHNlIGlmICgnODlBQkNERUZhYmNkZWYnLmluZGV4T2YoaGFzaFN0clswXSkgIT09IC0xKSB7XG4gICAgICBoYXNoU3RyID0gXCIwMFwiICsgaGFzaFN0cjtcbiAgICB9XG5cbiAgICByZXR1cm4gaGFzaFN0cjtcbiAgfTtcblxuICByZXR1cm4gQXV0aGVudGljYXRpb25IZWxwZXI7XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gQXV0aGVudGljYXRpb25IZWxwZXI7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcbi8vIEEgc21hbGwgaW1wbGVtZW50YXRpb24gb2YgQmlnSW50ZWdlciBiYXNlZCBvbiBodHRwOi8vd3d3LWNzLXN0dWRlbnRzLnN0YW5mb3JkLmVkdS9+dGp3L2pzYm4vXG4vL1xuLy8gQWxsIHB1YmxpYyBtZXRob2RzIGhhdmUgYmVlbiByZW1vdmVkIGV4Y2VwdCB0aGUgZm9sbG93aW5nOlxuLy8gICBuZXcgQmlnSW50ZWdlcihhLCBiKSAob25seSByYWRpeCAyLCA0LCA4LCAxNiBhbmQgMzIgc3VwcG9ydGVkKVxuLy8gICB0b1N0cmluZyAob25seSByYWRpeCAyLCA0LCA4LCAxNiBhbmQgMzIgc3VwcG9ydGVkKVxuLy8gICBuZWdhdGVcbi8vICAgYWJzXG4vLyAgIGNvbXBhcmVUb1xuLy8gICBiaXRMZW5ndGhcbi8vICAgbW9kXG4vLyAgIGVxdWFsc1xuLy8gICBhZGRcbi8vICAgc3VidHJhY3Rcbi8vICAgbXVsdGlwbHlcbi8vICAgZGl2aWRlXG4vLyAgIG1vZFBvd1xudmFyIF9kZWZhdWx0ID0gQmlnSW50ZWdlcjtcbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDMtMjAwNSAgVG9tIFd1XG4gKiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiAqIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbiAqIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gKiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTLUlTXCIgQU5EIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTLCBJTVBMSUVEIE9SIE9USEVSV0lTRSwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiwgQU5ZXG4gKiBXQVJSQU5UWSBPRiBNRVJDSEFOVEFCSUxJVFkgT1IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuXG4gKlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVE9NIFdVIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIElOQ0lERU5UQUwsXG4gKiBJTkRJUkVDVCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT0YgQU5ZIEtJTkQsIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVJcbiAqIFJFU1VMVElORyBGUk9NIExPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgT1IgTk9UIEFEVklTRUQgT0ZcbiAqIFRIRSBQT1NTSUJJTElUWSBPRiBEQU1BR0UsIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgQVJJU0lORyBPVVRcbiAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SIFBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXG4gKlxuICogSW4gYWRkaXRpb24sIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uIGFwcGxpZXM6XG4gKlxuICogQWxsIHJlZGlzdHJpYnV0aW9ucyBtdXN0IHJldGFpbiBhbiBpbnRhY3QgY29weSBvZiB0aGlzIGNvcHlyaWdodCBub3RpY2VcbiAqIGFuZCBkaXNjbGFpbWVyLlxuICovXG4vLyAocHVibGljKSBDb25zdHJ1Y3RvclxuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0O1xuXG5mdW5jdGlvbiBCaWdJbnRlZ2VyKGEsIGIpIHtcbiAgaWYgKGEgIT0gbnVsbCkgdGhpcy5mcm9tU3RyaW5nKGEsIGIpO1xufSAvLyByZXR1cm4gbmV3LCB1bnNldCBCaWdJbnRlZ2VyXG5cblxuZnVuY3Rpb24gbmJpKCkge1xuICByZXR1cm4gbmV3IEJpZ0ludGVnZXIobnVsbCk7XG59IC8vIEJpdHMgcGVyIGRpZ2l0XG5cblxudmFyIGRiaXRzOyAvLyBKYXZhU2NyaXB0IGVuZ2luZSBhbmFseXNpc1xuXG52YXIgY2FuYXJ5ID0gMHhkZWFkYmVlZmNhZmU7XG52YXIgal9sbSA9IChjYW5hcnkgJiAweGZmZmZmZikgPT0gMHhlZmNhZmU7IC8vIGFtOiBDb21wdXRlIHdfaiArPSAoeCp0aGlzX2kpLCBwcm9wYWdhdGUgY2Fycmllcyxcbi8vIGMgaXMgaW5pdGlhbCBjYXJyeSwgcmV0dXJucyBmaW5hbCBjYXJyeS5cbi8vIGMgPCAzKmR2YWx1ZSwgeCA8IDIqZHZhbHVlLCB0aGlzX2kgPCBkdmFsdWVcbi8vIFdlIG5lZWQgdG8gc2VsZWN0IHRoZSBmYXN0ZXN0IG9uZSB0aGF0IHdvcmtzIGluIHRoaXMgZW52aXJvbm1lbnQuXG4vLyBhbTE6IHVzZSBhIHNpbmdsZSBtdWx0IGFuZCBkaXZpZGUgdG8gZ2V0IHRoZSBoaWdoIGJpdHMsXG4vLyBtYXggZGlnaXQgYml0cyBzaG91bGQgYmUgMjYgYmVjYXVzZVxuLy8gbWF4IGludGVybmFsIHZhbHVlID0gMipkdmFsdWVeMi0yKmR2YWx1ZSAoPCAyXjUzKVxuXG5mdW5jdGlvbiBhbTEoaSwgeCwgdywgaiwgYywgbikge1xuICB3aGlsZSAoLS1uID49IDApIHtcbiAgICB2YXIgdiA9IHggKiB0aGlzW2krK10gKyB3W2pdICsgYztcbiAgICBjID0gTWF0aC5mbG9vcih2IC8gMHg0MDAwMDAwKTtcbiAgICB3W2orK10gPSB2ICYgMHgzZmZmZmZmO1xuICB9XG5cbiAgcmV0dXJuIGM7XG59IC8vIGFtMiBhdm9pZHMgYSBiaWcgbXVsdC1hbmQtZXh0cmFjdCBjb21wbGV0ZWx5LlxuLy8gTWF4IGRpZ2l0IGJpdHMgc2hvdWxkIGJlIDw9IDMwIGJlY2F1c2Ugd2UgZG8gYml0d2lzZSBvcHNcbi8vIG9uIHZhbHVlcyB1cCB0byAyKmhkdmFsdWVeMi1oZHZhbHVlLTEgKDwgMl4zMSlcblxuXG5mdW5jdGlvbiBhbTIoaSwgeCwgdywgaiwgYywgbikge1xuICB2YXIgeGwgPSB4ICYgMHg3ZmZmLFxuICAgICAgeGggPSB4ID4+IDE1O1xuXG4gIHdoaWxlICgtLW4gPj0gMCkge1xuICAgIHZhciBsID0gdGhpc1tpXSAmIDB4N2ZmZjtcbiAgICB2YXIgaCA9IHRoaXNbaSsrXSA+PiAxNTtcbiAgICB2YXIgbSA9IHhoICogbCArIGggKiB4bDtcbiAgICBsID0geGwgKiBsICsgKChtICYgMHg3ZmZmKSA8PCAxNSkgKyB3W2pdICsgKGMgJiAweDNmZmZmZmZmKTtcbiAgICBjID0gKGwgPj4+IDMwKSArIChtID4+PiAxNSkgKyB4aCAqIGggKyAoYyA+Pj4gMzApO1xuICAgIHdbaisrXSA9IGwgJiAweDNmZmZmZmZmO1xuICB9XG5cbiAgcmV0dXJuIGM7XG59IC8vIEFsdGVybmF0ZWx5LCBzZXQgbWF4IGRpZ2l0IGJpdHMgdG8gMjggc2luY2Ugc29tZVxuLy8gYnJvd3NlcnMgc2xvdyBkb3duIHdoZW4gZGVhbGluZyB3aXRoIDMyLWJpdCBudW1iZXJzLlxuXG5cbmZ1bmN0aW9uIGFtMyhpLCB4LCB3LCBqLCBjLCBuKSB7XG4gIHZhciB4bCA9IHggJiAweDNmZmYsXG4gICAgICB4aCA9IHggPj4gMTQ7XG5cbiAgd2hpbGUgKC0tbiA+PSAwKSB7XG4gICAgdmFyIGwgPSB0aGlzW2ldICYgMHgzZmZmO1xuICAgIHZhciBoID0gdGhpc1tpKytdID4+IDE0O1xuICAgIHZhciBtID0geGggKiBsICsgaCAqIHhsO1xuICAgIGwgPSB4bCAqIGwgKyAoKG0gJiAweDNmZmYpIDw8IDE0KSArIHdbal0gKyBjO1xuICAgIGMgPSAobCA+PiAyOCkgKyAobSA+PiAxNCkgKyB4aCAqIGg7XG4gICAgd1tqKytdID0gbCAmIDB4ZmZmZmZmZjtcbiAgfVxuXG4gIHJldHVybiBjO1xufVxuXG52YXIgaW5Ccm93c2VyID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCc7XG5cbmlmIChpbkJyb3dzZXIgJiYgal9sbSAmJiBuYXZpZ2F0b3IuYXBwTmFtZSA9PSAnTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyJykge1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMjtcbiAgZGJpdHMgPSAzMDtcbn0gZWxzZSBpZiAoaW5Ccm93c2VyICYmIGpfbG0gJiYgbmF2aWdhdG9yLmFwcE5hbWUgIT0gJ05ldHNjYXBlJykge1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMTtcbiAgZGJpdHMgPSAyNjtcbn0gZWxzZSB7XG4gIC8vIE1vemlsbGEvTmV0c2NhcGUgc2VlbXMgdG8gcHJlZmVyIGFtM1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMztcbiAgZGJpdHMgPSAyODtcbn1cblxuQmlnSW50ZWdlci5wcm90b3R5cGUuREIgPSBkYml0cztcbkJpZ0ludGVnZXIucHJvdG90eXBlLkRNID0gKDEgPDwgZGJpdHMpIC0gMTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLkRWID0gMSA8PCBkYml0cztcbnZhciBCSV9GUCA9IDUyO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRlYgPSBNYXRoLnBvdygyLCBCSV9GUCk7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5GMSA9IEJJX0ZQIC0gZGJpdHM7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5GMiA9IDIgKiBkYml0cyAtIEJJX0ZQOyAvLyBEaWdpdCBjb252ZXJzaW9uc1xuXG52YXIgQklfUk0gPSAnMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6JztcbnZhciBCSV9SQyA9IG5ldyBBcnJheSgpO1xudmFyIHJyLCB2djtcbnJyID0gJzAnLmNoYXJDb2RlQXQoMCk7XG5cbmZvciAodnYgPSAwOyB2diA8PSA5OyArK3Z2KSB7XG4gIEJJX1JDW3JyKytdID0gdnY7XG59XG5cbnJyID0gJ2EnLmNoYXJDb2RlQXQoMCk7XG5cbmZvciAodnYgPSAxMDsgdnYgPCAzNjsgKyt2dikge1xuICBCSV9SQ1tycisrXSA9IHZ2O1xufVxuXG5yciA9ICdBJy5jaGFyQ29kZUF0KDApO1xuXG5mb3IgKHZ2ID0gMTA7IHZ2IDwgMzY7ICsrdnYpIHtcbiAgQklfUkNbcnIrK10gPSB2djtcbn1cblxuZnVuY3Rpb24gaW50MmNoYXIobikge1xuICByZXR1cm4gQklfUk0uY2hhckF0KG4pO1xufVxuXG5mdW5jdGlvbiBpbnRBdChzLCBpKSB7XG4gIHZhciBjID0gQklfUkNbcy5jaGFyQ29kZUF0KGkpXTtcbiAgcmV0dXJuIGMgPT0gbnVsbCA/IC0xIDogYztcbn0gLy8gKHByb3RlY3RlZCkgY29weSB0aGlzIHRvIHJcblxuXG5mdW5jdGlvbiBibnBDb3B5VG8ocikge1xuICBmb3IgKHZhciBpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICByW2ldID0gdGhpc1tpXTtcbiAgfVxuXG4gIHIudCA9IHRoaXMudDtcbiAgci5zID0gdGhpcy5zO1xufSAvLyAocHJvdGVjdGVkKSBzZXQgZnJvbSBpbnRlZ2VyIHZhbHVlIHgsIC1EViA8PSB4IDwgRFZcblxuXG5mdW5jdGlvbiBibnBGcm9tSW50KHgpIHtcbiAgdGhpcy50ID0gMTtcbiAgdGhpcy5zID0geCA8IDAgPyAtMSA6IDA7XG4gIGlmICh4ID4gMCkgdGhpc1swXSA9IHg7ZWxzZSBpZiAoeCA8IC0xKSB0aGlzWzBdID0geCArIHRoaXMuRFY7ZWxzZSB0aGlzLnQgPSAwO1xufSAvLyByZXR1cm4gYmlnaW50IGluaXRpYWxpemVkIHRvIHZhbHVlXG5cblxuZnVuY3Rpb24gbmJ2KGkpIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgci5mcm9tSW50KGkpO1xuICByZXR1cm4gcjtcbn0gLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gc3RyaW5nIGFuZCByYWRpeFxuXG5cbmZ1bmN0aW9uIGJucEZyb21TdHJpbmcocywgYikge1xuICB2YXIgaztcbiAgaWYgKGIgPT0gMTYpIGsgPSA0O2Vsc2UgaWYgKGIgPT0gOCkgayA9IDM7ZWxzZSBpZiAoYiA9PSAyKSBrID0gMTtlbHNlIGlmIChiID09IDMyKSBrID0gNTtlbHNlIGlmIChiID09IDQpIGsgPSAyO2Vsc2UgdGhyb3cgbmV3IEVycm9yKCdPbmx5IHJhZGl4IDIsIDQsIDgsIDE2LCAzMiBhcmUgc3VwcG9ydGVkJyk7XG4gIHRoaXMudCA9IDA7XG4gIHRoaXMucyA9IDA7XG4gIHZhciBpID0gcy5sZW5ndGgsXG4gICAgICBtaSA9IGZhbHNlLFxuICAgICAgc2ggPSAwO1xuXG4gIHdoaWxlICgtLWkgPj0gMCkge1xuICAgIHZhciB4ID0gaW50QXQocywgaSk7XG5cbiAgICBpZiAoeCA8IDApIHtcbiAgICAgIGlmIChzLmNoYXJBdChpKSA9PSAnLScpIG1pID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIG1pID0gZmFsc2U7XG4gICAgaWYgKHNoID09IDApIHRoaXNbdGhpcy50KytdID0geDtlbHNlIGlmIChzaCArIGsgPiB0aGlzLkRCKSB7XG4gICAgICB0aGlzW3RoaXMudCAtIDFdIHw9ICh4ICYgKDEgPDwgdGhpcy5EQiAtIHNoKSAtIDEpIDw8IHNoO1xuICAgICAgdGhpc1t0aGlzLnQrK10gPSB4ID4+IHRoaXMuREIgLSBzaDtcbiAgICB9IGVsc2UgdGhpc1t0aGlzLnQgLSAxXSB8PSB4IDw8IHNoO1xuICAgIHNoICs9IGs7XG4gICAgaWYgKHNoID49IHRoaXMuREIpIHNoIC09IHRoaXMuREI7XG4gIH1cblxuICB0aGlzLmNsYW1wKCk7XG4gIGlmIChtaSkgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsIHRoaXMpO1xufSAvLyAocHJvdGVjdGVkKSBjbGFtcCBvZmYgZXhjZXNzIGhpZ2ggd29yZHNcblxuXG5mdW5jdGlvbiBibnBDbGFtcCgpIHtcbiAgdmFyIGMgPSB0aGlzLnMgJiB0aGlzLkRNO1xuXG4gIHdoaWxlICh0aGlzLnQgPiAwICYmIHRoaXNbdGhpcy50IC0gMV0gPT0gYykge1xuICAgIC0tdGhpcy50O1xuICB9XG59IC8vIChwdWJsaWMpIHJldHVybiBzdHJpbmcgcmVwcmVzZW50YXRpb24gaW4gZ2l2ZW4gcmFkaXhcblxuXG5mdW5jdGlvbiBiblRvU3RyaW5nKGIpIHtcbiAgaWYgKHRoaXMucyA8IDApIHJldHVybiAnLScgKyB0aGlzLm5lZ2F0ZSgpLnRvU3RyaW5nKGIpO1xuICB2YXIgaztcbiAgaWYgKGIgPT0gMTYpIGsgPSA0O2Vsc2UgaWYgKGIgPT0gOCkgayA9IDM7ZWxzZSBpZiAoYiA9PSAyKSBrID0gMTtlbHNlIGlmIChiID09IDMyKSBrID0gNTtlbHNlIGlmIChiID09IDQpIGsgPSAyO2Vsc2UgdGhyb3cgbmV3IEVycm9yKCdPbmx5IHJhZGl4IDIsIDQsIDgsIDE2LCAzMiBhcmUgc3VwcG9ydGVkJyk7XG4gIHZhciBrbSA9ICgxIDw8IGspIC0gMSxcbiAgICAgIGQsXG4gICAgICBtID0gZmFsc2UsXG4gICAgICByID0gJycsXG4gICAgICBpID0gdGhpcy50O1xuICB2YXIgcCA9IHRoaXMuREIgLSBpICogdGhpcy5EQiAlIGs7XG5cbiAgaWYgKGktLSA+IDApIHtcbiAgICBpZiAocCA8IHRoaXMuREIgJiYgKGQgPSB0aGlzW2ldID4+IHApID4gMCkge1xuICAgICAgbSA9IHRydWU7XG4gICAgICByID0gaW50MmNoYXIoZCk7XG4gICAgfVxuXG4gICAgd2hpbGUgKGkgPj0gMCkge1xuICAgICAgaWYgKHAgPCBrKSB7XG4gICAgICAgIGQgPSAodGhpc1tpXSAmICgxIDw8IHApIC0gMSkgPDwgayAtIHA7XG4gICAgICAgIGQgfD0gdGhpc1stLWldID4+IChwICs9IHRoaXMuREIgLSBrKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGQgPSB0aGlzW2ldID4+IChwIC09IGspICYga207XG5cbiAgICAgICAgaWYgKHAgPD0gMCkge1xuICAgICAgICAgIHAgKz0gdGhpcy5EQjtcbiAgICAgICAgICAtLWk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGQgPiAwKSBtID0gdHJ1ZTtcbiAgICAgIGlmIChtKSByICs9IGludDJjaGFyKGQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtID8gciA6ICcwJztcbn0gLy8gKHB1YmxpYykgLXRoaXNcblxuXG5mdW5jdGlvbiBibk5lZ2F0ZSgpIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsIHIpO1xuICByZXR1cm4gcjtcbn0gLy8gKHB1YmxpYykgfHRoaXN8XG5cblxuZnVuY3Rpb24gYm5BYnMoKSB7XG4gIHJldHVybiB0aGlzLnMgPCAwID8gdGhpcy5uZWdhdGUoKSA6IHRoaXM7XG59IC8vIChwdWJsaWMpIHJldHVybiArIGlmIHRoaXMgPiBhLCAtIGlmIHRoaXMgPCBhLCAwIGlmIGVxdWFsXG5cblxuZnVuY3Rpb24gYm5Db21wYXJlVG8oYSkge1xuICB2YXIgciA9IHRoaXMucyAtIGEucztcbiAgaWYgKHIgIT0gMCkgcmV0dXJuIHI7XG4gIHZhciBpID0gdGhpcy50O1xuICByID0gaSAtIGEudDtcbiAgaWYgKHIgIT0gMCkgcmV0dXJuIHRoaXMucyA8IDAgPyAtciA6IHI7XG5cbiAgd2hpbGUgKC0taSA+PSAwKSB7XG4gICAgaWYgKChyID0gdGhpc1tpXSAtIGFbaV0pICE9IDApIHJldHVybiByO1xuICB9XG5cbiAgcmV0dXJuIDA7XG59IC8vIHJldHVybnMgYml0IGxlbmd0aCBvZiB0aGUgaW50ZWdlciB4XG5cblxuZnVuY3Rpb24gbmJpdHMoeCkge1xuICB2YXIgciA9IDEsXG4gICAgICB0O1xuXG4gIGlmICgodCA9IHggPj4+IDE2KSAhPSAwKSB7XG4gICAgeCA9IHQ7XG4gICAgciArPSAxNjtcbiAgfVxuXG4gIGlmICgodCA9IHggPj4gOCkgIT0gMCkge1xuICAgIHggPSB0O1xuICAgIHIgKz0gODtcbiAgfVxuXG4gIGlmICgodCA9IHggPj4gNCkgIT0gMCkge1xuICAgIHggPSB0O1xuICAgIHIgKz0gNDtcbiAgfVxuXG4gIGlmICgodCA9IHggPj4gMikgIT0gMCkge1xuICAgIHggPSB0O1xuICAgIHIgKz0gMjtcbiAgfVxuXG4gIGlmICgodCA9IHggPj4gMSkgIT0gMCkge1xuICAgIHggPSB0O1xuICAgIHIgKz0gMTtcbiAgfVxuXG4gIHJldHVybiByO1xufSAvLyAocHVibGljKSByZXR1cm4gdGhlIG51bWJlciBvZiBiaXRzIGluIFwidGhpc1wiXG5cblxuZnVuY3Rpb24gYm5CaXRMZW5ndGgoKSB7XG4gIGlmICh0aGlzLnQgPD0gMCkgcmV0dXJuIDA7XG4gIHJldHVybiB0aGlzLkRCICogKHRoaXMudCAtIDEpICsgbmJpdHModGhpc1t0aGlzLnQgLSAxXSBeIHRoaXMucyAmIHRoaXMuRE0pO1xufSAvLyAocHJvdGVjdGVkKSByID0gdGhpcyA8PCBuKkRCXG5cblxuZnVuY3Rpb24gYm5wRExTaGlmdFRvKG4sIHIpIHtcbiAgdmFyIGk7XG5cbiAgZm9yIChpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICByW2kgKyBuXSA9IHRoaXNbaV07XG4gIH1cblxuICBmb3IgKGkgPSBuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICByW2ldID0gMDtcbiAgfVxuXG4gIHIudCA9IHRoaXMudCArIG47XG4gIHIucyA9IHRoaXMucztcbn0gLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPj4gbipEQlxuXG5cbmZ1bmN0aW9uIGJucERSU2hpZnRUbyhuLCByKSB7XG4gIGZvciAodmFyIGkgPSBuOyBpIDwgdGhpcy50OyArK2kpIHtcbiAgICByW2kgLSBuXSA9IHRoaXNbaV07XG4gIH1cblxuICByLnQgPSBNYXRoLm1heCh0aGlzLnQgLSBuLCAwKTtcbiAgci5zID0gdGhpcy5zO1xufSAvLyAocHJvdGVjdGVkKSByID0gdGhpcyA8PCBuXG5cblxuZnVuY3Rpb24gYm5wTFNoaWZ0VG8obiwgcikge1xuICB2YXIgYnMgPSBuICUgdGhpcy5EQjtcbiAgdmFyIGNicyA9IHRoaXMuREIgLSBicztcbiAgdmFyIGJtID0gKDEgPDwgY2JzKSAtIDE7XG4gIHZhciBkcyA9IE1hdGguZmxvb3IobiAvIHRoaXMuREIpLFxuICAgICAgYyA9IHRoaXMucyA8PCBicyAmIHRoaXMuRE0sXG4gICAgICBpO1xuXG4gIGZvciAoaSA9IHRoaXMudCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgcltpICsgZHMgKyAxXSA9IHRoaXNbaV0gPj4gY2JzIHwgYztcbiAgICBjID0gKHRoaXNbaV0gJiBibSkgPDwgYnM7XG4gIH1cblxuICBmb3IgKGkgPSBkcyAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgcltpXSA9IDA7XG4gIH1cblxuICByW2RzXSA9IGM7XG4gIHIudCA9IHRoaXMudCArIGRzICsgMTtcbiAgci5zID0gdGhpcy5zO1xuICByLmNsYW1wKCk7XG59IC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzID4+IG5cblxuXG5mdW5jdGlvbiBibnBSU2hpZnRUbyhuLCByKSB7XG4gIHIucyA9IHRoaXMucztcbiAgdmFyIGRzID0gTWF0aC5mbG9vcihuIC8gdGhpcy5EQik7XG5cbiAgaWYgKGRzID49IHRoaXMudCkge1xuICAgIHIudCA9IDA7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGJzID0gbiAlIHRoaXMuREI7XG4gIHZhciBjYnMgPSB0aGlzLkRCIC0gYnM7XG4gIHZhciBibSA9ICgxIDw8IGJzKSAtIDE7XG4gIHJbMF0gPSB0aGlzW2RzXSA+PiBicztcblxuICBmb3IgKHZhciBpID0gZHMgKyAxOyBpIDwgdGhpcy50OyArK2kpIHtcbiAgICByW2kgLSBkcyAtIDFdIHw9ICh0aGlzW2ldICYgYm0pIDw8IGNicztcbiAgICByW2kgLSBkc10gPSB0aGlzW2ldID4+IGJzO1xuICB9XG5cbiAgaWYgKGJzID4gMCkgclt0aGlzLnQgLSBkcyAtIDFdIHw9ICh0aGlzLnMgJiBibSkgPDwgY2JzO1xuICByLnQgPSB0aGlzLnQgLSBkcztcbiAgci5jbGFtcCgpO1xufSAvLyAocHJvdGVjdGVkKSByID0gdGhpcyAtIGFcblxuXG5mdW5jdGlvbiBibnBTdWJUbyhhLCByKSB7XG4gIHZhciBpID0gMCxcbiAgICAgIGMgPSAwLFxuICAgICAgbSA9IE1hdGgubWluKGEudCwgdGhpcy50KTtcblxuICB3aGlsZSAoaSA8IG0pIHtcbiAgICBjICs9IHRoaXNbaV0gLSBhW2ldO1xuICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgIGMgPj49IHRoaXMuREI7XG4gIH1cblxuICBpZiAoYS50IDwgdGhpcy50KSB7XG4gICAgYyAtPSBhLnM7XG5cbiAgICB3aGlsZSAoaSA8IHRoaXMudCkge1xuICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICBjID4+PSB0aGlzLkRCO1xuICAgIH1cblxuICAgIGMgKz0gdGhpcy5zO1xuICB9IGVsc2Uge1xuICAgIGMgKz0gdGhpcy5zO1xuXG4gICAgd2hpbGUgKGkgPCBhLnQpIHtcbiAgICAgIGMgLT0gYVtpXTtcbiAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICB9XG5cbiAgICBjIC09IGEucztcbiAgfVxuXG4gIHIucyA9IGMgPCAwID8gLTEgOiAwO1xuICBpZiAoYyA8IC0xKSByW2krK10gPSB0aGlzLkRWICsgYztlbHNlIGlmIChjID4gMCkgcltpKytdID0gYztcbiAgci50ID0gaTtcbiAgci5jbGFtcCgpO1xufSAvLyAocHJvdGVjdGVkKSByID0gdGhpcyAqIGEsIHIgIT0gdGhpcyxhIChIQUMgMTQuMTIpXG4vLyBcInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG5cblxuZnVuY3Rpb24gYm5wTXVsdGlwbHlUbyhhLCByKSB7XG4gIHZhciB4ID0gdGhpcy5hYnMoKSxcbiAgICAgIHkgPSBhLmFicygpO1xuICB2YXIgaSA9IHgudDtcbiAgci50ID0gaSArIHkudDtcblxuICB3aGlsZSAoLS1pID49IDApIHtcbiAgICByW2ldID0gMDtcbiAgfVxuXG4gIGZvciAoaSA9IDA7IGkgPCB5LnQ7ICsraSkge1xuICAgIHJbaSArIHgudF0gPSB4LmFtKDAsIHlbaV0sIHIsIGksIDAsIHgudCk7XG4gIH1cblxuICByLnMgPSAwO1xuICByLmNsYW1wKCk7XG4gIGlmICh0aGlzLnMgIT0gYS5zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ociwgcik7XG59IC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzXjIsIHIgIT0gdGhpcyAoSEFDIDE0LjE2KVxuXG5cbmZ1bmN0aW9uIGJucFNxdWFyZVRvKHIpIHtcbiAgdmFyIHggPSB0aGlzLmFicygpO1xuICB2YXIgaSA9IHIudCA9IDIgKiB4LnQ7XG5cbiAgd2hpbGUgKC0taSA+PSAwKSB7XG4gICAgcltpXSA9IDA7XG4gIH1cblxuICBmb3IgKGkgPSAwOyBpIDwgeC50IC0gMTsgKytpKSB7XG4gICAgdmFyIGMgPSB4LmFtKGksIHhbaV0sIHIsIDIgKiBpLCAwLCAxKTtcblxuICAgIGlmICgocltpICsgeC50XSArPSB4LmFtKGkgKyAxLCAyICogeFtpXSwgciwgMiAqIGkgKyAxLCBjLCB4LnQgLSBpIC0gMSkpID49IHguRFYpIHtcbiAgICAgIHJbaSArIHgudF0gLT0geC5EVjtcbiAgICAgIHJbaSArIHgudCArIDFdID0gMTtcbiAgICB9XG4gIH1cblxuICBpZiAoci50ID4gMCkgcltyLnQgLSAxXSArPSB4LmFtKGksIHhbaV0sIHIsIDIgKiBpLCAwLCAxKTtcbiAgci5zID0gMDtcbiAgci5jbGFtcCgpO1xufSAvLyAocHJvdGVjdGVkKSBkaXZpZGUgdGhpcyBieSBtLCBxdW90aWVudCBhbmQgcmVtYWluZGVyIHRvIHEsIHIgKEhBQyAxNC4yMClcbi8vIHIgIT0gcSwgdGhpcyAhPSBtLiAgcSBvciByIG1heSBiZSBudWxsLlxuXG5cbmZ1bmN0aW9uIGJucERpdlJlbVRvKG0sIHEsIHIpIHtcbiAgdmFyIHBtID0gbS5hYnMoKTtcbiAgaWYgKHBtLnQgPD0gMCkgcmV0dXJuO1xuICB2YXIgcHQgPSB0aGlzLmFicygpO1xuXG4gIGlmIChwdC50IDwgcG0udCkge1xuICAgIGlmIChxICE9IG51bGwpIHEuZnJvbUludCgwKTtcbiAgICBpZiAociAhPSBudWxsKSB0aGlzLmNvcHlUbyhyKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAociA9PSBudWxsKSByID0gbmJpKCk7XG4gIHZhciB5ID0gbmJpKCksXG4gICAgICB0cyA9IHRoaXMucyxcbiAgICAgIG1zID0gbS5zO1xuICB2YXIgbnNoID0gdGhpcy5EQiAtIG5iaXRzKHBtW3BtLnQgLSAxXSk7IC8vIG5vcm1hbGl6ZSBtb2R1bHVzXG5cbiAgaWYgKG5zaCA+IDApIHtcbiAgICBwbS5sU2hpZnRUbyhuc2gsIHkpO1xuICAgIHB0LmxTaGlmdFRvKG5zaCwgcik7XG4gIH0gZWxzZSB7XG4gICAgcG0uY29weVRvKHkpO1xuICAgIHB0LmNvcHlUbyhyKTtcbiAgfVxuXG4gIHZhciB5cyA9IHkudDtcbiAgdmFyIHkwID0geVt5cyAtIDFdO1xuICBpZiAoeTAgPT0gMCkgcmV0dXJuO1xuICB2YXIgeXQgPSB5MCAqICgxIDw8IHRoaXMuRjEpICsgKHlzID4gMSA/IHlbeXMgLSAyXSA+PiB0aGlzLkYyIDogMCk7XG4gIHZhciBkMSA9IHRoaXMuRlYgLyB5dCxcbiAgICAgIGQyID0gKDEgPDwgdGhpcy5GMSkgLyB5dCxcbiAgICAgIGUgPSAxIDw8IHRoaXMuRjI7XG4gIHZhciBpID0gci50LFxuICAgICAgaiA9IGkgLSB5cyxcbiAgICAgIHQgPSBxID09IG51bGwgPyBuYmkoKSA6IHE7XG4gIHkuZGxTaGlmdFRvKGosIHQpO1xuXG4gIGlmIChyLmNvbXBhcmVUbyh0KSA+PSAwKSB7XG4gICAgcltyLnQrK10gPSAxO1xuICAgIHIuc3ViVG8odCwgcik7XG4gIH1cblxuICBCaWdJbnRlZ2VyLk9ORS5kbFNoaWZ0VG8oeXMsIHQpO1xuICB0LnN1YlRvKHksIHkpOyAvLyBcIm5lZ2F0aXZlXCIgeSBzbyB3ZSBjYW4gcmVwbGFjZSBzdWIgd2l0aCBhbSBsYXRlclxuXG4gIHdoaWxlICh5LnQgPCB5cykge1xuICAgIHlbeS50KytdID0gMDtcbiAgfVxuXG4gIHdoaWxlICgtLWogPj0gMCkge1xuICAgIC8vIEVzdGltYXRlIHF1b3RpZW50IGRpZ2l0XG4gICAgdmFyIHFkID0gclstLWldID09IHkwID8gdGhpcy5ETSA6IE1hdGguZmxvb3IocltpXSAqIGQxICsgKHJbaSAtIDFdICsgZSkgKiBkMik7XG5cbiAgICBpZiAoKHJbaV0gKz0geS5hbSgwLCBxZCwgciwgaiwgMCwgeXMpKSA8IHFkKSB7XG4gICAgICAvLyBUcnkgaXQgb3V0XG4gICAgICB5LmRsU2hpZnRUbyhqLCB0KTtcbiAgICAgIHIuc3ViVG8odCwgcik7XG5cbiAgICAgIHdoaWxlIChyW2ldIDwgLS1xZCkge1xuICAgICAgICByLnN1YlRvKHQsIHIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChxICE9IG51bGwpIHtcbiAgICByLmRyU2hpZnRUbyh5cywgcSk7XG4gICAgaWYgKHRzICE9IG1zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ocSwgcSk7XG4gIH1cblxuICByLnQgPSB5cztcbiAgci5jbGFtcCgpO1xuICBpZiAobnNoID4gMCkgci5yU2hpZnRUbyhuc2gsIHIpOyAvLyBEZW5vcm1hbGl6ZSByZW1haW5kZXJcblxuICBpZiAodHMgPCAwKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ociwgcik7XG59IC8vIChwdWJsaWMpIHRoaXMgbW9kIGFcblxuXG5mdW5jdGlvbiBibk1vZChhKSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHRoaXMuYWJzKCkuZGl2UmVtVG8oYSwgbnVsbCwgcik7XG4gIGlmICh0aGlzLnMgPCAwICYmIHIuY29tcGFyZVRvKEJpZ0ludGVnZXIuWkVSTykgPiAwKSBhLnN1YlRvKHIsIHIpO1xuICByZXR1cm4gcjtcbn0gLy8gKHByb3RlY3RlZCkgcmV0dXJuIFwiLTEvdGhpcyAlIDJeREJcIjsgdXNlZnVsIGZvciBNb250LiByZWR1Y3Rpb25cbi8vIGp1c3RpZmljYXRpb246XG4vLyAgICAgICAgIHh5ID09IDEgKG1vZCBtKVxuLy8gICAgICAgICB4eSA9ICAxK2ttXG4vLyAgIHh5KDIteHkpID0gKDEra20pKDEta20pXG4vLyB4W3koMi14eSldID0gMS1rXjJtXjJcbi8vIHhbeSgyLXh5KV0gPT0gMSAobW9kIG1eMilcbi8vIGlmIHkgaXMgMS94IG1vZCBtLCB0aGVuIHkoMi14eSkgaXMgMS94IG1vZCBtXjJcbi8vIHNob3VsZCByZWR1Y2UgeCBhbmQgeSgyLXh5KSBieSBtXjIgYXQgZWFjaCBzdGVwIHRvIGtlZXAgc2l6ZSBib3VuZGVkLlxuLy8gSlMgbXVsdGlwbHkgXCJvdmVyZmxvd3NcIiBkaWZmZXJlbnRseSBmcm9tIEMvQysrLCBzbyBjYXJlIGlzIG5lZWRlZCBoZXJlLlxuXG5cbmZ1bmN0aW9uIGJucEludkRpZ2l0KCkge1xuICBpZiAodGhpcy50IDwgMSkgcmV0dXJuIDA7XG4gIHZhciB4ID0gdGhpc1swXTtcbiAgaWYgKCh4ICYgMSkgPT0gMCkgcmV0dXJuIDA7XG4gIHZhciB5ID0geCAmIDM7IC8vIHkgPT0gMS94IG1vZCAyXjJcblxuICB5ID0geSAqICgyIC0gKHggJiAweGYpICogeSkgJiAweGY7IC8vIHkgPT0gMS94IG1vZCAyXjRcblxuICB5ID0geSAqICgyIC0gKHggJiAweGZmKSAqIHkpICYgMHhmZjsgLy8geSA9PSAxL3ggbW9kIDJeOFxuXG4gIHkgPSB5ICogKDIgLSAoKHggJiAweGZmZmYpICogeSAmIDB4ZmZmZikpICYgMHhmZmZmOyAvLyB5ID09IDEveCBtb2QgMl4xNlxuICAvLyBsYXN0IHN0ZXAgLSBjYWxjdWxhdGUgaW52ZXJzZSBtb2QgRFYgZGlyZWN0bHk7XG4gIC8vIGFzc3VtZXMgMTYgPCBEQiA8PSAzMiBhbmQgYXNzdW1lcyBhYmlsaXR5IHRvIGhhbmRsZSA0OC1iaXQgaW50c1xuXG4gIHkgPSB5ICogKDIgLSB4ICogeSAlIHRoaXMuRFYpICUgdGhpcy5EVjsgLy8geSA9PSAxL3ggbW9kIDJeZGJpdHNcbiAgLy8gd2UgcmVhbGx5IHdhbnQgdGhlIG5lZ2F0aXZlIGludmVyc2UsIGFuZCAtRFYgPCB5IDwgRFZcblxuICByZXR1cm4geSA+IDAgPyB0aGlzLkRWIC0geSA6IC15O1xufVxuXG5mdW5jdGlvbiBibkVxdWFscyhhKSB7XG4gIHJldHVybiB0aGlzLmNvbXBhcmVUbyhhKSA9PSAwO1xufSAvLyAocHJvdGVjdGVkKSByID0gdGhpcyArIGFcblxuXG5mdW5jdGlvbiBibnBBZGRUbyhhLCByKSB7XG4gIHZhciBpID0gMCxcbiAgICAgIGMgPSAwLFxuICAgICAgbSA9IE1hdGgubWluKGEudCwgdGhpcy50KTtcblxuICB3aGlsZSAoaSA8IG0pIHtcbiAgICBjICs9IHRoaXNbaV0gKyBhW2ldO1xuICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgIGMgPj49IHRoaXMuREI7XG4gIH1cblxuICBpZiAoYS50IDwgdGhpcy50KSB7XG4gICAgYyArPSBhLnM7XG5cbiAgICB3aGlsZSAoaSA8IHRoaXMudCkge1xuICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICBjID4+PSB0aGlzLkRCO1xuICAgIH1cblxuICAgIGMgKz0gdGhpcy5zO1xuICB9IGVsc2Uge1xuICAgIGMgKz0gdGhpcy5zO1xuXG4gICAgd2hpbGUgKGkgPCBhLnQpIHtcbiAgICAgIGMgKz0gYVtpXTtcbiAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICB9XG5cbiAgICBjICs9IGEucztcbiAgfVxuXG4gIHIucyA9IGMgPCAwID8gLTEgOiAwO1xuICBpZiAoYyA+IDApIHJbaSsrXSA9IGM7ZWxzZSBpZiAoYyA8IC0xKSByW2krK10gPSB0aGlzLkRWICsgYztcbiAgci50ID0gaTtcbiAgci5jbGFtcCgpO1xufSAvLyAocHVibGljKSB0aGlzICsgYVxuXG5cbmZ1bmN0aW9uIGJuQWRkKGEpIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgdGhpcy5hZGRUbyhhLCByKTtcbiAgcmV0dXJuIHI7XG59IC8vIChwdWJsaWMpIHRoaXMgLSBhXG5cblxuZnVuY3Rpb24gYm5TdWJ0cmFjdChhKSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHRoaXMuc3ViVG8oYSwgcik7XG4gIHJldHVybiByO1xufSAvLyAocHVibGljKSB0aGlzICogYVxuXG5cbmZ1bmN0aW9uIGJuTXVsdGlwbHkoYSkge1xuICB2YXIgciA9IG5iaSgpO1xuICB0aGlzLm11bHRpcGx5VG8oYSwgcik7XG4gIHJldHVybiByO1xufSAvLyAocHVibGljKSB0aGlzIC8gYVxuXG5cbmZ1bmN0aW9uIGJuRGl2aWRlKGEpIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgdGhpcy5kaXZSZW1UbyhhLCByLCBudWxsKTtcbiAgcmV0dXJuIHI7XG59IC8vIE1vbnRnb21lcnkgcmVkdWN0aW9uXG5cblxuZnVuY3Rpb24gTW9udGdvbWVyeShtKSB7XG4gIHRoaXMubSA9IG07XG4gIHRoaXMubXAgPSBtLmludkRpZ2l0KCk7XG4gIHRoaXMubXBsID0gdGhpcy5tcCAmIDB4N2ZmZjtcbiAgdGhpcy5tcGggPSB0aGlzLm1wID4+IDE1O1xuICB0aGlzLnVtID0gKDEgPDwgbS5EQiAtIDE1KSAtIDE7XG4gIHRoaXMubXQyID0gMiAqIG0udDtcbn0gLy8geFIgbW9kIG1cblxuXG5mdW5jdGlvbiBtb250Q29udmVydCh4KSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHguYWJzKCkuZGxTaGlmdFRvKHRoaXMubS50LCByKTtcbiAgci5kaXZSZW1Ubyh0aGlzLm0sIG51bGwsIHIpO1xuICBpZiAoeC5zIDwgMCAmJiByLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLlpFUk8pID4gMCkgdGhpcy5tLnN1YlRvKHIsIHIpO1xuICByZXR1cm4gcjtcbn0gLy8geC9SIG1vZCBtXG5cblxuZnVuY3Rpb24gbW9udFJldmVydCh4KSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHguY29weVRvKHIpO1xuICB0aGlzLnJlZHVjZShyKTtcbiAgcmV0dXJuIHI7XG59IC8vIHggPSB4L1IgbW9kIG0gKEhBQyAxNC4zMilcblxuXG5mdW5jdGlvbiBtb250UmVkdWNlKHgpIHtcbiAgd2hpbGUgKHgudCA8PSB0aGlzLm10Mikge1xuICAgIC8vIHBhZCB4IHNvIGFtIGhhcyBlbm91Z2ggcm9vbSBsYXRlclxuICAgIHhbeC50KytdID0gMDtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tLnQ7ICsraSkge1xuICAgIC8vIGZhc3RlciB3YXkgb2YgY2FsY3VsYXRpbmcgdTAgPSB4W2ldKm1wIG1vZCBEVlxuICAgIHZhciBqID0geFtpXSAmIDB4N2ZmZjtcbiAgICB2YXIgdTAgPSBqICogdGhpcy5tcGwgKyAoKGogKiB0aGlzLm1waCArICh4W2ldID4+IDE1KSAqIHRoaXMubXBsICYgdGhpcy51bSkgPDwgMTUpICYgeC5ETTsgLy8gdXNlIGFtIHRvIGNvbWJpbmUgdGhlIG11bHRpcGx5LXNoaWZ0LWFkZCBpbnRvIG9uZSBjYWxsXG5cbiAgICBqID0gaSArIHRoaXMubS50O1xuICAgIHhbal0gKz0gdGhpcy5tLmFtKDAsIHUwLCB4LCBpLCAwLCB0aGlzLm0udCk7IC8vIHByb3BhZ2F0ZSBjYXJyeVxuXG4gICAgd2hpbGUgKHhbal0gPj0geC5EVikge1xuICAgICAgeFtqXSAtPSB4LkRWO1xuICAgICAgeFsrK2pdKys7XG4gICAgfVxuICB9XG5cbiAgeC5jbGFtcCgpO1xuICB4LmRyU2hpZnRUbyh0aGlzLm0udCwgeCk7XG4gIGlmICh4LmNvbXBhcmVUbyh0aGlzLm0pID49IDApIHguc3ViVG8odGhpcy5tLCB4KTtcbn0gLy8gciA9IFwieF4yL1IgbW9kIG1cIjsgeCAhPSByXG5cblxuZnVuY3Rpb24gbW9udFNxclRvKHgsIHIpIHtcbiAgeC5zcXVhcmVUbyhyKTtcbiAgdGhpcy5yZWR1Y2Uocik7XG59IC8vIHIgPSBcInh5L1IgbW9kIG1cIjsgeCx5ICE9IHJcblxuXG5mdW5jdGlvbiBtb250TXVsVG8oeCwgeSwgcikge1xuICB4Lm11bHRpcGx5VG8oeSwgcik7XG4gIHRoaXMucmVkdWNlKHIpO1xufVxuXG5Nb250Z29tZXJ5LnByb3RvdHlwZS5jb252ZXJ0ID0gbW9udENvbnZlcnQ7XG5Nb250Z29tZXJ5LnByb3RvdHlwZS5yZXZlcnQgPSBtb250UmV2ZXJ0O1xuTW9udGdvbWVyeS5wcm90b3R5cGUucmVkdWNlID0gbW9udFJlZHVjZTtcbk1vbnRnb21lcnkucHJvdG90eXBlLm11bFRvID0gbW9udE11bFRvO1xuTW9udGdvbWVyeS5wcm90b3R5cGUuc3FyVG8gPSBtb250U3FyVG87IC8vIChwdWJsaWMpIHRoaXNeZSAlIG0gKEhBQyAxNC44NSlcblxuZnVuY3Rpb24gYm5Nb2RQb3coZSwgbSwgY2FsbGJhY2spIHtcbiAgdmFyIGkgPSBlLmJpdExlbmd0aCgpLFxuICAgICAgayxcbiAgICAgIHIgPSBuYnYoMSksXG4gICAgICB6ID0gbmV3IE1vbnRnb21lcnkobSk7XG4gIGlmIChpIDw9IDApIHJldHVybiByO2Vsc2UgaWYgKGkgPCAxOCkgayA9IDE7ZWxzZSBpZiAoaSA8IDQ4KSBrID0gMztlbHNlIGlmIChpIDwgMTQ0KSBrID0gNDtlbHNlIGlmIChpIDwgNzY4KSBrID0gNTtlbHNlIGsgPSA2OyAvLyBwcmVjb21wdXRhdGlvblxuXG4gIHZhciBnID0gbmV3IEFycmF5KCksXG4gICAgICBuID0gMyxcbiAgICAgIGsxID0gayAtIDEsXG4gICAgICBrbSA9ICgxIDw8IGspIC0gMTtcbiAgZ1sxXSA9IHouY29udmVydCh0aGlzKTtcblxuICBpZiAoayA+IDEpIHtcbiAgICB2YXIgZzIgPSBuYmkoKTtcbiAgICB6LnNxclRvKGdbMV0sIGcyKTtcblxuICAgIHdoaWxlIChuIDw9IGttKSB7XG4gICAgICBnW25dID0gbmJpKCk7XG4gICAgICB6Lm11bFRvKGcyLCBnW24gLSAyXSwgZ1tuXSk7XG4gICAgICBuICs9IDI7XG4gICAgfVxuICB9XG5cbiAgdmFyIGogPSBlLnQgLSAxLFxuICAgICAgdyxcbiAgICAgIGlzMSA9IHRydWUsXG4gICAgICByMiA9IG5iaSgpLFxuICAgICAgdDtcbiAgaSA9IG5iaXRzKGVbal0pIC0gMTtcblxuICB3aGlsZSAoaiA+PSAwKSB7XG4gICAgaWYgKGkgPj0gazEpIHcgPSBlW2pdID4+IGkgLSBrMSAmIGttO2Vsc2Uge1xuICAgICAgdyA9IChlW2pdICYgKDEgPDwgaSArIDEpIC0gMSkgPDwgazEgLSBpO1xuICAgICAgaWYgKGogPiAwKSB3IHw9IGVbaiAtIDFdID4+IHRoaXMuREIgKyBpIC0gazE7XG4gICAgfVxuICAgIG4gPSBrO1xuXG4gICAgd2hpbGUgKCh3ICYgMSkgPT0gMCkge1xuICAgICAgdyA+Pj0gMTtcbiAgICAgIC0tbjtcbiAgICB9XG5cbiAgICBpZiAoKGkgLT0gbikgPCAwKSB7XG4gICAgICBpICs9IHRoaXMuREI7XG4gICAgICAtLWo7XG4gICAgfVxuXG4gICAgaWYgKGlzMSkge1xuICAgICAgLy8gcmV0ID09IDEsIGRvbid0IGJvdGhlciBzcXVhcmluZyBvciBtdWx0aXBseWluZyBpdFxuICAgICAgZ1t3XS5jb3B5VG8ocik7XG4gICAgICBpczEgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2hpbGUgKG4gPiAxKSB7XG4gICAgICAgIHouc3FyVG8ociwgcjIpO1xuICAgICAgICB6LnNxclRvKHIyLCByKTtcbiAgICAgICAgbiAtPSAyO1xuICAgICAgfVxuXG4gICAgICBpZiAobiA+IDApIHouc3FyVG8ociwgcjIpO2Vsc2Uge1xuICAgICAgICB0ID0gcjtcbiAgICAgICAgciA9IHIyO1xuICAgICAgICByMiA9IHQ7XG4gICAgICB9XG4gICAgICB6Lm11bFRvKHIyLCBnW3ddLCByKTtcbiAgICB9XG5cbiAgICB3aGlsZSAoaiA+PSAwICYmIChlW2pdICYgMSA8PCBpKSA9PSAwKSB7XG4gICAgICB6LnNxclRvKHIsIHIyKTtcbiAgICAgIHQgPSByO1xuICAgICAgciA9IHIyO1xuICAgICAgcjIgPSB0O1xuXG4gICAgICBpZiAoLS1pIDwgMCkge1xuICAgICAgICBpID0gdGhpcy5EQiAtIDE7XG4gICAgICAgIC0tajtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gei5yZXZlcnQocik7XG4gIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gIHJldHVybiByZXN1bHQ7XG59IC8vIHByb3RlY3RlZFxuXG5cbkJpZ0ludGVnZXIucHJvdG90eXBlLmNvcHlUbyA9IGJucENvcHlUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21JbnQgPSBibnBGcm9tSW50O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVN0cmluZyA9IGJucEZyb21TdHJpbmc7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jbGFtcCA9IGJucENsYW1wO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGxTaGlmdFRvID0gYm5wRExTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZHJTaGlmdFRvID0gYm5wRFJTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubFNoaWZ0VG8gPSBibnBMU2hpZnRUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLnJTaGlmdFRvID0gYm5wUlNoaWZ0VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zdWJUbyA9IGJucFN1YlRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlUbyA9IGJucE11bHRpcGx5VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zcXVhcmVUbyA9IGJucFNxdWFyZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2UmVtVG8gPSBibnBEaXZSZW1UbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmludkRpZ2l0ID0gYm5wSW52RGlnaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGRUbyA9IGJucEFkZFRvOyAvLyBwdWJsaWNcblxuQmlnSW50ZWdlci5wcm90b3R5cGUudG9TdHJpbmcgPSBiblRvU3RyaW5nO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubmVnYXRlID0gYm5OZWdhdGU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hYnMgPSBibkFicztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IGJuQ29tcGFyZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYml0TGVuZ3RoID0gYm5CaXRMZW5ndGg7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2QgPSBibk1vZDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmVxdWFscyA9IGJuRXF1YWxzO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYWRkID0gYm5BZGQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGJuU3VidHJhY3Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseSA9IGJuTXVsdGlwbHk7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGUgPSBibkRpdmlkZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvdyA9IGJuTW9kUG93OyAvLyBcImNvbnN0YW50c1wiXG5cbkJpZ0ludGVnZXIuWkVSTyA9IG5idigwKTtcbkJpZ0ludGVnZXIuT05FID0gbmJ2KDEpOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfVXNlckFnZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Vc2VyQWdlbnRcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuLyoqIEBjbGFzcyAqL1xudmFyIENsaWVudCA9XG4vKiNfX1BVUkVfXyovXG5mdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IEFXUyBDb2duaXRvIElkZW50aXR5IFByb3ZpZGVyIGNsaWVudCBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlZ2lvbiBBV1MgcmVnaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbmRwb2ludCBlbmRwb2ludFxuICAgKi9cbiAgZnVuY3Rpb24gQ2xpZW50KHJlZ2lvbiwgZW5kcG9pbnQpIHtcbiAgICB0aGlzLmVuZHBvaW50ID0gZW5kcG9pbnQgfHwgXCJodHRwczovL2NvZ25pdG8taWRwLlwiICsgcmVnaW9uICsgXCIuYW1hem9uYXdzLmNvbS9cIjtcbiAgICB0aGlzLnVzZXJBZ2VudCA9IF9Vc2VyQWdlbnRbXCJkZWZhdWx0XCJdLnByb3RvdHlwZS51c2VyQWdlbnQgfHwgJ2F3cy1hbXBsaWZ5LzAuMS54IGpzJztcbiAgfVxuICAvKipcbiAgICogTWFrZXMgYW4gdW5hdXRoZW50aWNhdGVkIHJlcXVlc3Qgb24gQVdTIENvZ25pdG8gSWRlbnRpdHkgUHJvdmlkZXIgQVBJXG4gICAqIHVzaW5nIGZldGNoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcGVyYXRpb24gQVBJIG9wZXJhdGlvblxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIElucHV0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgY2FsbGVkIHdoZW4gYSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG5cblxuICB2YXIgX3Byb3RvID0gQ2xpZW50LnByb3RvdHlwZTtcblxuICBfcHJvdG8ucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3Qob3BlcmF0aW9uLCBwYXJhbXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhlYWRlcnMgPSB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtYW16LWpzb24tMS4xJyxcbiAgICAgICdYLUFtei1UYXJnZXQnOiBcIkFXU0NvZ25pdG9JZGVudGl0eVByb3ZpZGVyU2VydmljZS5cIiArIG9wZXJhdGlvbixcbiAgICAgICdYLUFtei1Vc2VyLUFnZW50JzogdGhpcy51c2VyQWdlbnRcbiAgICB9O1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgY2FjaGU6ICduby1jYWNoZScsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJhbXMpXG4gICAgfTtcbiAgICB2YXIgcmVzcG9uc2U7XG4gICAgdmFyIHJlc3BvbnNlSnNvbkRhdGE7XG4gICAgZmV0Y2godGhpcy5lbmRwb2ludCwgb3B0aW9ucykudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgcmVzcG9uc2UgPSByZXNwO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgLy8gSWYgZXJyb3IgaGFwcGVucyBoZXJlLCB0aGUgcmVxdWVzdCBmYWlsZWRcbiAgICAgIC8vIGlmIGl0IGlzIFR5cGVFcnJvciB0aHJvdyBuZXR3b3JrIGVycm9yXG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTmV0d29yayBlcnJvcicpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgcmV0dXJuIHJlc3AuanNvbigpW1wiY2F0Y2hcIl0oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9KTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAvLyByZXR1cm4gcGFyc2VkIGJvZHkgc3RyZWFtXG4gICAgICBpZiAocmVzcG9uc2Uub2spIHJldHVybiBjYWxsYmFjayhudWxsLCBkYXRhKTtcbiAgICAgIHJlc3BvbnNlSnNvbkRhdGEgPSBkYXRhOyAvLyBUYWtlbiBmcm9tIGF3cy1zZGstanMvbGliL3Byb3RvY29sL2pzb24uanNcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlcnNjb3JlLWRhbmdsZVxuXG4gICAgICB2YXIgY29kZSA9IChkYXRhLl9fdHlwZSB8fCBkYXRhLmNvZGUpLnNwbGl0KCcjJykucG9wKCk7XG4gICAgICB2YXIgZXJyb3IgPSB7XG4gICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgIG5hbWU6IGNvZGUsXG4gICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSB8fCBkYXRhLk1lc3NhZ2UgfHwgbnVsbFxuICAgICAgfTtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAvLyBmaXJzdCBjaGVjayBpZiB3ZSBoYXZlIGEgc2VydmljZSBlcnJvclxuICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmhlYWRlcnMgJiYgcmVzcG9uc2UuaGVhZGVycy5nZXQoJ3gtYW16bi1lcnJvcnR5cGUnKSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciBjb2RlID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ3gtYW16bi1lcnJvcnR5cGUnKS5zcGxpdCgnOicpWzBdO1xuICAgICAgICAgIHZhciBlcnJvciA9IHtcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICBuYW1lOiBjb2RlLFxuICAgICAgICAgICAgc3RhdHVzQ29kZTogcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogcmVzcG9uc2Uuc3RhdHVzID8gcmVzcG9uc2Uuc3RhdHVzLnRvU3RyaW5nKCkgOiBudWxsXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9IC8vIG90aGVyd2lzZSBjaGVjayBpZiBlcnJvciBpcyBOZXR3b3JrIGVycm9yXG5cbiAgICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyLm1lc3NhZ2UgPT09ICdOZXR3b3JrIGVycm9yJykge1xuICAgICAgICB2YXIgX2Vycm9yID0ge1xuICAgICAgICAgIGNvZGU6ICdOZXR3b3JrRXJyb3InLFxuICAgICAgICAgIG5hbWU6IGVyci5uYW1lLFxuICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhfZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIENsaWVudDtcbn0oKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBDbGllbnQ7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9Db2duaXRvSnd0VG9rZW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Db2duaXRvSnd0VG9rZW5cIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzTG9vc2Uoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzLnByb3RvdHlwZSk7IHN1YkNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IHN1YkNsYXNzOyBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbi8qKiBAY2xhc3MgKi9cbnZhciBDb2duaXRvQWNjZXNzVG9rZW4gPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKF9Db2duaXRvSnd0VG9rZW4pIHtcbiAgX2luaGVyaXRzTG9vc2UoQ29nbml0b0FjY2Vzc1Rva2VuLCBfQ29nbml0b0p3dFRva2VuKTtcblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBDb2duaXRvQWNjZXNzVG9rZW4gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gQWNjZXNzVG9rZW4gVGhlIEpXVCBhY2Nlc3MgdG9rZW4uXG4gICAqL1xuICBmdW5jdGlvbiBDb2duaXRvQWNjZXNzVG9rZW4oX3RlbXApIHtcbiAgICB2YXIgX3JlZiA9IF90ZW1wID09PSB2b2lkIDAgPyB7fSA6IF90ZW1wLFxuICAgICAgICBBY2Nlc3NUb2tlbiA9IF9yZWYuQWNjZXNzVG9rZW47XG5cbiAgICByZXR1cm4gX0NvZ25pdG9Kd3RUb2tlbi5jYWxsKHRoaXMsIEFjY2Vzc1Rva2VuIHx8ICcnKSB8fCB0aGlzO1xuICB9XG5cbiAgcmV0dXJuIENvZ25pdG9BY2Nlc3NUb2tlbjtcbn0oX0NvZ25pdG9Kd3RUb2tlbjJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBDb2duaXRvQWNjZXNzVG9rZW47IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9Db2duaXRvSnd0VG9rZW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Db2duaXRvSnd0VG9rZW5cIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzTG9vc2Uoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzLnByb3RvdHlwZSk7IHN1YkNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IHN1YkNsYXNzOyBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbi8qKiBAY2xhc3MgKi9cbnZhciBDb2duaXRvSWRUb2tlbiA9XG4vKiNfX1BVUkVfXyovXG5mdW5jdGlvbiAoX0NvZ25pdG9Kd3RUb2tlbikge1xuICBfaW5oZXJpdHNMb29zZShDb2duaXRvSWRUb2tlbiwgX0NvZ25pdG9Kd3RUb2tlbik7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgYSBuZXcgQ29nbml0b0lkVG9rZW4gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gSWRUb2tlbiBUaGUgSldUIElkIHRva2VuXG4gICAqL1xuICBmdW5jdGlvbiBDb2duaXRvSWRUb2tlbihfdGVtcCkge1xuICAgIHZhciBfcmVmID0gX3RlbXAgPT09IHZvaWQgMCA/IHt9IDogX3RlbXAsXG4gICAgICAgIElkVG9rZW4gPSBfcmVmLklkVG9rZW47XG5cbiAgICByZXR1cm4gX0NvZ25pdG9Kd3RUb2tlbi5jYWxsKHRoaXMsIElkVG9rZW4gfHwgJycpIHx8IHRoaXM7XG4gIH1cblxuICByZXR1cm4gQ29nbml0b0lkVG9rZW47XG59KF9Db2duaXRvSnd0VG9rZW4yW1wiZGVmYXVsdFwiXSk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gQ29nbml0b0lkVG9rZW47IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9idWZmZXIgPSByZXF1aXJlKFwiYnVmZmVyL1wiKTtcblxuLyohXG4gKiBDb3B5cmlnaHQgMjAxNiBBbWF6b24uY29tLFxuICogSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQW1hem9uIFNvZnR3YXJlIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIikuXG4gKiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlXG4gKiBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwOi8vYXdzLmFtYXpvbi5jb20vYXNsL1xuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpc1xuICogZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlXG4gKiBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY2xhc3MgKi9cbnZhciBDb2duaXRvSnd0VG9rZW4gPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBDb2duaXRvSnd0VG9rZW4gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gdG9rZW4gVGhlIEpXVCB0b2tlbi5cbiAgICovXG4gIGZ1bmN0aW9uIENvZ25pdG9Kd3RUb2tlbih0b2tlbikge1xuICAgIC8vIEFzc2lnbiBvYmplY3RcbiAgICB0aGlzLmp3dFRva2VuID0gdG9rZW4gfHwgJyc7XG4gICAgdGhpcy5wYXlsb2FkID0gdGhpcy5kZWNvZGVQYXlsb2FkKCk7XG4gIH1cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSByZWNvcmQncyB0b2tlbi5cbiAgICovXG5cblxuICB2YXIgX3Byb3RvID0gQ29nbml0b0p3dFRva2VuLnByb3RvdHlwZTtcblxuICBfcHJvdG8uZ2V0Snd0VG9rZW4gPSBmdW5jdGlvbiBnZXRKd3RUb2tlbigpIHtcbiAgICByZXR1cm4gdGhpcy5qd3RUb2tlbjtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge2ludH0gdGhlIHRva2VuJ3MgZXhwaXJhdGlvbiAoZXhwIG1lbWJlcikuXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldEV4cGlyYXRpb24gPSBmdW5jdGlvbiBnZXRFeHBpcmF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnBheWxvYWQuZXhwO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7aW50fSB0aGUgdG9rZW4ncyBcImlzc3VlZCBhdFwiIChpYXQgbWVtYmVyKS5cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0SXNzdWVkQXQgPSBmdW5jdGlvbiBnZXRJc3N1ZWRBdCgpIHtcbiAgICByZXR1cm4gdGhpcy5wYXlsb2FkLmlhdDtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge29iamVjdH0gdGhlIHRva2VuJ3MgcGF5bG9hZC5cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZGVjb2RlUGF5bG9hZCA9IGZ1bmN0aW9uIGRlY29kZVBheWxvYWQoKSB7XG4gICAgdmFyIHBheWxvYWQgPSB0aGlzLmp3dFRva2VuLnNwbGl0KCcuJylbMV07XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoX2J1ZmZlci5CdWZmZXIuZnJvbShwYXlsb2FkLCAnYmFzZTY0JykudG9TdHJpbmcoJ3V0ZjgnKSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBDb2duaXRvSnd0VG9rZW47XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gQ29nbml0b0p3dFRva2VuOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbi8qIVxuICogQ29weXJpZ2h0IDIwMTYgQW1hem9uLmNvbSxcbiAqIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFtYXpvbiBTb2Z0d2FyZSBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpLlxuICogWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZVxuICogTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cDovL2F3cy5hbWF6b24uY29tL2FzbC9cbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXNcbiAqIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZVxuICogZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogQGNsYXNzICovXG52YXIgQ29nbml0b1JlZnJlc2hUb2tlbiA9XG4vKiNfX1BVUkVfXyovXG5mdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IENvZ25pdG9SZWZyZXNoVG9rZW4gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gUmVmcmVzaFRva2VuIFRoZSBKV1QgcmVmcmVzaCB0b2tlbi5cbiAgICovXG4gIGZ1bmN0aW9uIENvZ25pdG9SZWZyZXNoVG9rZW4oX3RlbXApIHtcbiAgICB2YXIgX3JlZiA9IF90ZW1wID09PSB2b2lkIDAgPyB7fSA6IF90ZW1wLFxuICAgICAgICBSZWZyZXNoVG9rZW4gPSBfcmVmLlJlZnJlc2hUb2tlbjtcblxuICAgIC8vIEFzc2lnbiBvYmplY3RcbiAgICB0aGlzLnRva2VuID0gUmVmcmVzaFRva2VuIHx8ICcnO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgcmVjb3JkJ3MgdG9rZW4uXG4gICAqL1xuXG5cbiAgdmFyIF9wcm90byA9IENvZ25pdG9SZWZyZXNoVG9rZW4ucHJvdG90eXBlO1xuXG4gIF9wcm90by5nZXRUb2tlbiA9IGZ1bmN0aW9uIGdldFRva2VuKCkge1xuICAgIHJldHVybiB0aGlzLnRva2VuO1xuICB9O1xuXG4gIHJldHVybiBDb2duaXRvUmVmcmVzaFRva2VuO1xufSgpO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IENvZ25pdG9SZWZyZXNoVG9rZW47IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9idWZmZXIgPSByZXF1aXJlKFwiYnVmZmVyL1wiKTtcblxudmFyIF9jb3JlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiY3J5cHRvLWpzL2NvcmVcIikpO1xuXG52YXIgX2xpYlR5cGVkYXJyYXlzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiY3J5cHRvLWpzL2xpYi10eXBlZGFycmF5c1wiKSk7XG5cbnZhciBfZW5jQmFzZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcImNyeXB0by1qcy9lbmMtYmFzZTY0XCIpKTtcblxudmFyIF9obWFjU2hhID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiY3J5cHRvLWpzL2htYWMtc2hhMjU2XCIpKTtcblxudmFyIF9CaWdJbnRlZ2VyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9CaWdJbnRlZ2VyXCIpKTtcblxudmFyIF9BdXRoZW50aWNhdGlvbkhlbHBlciA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQXV0aGVudGljYXRpb25IZWxwZXJcIikpO1xuXG52YXIgX0NvZ25pdG9BY2Nlc3NUb2tlbiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29nbml0b0FjY2Vzc1Rva2VuXCIpKTtcblxudmFyIF9Db2duaXRvSWRUb2tlbiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29nbml0b0lkVG9rZW5cIikpO1xuXG52YXIgX0NvZ25pdG9SZWZyZXNoVG9rZW4gPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0NvZ25pdG9SZWZyZXNoVG9rZW5cIikpO1xuXG52YXIgX0NvZ25pdG9Vc2VyU2Vzc2lvbiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29nbml0b1VzZXJTZXNzaW9uXCIpKTtcblxudmFyIF9EYXRlSGVscGVyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9EYXRlSGVscGVyXCIpKTtcblxudmFyIF9Db2duaXRvVXNlckF0dHJpYnV0ZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29nbml0b1VzZXJBdHRyaWJ1dGVcIikpO1xuXG52YXIgX1N0b3JhZ2VIZWxwZXIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL1N0b3JhZ2VIZWxwZXJcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuLyohXG4gKiBDb3B5cmlnaHQgMjAxNiBBbWF6b24uY29tLFxuICogSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQW1hem9uIFNvZnR3YXJlIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIikuXG4gKiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlXG4gKiBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwOi8vYXdzLmFtYXpvbi5jb20vYXNsL1xuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpc1xuICogZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlXG4gKiBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vLyBuZWNlc3NhcnkgZm9yIGNyeXB0byBqc1xuXG4vKipcbiAqIEBjYWxsYmFjayBub2RlQ2FsbGJhY2tcbiAqIEB0ZW1wbGF0ZSBUIHJlc3VsdFxuICogQHBhcmFtIHsqfSBlcnIgVGhlIG9wZXJhdGlvbiBmYWlsdXJlIHJlYXNvbiwgb3IgbnVsbC5cbiAqIEBwYXJhbSB7VH0gcmVzdWx0IFRoZSBvcGVyYXRpb24gcmVzdWx0LlxuICovXG5cbi8qKlxuICogQGNhbGxiYWNrIG9uRmFpbHVyZVxuICogQHBhcmFtIHsqfSBlcnIgRmFpbHVyZSByZWFzb24uXG4gKi9cblxuLyoqXG4gKiBAY2FsbGJhY2sgb25TdWNjZXNzXG4gKiBAdGVtcGxhdGUgVCByZXN1bHRcbiAqIEBwYXJhbSB7VH0gcmVzdWx0IFRoZSBvcGVyYXRpb24gcmVzdWx0LlxuICovXG5cbi8qKlxuICogQGNhbGxiYWNrIG1mYVJlcXVpcmVkXG4gKiBAcGFyYW0geyp9IGRldGFpbHMgTUZBIGNoYWxsZW5nZSBkZXRhaWxzLlxuICovXG5cbi8qKlxuICogQGNhbGxiYWNrIGN1c3RvbUNoYWxsZW5nZVxuICogQHBhcmFtIHsqfSBkZXRhaWxzIEN1c3RvbSBjaGFsbGVuZ2UgZGV0YWlscy5cbiAqL1xuXG4vKipcbiAqIEBjYWxsYmFjayBpbnB1dFZlcmlmaWNhdGlvbkNvZGVcbiAqIEBwYXJhbSB7Kn0gZGF0YSBTZXJ2ZXIgcmVzcG9uc2UuXG4gKi9cblxuLyoqXG4gKiBAY2FsbGJhY2sgYXV0aFN1Y2Nlc3NcbiAqIEBwYXJhbSB7Q29nbml0b1VzZXJTZXNzaW9ufSBzZXNzaW9uIFRoZSBuZXcgc2Vzc2lvbi5cbiAqIEBwYXJhbSB7Ym9vbD19IHVzZXJDb25maXJtYXRpb25OZWNlc3NhcnkgVXNlciBtdXN0IGJlIGNvbmZpcm1lZC5cbiAqL1xudmFyIGlzQnJvd3NlciA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCI7XG52YXIgdXNlckFnZW50ID0gaXNCcm93c2VyID8gbmF2aWdhdG9yLnVzZXJBZ2VudCA6IFwibm9kZWpzXCI7XG4vKiogQGNsYXNzICovXG5cbnZhciBDb2duaXRvVXNlciA9XG4vKiNfX1BVUkVfXyovXG5mdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IENvZ25pdG9Vc2VyIG9iamVjdFxuICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBDcmVhdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhLlVzZXJuYW1lIFRoZSB1c2VyJ3MgdXNlcm5hbWUuXG4gICAqIEBwYXJhbSB7Q29nbml0b1VzZXJQb29sfSBkYXRhLlBvb2wgUG9vbCBjb250YWluaW5nIHRoZSB1c2VyLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YS5TdG9yYWdlIE9wdGlvbmFsIHN0b3JhZ2Ugb2JqZWN0LlxuICAgKi9cbiAgZnVuY3Rpb24gQ29nbml0b1VzZXIoZGF0YSkge1xuICAgIGlmIChkYXRhID09IG51bGwgfHwgZGF0YS5Vc2VybmFtZSA9PSBudWxsIHx8IGRhdGEuUG9vbCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXJuYW1lIGFuZCBwb29sIGluZm9ybWF0aW9uIGFyZSByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLnVzZXJuYW1lID0gZGF0YS5Vc2VybmFtZSB8fCAnJztcbiAgICB0aGlzLnBvb2wgPSBkYXRhLlBvb2w7XG4gICAgdGhpcy5TZXNzaW9uID0gbnVsbDtcbiAgICB0aGlzLmNsaWVudCA9IGRhdGEuUG9vbC5jbGllbnQ7XG4gICAgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9IG51bGw7XG4gICAgdGhpcy5hdXRoZW50aWNhdGlvbkZsb3dUeXBlID0gJ1VTRVJfU1JQX0FVVEgnO1xuICAgIHRoaXMuc3RvcmFnZSA9IGRhdGEuU3RvcmFnZSB8fCBuZXcgX1N0b3JhZ2VIZWxwZXJbXCJkZWZhdWx0XCJdKCkuZ2V0U3RvcmFnZSgpO1xuICAgIHRoaXMua2V5UHJlZml4ID0gXCJDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuXCIgKyB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKTtcbiAgICB0aGlzLnVzZXJEYXRhS2V5ID0gdGhpcy5rZXlQcmVmaXggKyBcIi5cIiArIHRoaXMudXNlcm5hbWUgKyBcIi51c2VyRGF0YVwiO1xuICB9XG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzZXNzaW9uIGZvciB0aGlzIHVzZXJcbiAgICogQHBhcmFtIHtDb2duaXRvVXNlclNlc3Npb259IHNpZ25JblVzZXJTZXNzaW9uIHRoZSBzZXNzaW9uXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cblxuXG4gIHZhciBfcHJvdG8gPSBDb2duaXRvVXNlci5wcm90b3R5cGU7XG5cbiAgX3Byb3RvLnNldFNpZ25JblVzZXJTZXNzaW9uID0gZnVuY3Rpb24gc2V0U2lnbkluVXNlclNlc3Npb24oc2lnbkluVXNlclNlc3Npb24pIHtcbiAgICB0aGlzLmNsZWFyQ2FjaGVkVXNlckRhdGEoKTtcbiAgICB0aGlzLnNpZ25JblVzZXJTZXNzaW9uID0gc2lnbkluVXNlclNlc3Npb247XG4gICAgdGhpcy5jYWNoZVRva2VucygpO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7Q29nbml0b1VzZXJTZXNzaW9ufSB0aGUgY3VycmVudCBzZXNzaW9uIGZvciB0aGlzIHVzZXJcbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0U2lnbkluVXNlclNlc3Npb24gPSBmdW5jdGlvbiBnZXRTaWduSW5Vc2VyU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbjtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIHVzZXIncyB1c2VybmFtZVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXRVc2VybmFtZSA9IGZ1bmN0aW9uIGdldFVzZXJuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJuYW1lO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSB0aGUgYXV0aGVudGljYXRpb24gZmxvdyB0eXBlXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldEF1dGhlbnRpY2F0aW9uRmxvd1R5cGUgPSBmdW5jdGlvbiBnZXRBdXRoZW50aWNhdGlvbkZsb3dUeXBlKCkge1xuICAgIHJldHVybiB0aGlzLmF1dGhlbnRpY2F0aW9uRmxvd1R5cGU7XG4gIH1cbiAgLyoqXG4gICAqIHNldHMgYXV0aGVudGljYXRpb24gZmxvdyB0eXBlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRoZW50aWNhdGlvbkZsb3dUeXBlIE5ldyB2YWx1ZS5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLnNldEF1dGhlbnRpY2F0aW9uRmxvd1R5cGUgPSBmdW5jdGlvbiBzZXRBdXRoZW50aWNhdGlvbkZsb3dUeXBlKGF1dGhlbnRpY2F0aW9uRmxvd1R5cGUpIHtcbiAgICB0aGlzLmF1dGhlbnRpY2F0aW9uRmxvd1R5cGUgPSBhdXRoZW50aWNhdGlvbkZsb3dUeXBlO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW5nIHRoZSB1c2VyIHRocm91Z2ggdGhlIGN1c3RvbSBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgKiBAcGFyYW0ge0F1dGhlbnRpY2F0aW9uRGV0YWlsc30gYXV0aERldGFpbHMgQ29udGFpbnMgdGhlIGF1dGhlbnRpY2F0aW9uIGRhdGFcbiAgICogQHBhcmFtIHtvYmplY3R9IGNhbGxiYWNrIFJlc3VsdCBjYWxsYmFjayBtYXAuXG4gICAqIEBwYXJhbSB7b25GYWlsdXJlfSBjYWxsYmFjay5vbkZhaWx1cmUgQ2FsbGVkIG9uIGFueSBlcnJvci5cbiAgICogQHBhcmFtIHtjdXN0b21DaGFsbGVuZ2V9IGNhbGxiYWNrLmN1c3RvbUNoYWxsZW5nZSBDdXN0b20gY2hhbGxlbmdlXG4gICAqICAgICAgICByZXNwb25zZSByZXF1aXJlZCB0byBjb250aW51ZS5cbiAgICogQHBhcmFtIHthdXRoU3VjY2Vzc30gY2FsbGJhY2sub25TdWNjZXNzIENhbGxlZCBvbiBzdWNjZXNzIHdpdGggdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uaW5pdGlhdGVBdXRoID0gZnVuY3Rpb24gaW5pdGlhdGVBdXRoKGF1dGhEZXRhaWxzLCBjYWxsYmFjaykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgYXV0aFBhcmFtZXRlcnMgPSBhdXRoRGV0YWlscy5nZXRBdXRoUGFyYW1ldGVycygpO1xuICAgIGF1dGhQYXJhbWV0ZXJzLlVTRVJOQU1FID0gdGhpcy51c2VybmFtZTtcbiAgICB2YXIgY2xpZW50TWV0YURhdGEgPSBPYmplY3Qua2V5cyhhdXRoRGV0YWlscy5nZXRWYWxpZGF0aW9uRGF0YSgpKS5sZW5ndGggIT09IDAgPyBhdXRoRGV0YWlscy5nZXRWYWxpZGF0aW9uRGF0YSgpIDogYXV0aERldGFpbHMuZ2V0Q2xpZW50TWV0YWRhdGEoKTtcbiAgICB2YXIganNvblJlcSA9IHtcbiAgICAgIEF1dGhGbG93OiAnQ1VTVE9NX0FVVEgnLFxuICAgICAgQ2xpZW50SWQ6IHRoaXMucG9vbC5nZXRDbGllbnRJZCgpLFxuICAgICAgQXV0aFBhcmFtZXRlcnM6IGF1dGhQYXJhbWV0ZXJzLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFEYXRhXG4gICAgfTtcblxuICAgIGlmICh0aGlzLmdldFVzZXJDb250ZXh0RGF0YSgpKSB7XG4gICAgICBqc29uUmVxLlVzZXJDb250ZXh0RGF0YSA9IHRoaXMuZ2V0VXNlckNvbnRleHREYXRhKCk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnSW5pdGlhdGVBdXRoJywganNvblJlcSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVycik7XG4gICAgICB9XG5cbiAgICAgIHZhciBjaGFsbGVuZ2VOYW1lID0gZGF0YS5DaGFsbGVuZ2VOYW1lO1xuICAgICAgdmFyIGNoYWxsZW5nZVBhcmFtZXRlcnMgPSBkYXRhLkNoYWxsZW5nZVBhcmFtZXRlcnM7XG5cbiAgICAgIGlmIChjaGFsbGVuZ2VOYW1lID09PSAnQ1VTVE9NX0NIQUxMRU5HRScpIHtcbiAgICAgICAgX3RoaXMuU2Vzc2lvbiA9IGRhdGEuU2Vzc2lvbjtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmN1c3RvbUNoYWxsZW5nZShjaGFsbGVuZ2VQYXJhbWV0ZXJzKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMuc2lnbkluVXNlclNlc3Npb24gPSBfdGhpcy5nZXRDb2duaXRvVXNlclNlc3Npb24oZGF0YS5BdXRoZW50aWNhdGlvblJlc3VsdCk7XG5cbiAgICAgIF90aGlzLmNhY2hlVG9rZW5zKCk7XG5cbiAgICAgIHJldHVybiBjYWxsYmFjay5vblN1Y2Nlc3MoX3RoaXMuc2lnbkluVXNlclNlc3Npb24pO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW5nIHRoZSB1c2VyLlxuICAgKiBzdHVmZlxuICAgKiBAcGFyYW0ge0F1dGhlbnRpY2F0aW9uRGV0YWlsc30gYXV0aERldGFpbHMgQ29udGFpbnMgdGhlIGF1dGhlbnRpY2F0aW9uIGRhdGFcbiAgICogQHBhcmFtIHtvYmplY3R9IGNhbGxiYWNrIFJlc3VsdCBjYWxsYmFjayBtYXAuXG4gICAqIEBwYXJhbSB7b25GYWlsdXJlfSBjYWxsYmFjay5vbkZhaWx1cmUgQ2FsbGVkIG9uIGFueSBlcnJvci5cbiAgICogQHBhcmFtIHtuZXdQYXNzd29yZFJlcXVpcmVkfSBjYWxsYmFjay5uZXdQYXNzd29yZFJlcXVpcmVkIG5ld1xuICAgKiAgICAgICAgcGFzc3dvcmQgYW5kIGFueSByZXF1aXJlZCBhdHRyaWJ1dGVzIGFyZSByZXF1aXJlZCB0byBjb250aW51ZVxuICAgKiBAcGFyYW0ge21mYVJlcXVpcmVkfSBjYWxsYmFjay5tZmFSZXF1aXJlZCBNRkEgY29kZVxuICAgKiAgICAgICAgcmVxdWlyZWQgdG8gY29udGludWUuXG4gICAqIEBwYXJhbSB7Y3VzdG9tQ2hhbGxlbmdlfSBjYWxsYmFjay5jdXN0b21DaGFsbGVuZ2UgQ3VzdG9tIGNoYWxsZW5nZVxuICAgKiAgICAgICAgcmVzcG9uc2UgcmVxdWlyZWQgdG8gY29udGludWUuXG4gICAqIEBwYXJhbSB7YXV0aFN1Y2Nlc3N9IGNhbGxiYWNrLm9uU3VjY2VzcyBDYWxsZWQgb24gc3VjY2VzcyB3aXRoIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmF1dGhlbnRpY2F0ZVVzZXIgPSBmdW5jdGlvbiBhdXRoZW50aWNhdGVVc2VyKGF1dGhEZXRhaWxzLCBjYWxsYmFjaykge1xuICAgIGlmICh0aGlzLmF1dGhlbnRpY2F0aW9uRmxvd1R5cGUgPT09ICdVU0VSX1BBU1NXT1JEX0FVVEgnKSB7XG4gICAgICByZXR1cm4gdGhpcy5hdXRoZW50aWNhdGVVc2VyUGxhaW5Vc2VybmFtZVBhc3N3b3JkKGF1dGhEZXRhaWxzLCBjYWxsYmFjayk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmF1dGhlbnRpY2F0aW9uRmxvd1R5cGUgPT09ICdVU0VSX1NSUF9BVVRIJyB8fCB0aGlzLmF1dGhlbnRpY2F0aW9uRmxvd1R5cGUgPT09ICdDVVNUT01fQVVUSCcpIHtcbiAgICAgIHJldHVybiB0aGlzLmF1dGhlbnRpY2F0ZVVzZXJEZWZhdWx0QXV0aChhdXRoRGV0YWlscywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUobmV3IEVycm9yKCdBdXRoZW50aWNhdGlvbiBmbG93IHR5cGUgaXMgaW52YWxpZC4nKSk7XG4gIH1cbiAgLyoqXG4gICAqIFBSSVZBVEUgT05MWTogVGhpcyBpcyBhbiBpbnRlcm5hbCBvbmx5IG1ldGhvZCBhbmQgc2hvdWxkIG5vdFxuICAgKiBiZSBkaXJlY3RseSBjYWxsZWQgYnkgdGhlIGNvbnN1bWVycy5cbiAgICogSXQgY2FsbHMgdGhlIEF1dGhlbnRpY2F0aW9uSGVscGVyIGZvciBTUlAgcmVsYXRlZFxuICAgKiBzdHVmZlxuICAgKiBAcGFyYW0ge0F1dGhlbnRpY2F0aW9uRGV0YWlsc30gYXV0aERldGFpbHMgQ29udGFpbnMgdGhlIGF1dGhlbnRpY2F0aW9uIGRhdGFcbiAgICogQHBhcmFtIHtvYmplY3R9IGNhbGxiYWNrIFJlc3VsdCBjYWxsYmFjayBtYXAuXG4gICAqIEBwYXJhbSB7b25GYWlsdXJlfSBjYWxsYmFjay5vbkZhaWx1cmUgQ2FsbGVkIG9uIGFueSBlcnJvci5cbiAgICogQHBhcmFtIHtuZXdQYXNzd29yZFJlcXVpcmVkfSBjYWxsYmFjay5uZXdQYXNzd29yZFJlcXVpcmVkIG5ld1xuICAgKiAgICAgICAgcGFzc3dvcmQgYW5kIGFueSByZXF1aXJlZCBhdHRyaWJ1dGVzIGFyZSByZXF1aXJlZCB0byBjb250aW51ZVxuICAgKiBAcGFyYW0ge21mYVJlcXVpcmVkfSBjYWxsYmFjay5tZmFSZXF1aXJlZCBNRkEgY29kZVxuICAgKiAgICAgICAgcmVxdWlyZWQgdG8gY29udGludWUuXG4gICAqIEBwYXJhbSB7Y3VzdG9tQ2hhbGxlbmdlfSBjYWxsYmFjay5jdXN0b21DaGFsbGVuZ2UgQ3VzdG9tIGNoYWxsZW5nZVxuICAgKiAgICAgICAgcmVzcG9uc2UgcmVxdWlyZWQgdG8gY29udGludWUuXG4gICAqIEBwYXJhbSB7YXV0aFN1Y2Nlc3N9IGNhbGxiYWNrLm9uU3VjY2VzcyBDYWxsZWQgb24gc3VjY2VzcyB3aXRoIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmF1dGhlbnRpY2F0ZVVzZXJEZWZhdWx0QXV0aCA9IGZ1bmN0aW9uIGF1dGhlbnRpY2F0ZVVzZXJEZWZhdWx0QXV0aChhdXRoRGV0YWlscywgY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgIHZhciBhdXRoZW50aWNhdGlvbkhlbHBlciA9IG5ldyBfQXV0aGVudGljYXRpb25IZWxwZXJbXCJkZWZhdWx0XCJdKHRoaXMucG9vbC5nZXRVc2VyUG9vbElkKCkuc3BsaXQoJ18nKVsxXSk7XG4gICAgdmFyIGRhdGVIZWxwZXIgPSBuZXcgX0RhdGVIZWxwZXJbXCJkZWZhdWx0XCJdKCk7XG4gICAgdmFyIHNlcnZlckJWYWx1ZTtcbiAgICB2YXIgc2FsdDtcbiAgICB2YXIgYXV0aFBhcmFtZXRlcnMgPSB7fTtcblxuICAgIGlmICh0aGlzLmRldmljZUtleSAhPSBudWxsKSB7XG4gICAgICBhdXRoUGFyYW1ldGVycy5ERVZJQ0VfS0VZID0gdGhpcy5kZXZpY2VLZXk7XG4gICAgfVxuXG4gICAgYXV0aFBhcmFtZXRlcnMuVVNFUk5BTUUgPSB0aGlzLnVzZXJuYW1lO1xuICAgIGF1dGhlbnRpY2F0aW9uSGVscGVyLmdldExhcmdlQVZhbHVlKGZ1bmN0aW9uIChlcnJPbkFWYWx1ZSwgYVZhbHVlKSB7XG4gICAgICAvLyBnZXRMYXJnZUFWYWx1ZSBjYWxsYmFjayBzdGFydFxuICAgICAgaWYgKGVyck9uQVZhbHVlKSB7XG4gICAgICAgIGNhbGxiYWNrLm9uRmFpbHVyZShlcnJPbkFWYWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGF1dGhQYXJhbWV0ZXJzLlNSUF9BID0gYVZhbHVlLnRvU3RyaW5nKDE2KTtcblxuICAgICAgaWYgKF90aGlzMi5hdXRoZW50aWNhdGlvbkZsb3dUeXBlID09PSAnQ1VTVE9NX0FVVEgnKSB7XG4gICAgICAgIGF1dGhQYXJhbWV0ZXJzLkNIQUxMRU5HRV9OQU1FID0gJ1NSUF9BJztcbiAgICAgIH1cblxuICAgICAgdmFyIGNsaWVudE1ldGFEYXRhID0gT2JqZWN0LmtleXMoYXV0aERldGFpbHMuZ2V0VmFsaWRhdGlvbkRhdGEoKSkubGVuZ3RoICE9PSAwID8gYXV0aERldGFpbHMuZ2V0VmFsaWRhdGlvbkRhdGEoKSA6IGF1dGhEZXRhaWxzLmdldENsaWVudE1ldGFkYXRhKCk7XG4gICAgICB2YXIganNvblJlcSA9IHtcbiAgICAgICAgQXV0aEZsb3c6IF90aGlzMi5hdXRoZW50aWNhdGlvbkZsb3dUeXBlLFxuICAgICAgICBDbGllbnRJZDogX3RoaXMyLnBvb2wuZ2V0Q2xpZW50SWQoKSxcbiAgICAgICAgQXV0aFBhcmFtZXRlcnM6IGF1dGhQYXJhbWV0ZXJzLFxuICAgICAgICBDbGllbnRNZXRhZGF0YTogY2xpZW50TWV0YURhdGFcbiAgICAgIH07XG5cbiAgICAgIGlmIChfdGhpczIuZ2V0VXNlckNvbnRleHREYXRhKF90aGlzMi51c2VybmFtZSkpIHtcbiAgICAgICAganNvblJlcS5Vc2VyQ29udGV4dERhdGEgPSBfdGhpczIuZ2V0VXNlckNvbnRleHREYXRhKF90aGlzMi51c2VybmFtZSk7XG4gICAgICB9XG5cbiAgICAgIF90aGlzMi5jbGllbnQucmVxdWVzdCgnSW5pdGlhdGVBdXRoJywganNvblJlcSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoYWxsZW5nZVBhcmFtZXRlcnMgPSBkYXRhLkNoYWxsZW5nZVBhcmFtZXRlcnM7XG4gICAgICAgIF90aGlzMi51c2VybmFtZSA9IGNoYWxsZW5nZVBhcmFtZXRlcnMuVVNFUl9JRF9GT1JfU1JQO1xuICAgICAgICBzZXJ2ZXJCVmFsdWUgPSBuZXcgX0JpZ0ludGVnZXJbXCJkZWZhdWx0XCJdKGNoYWxsZW5nZVBhcmFtZXRlcnMuU1JQX0IsIDE2KTtcbiAgICAgICAgc2FsdCA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0oY2hhbGxlbmdlUGFyYW1ldGVycy5TQUxULCAxNik7XG5cbiAgICAgICAgX3RoaXMyLmdldENhY2hlZERldmljZUtleUFuZFBhc3N3b3JkKCk7XG5cbiAgICAgICAgYXV0aGVudGljYXRpb25IZWxwZXIuZ2V0UGFzc3dvcmRBdXRoZW50aWNhdGlvbktleShfdGhpczIudXNlcm5hbWUsIGF1dGhEZXRhaWxzLmdldFBhc3N3b3JkKCksIHNlcnZlckJWYWx1ZSwgc2FsdCwgZnVuY3Rpb24gKGVyck9uSGtkZiwgaGtkZikge1xuICAgICAgICAgIC8vIGdldFBhc3N3b3JkQXV0aGVudGljYXRpb25LZXkgY2FsbGJhY2sgc3RhcnRcbiAgICAgICAgICBpZiAoZXJyT25Ia2RmKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5vbkZhaWx1cmUoZXJyT25Ia2RmKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZGF0ZU5vdyA9IGRhdGVIZWxwZXIuZ2V0Tm93U3RyaW5nKCk7XG5cbiAgICAgICAgICB2YXIgbWVzc2FnZSA9IF9jb3JlW1wiZGVmYXVsdFwiXS5saWIuV29yZEFycmF5LmNyZWF0ZShfYnVmZmVyLkJ1ZmZlci5jb25jYXQoW19idWZmZXIuQnVmZmVyLmZyb20oX3RoaXMyLnBvb2wuZ2V0VXNlclBvb2xJZCgpLnNwbGl0KCdfJylbMV0sICd1dGY4JyksIF9idWZmZXIuQnVmZmVyLmZyb20oX3RoaXMyLnVzZXJuYW1lLCAndXRmOCcpLCBfYnVmZmVyLkJ1ZmZlci5mcm9tKGNoYWxsZW5nZVBhcmFtZXRlcnMuU0VDUkVUX0JMT0NLLCAnYmFzZTY0JyksIF9idWZmZXIuQnVmZmVyLmZyb20oZGF0ZU5vdywgJ3V0ZjgnKV0pKTtcblxuICAgICAgICAgIHZhciBrZXkgPSBfY29yZVtcImRlZmF1bHRcIl0ubGliLldvcmRBcnJheS5jcmVhdGUoaGtkZik7XG5cbiAgICAgICAgICB2YXIgc2lnbmF0dXJlU3RyaW5nID0gX2VuY0Jhc2VbXCJkZWZhdWx0XCJdLnN0cmluZ2lmeSgoMCwgX2htYWNTaGFbXCJkZWZhdWx0XCJdKShtZXNzYWdlLCBrZXkpKTtcblxuICAgICAgICAgIHZhciBjaGFsbGVuZ2VSZXNwb25zZXMgPSB7fTtcbiAgICAgICAgICBjaGFsbGVuZ2VSZXNwb25zZXMuVVNFUk5BTUUgPSBfdGhpczIudXNlcm5hbWU7XG4gICAgICAgICAgY2hhbGxlbmdlUmVzcG9uc2VzLlBBU1NXT1JEX0NMQUlNX1NFQ1JFVF9CTE9DSyA9IGNoYWxsZW5nZVBhcmFtZXRlcnMuU0VDUkVUX0JMT0NLO1xuICAgICAgICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5USU1FU1RBTVAgPSBkYXRlTm93O1xuICAgICAgICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5QQVNTV09SRF9DTEFJTV9TSUdOQVRVUkUgPSBzaWduYXR1cmVTdHJpbmc7XG5cbiAgICAgICAgICBpZiAoX3RoaXMyLmRldmljZUtleSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjaGFsbGVuZ2VSZXNwb25zZXMuREVWSUNFX0tFWSA9IF90aGlzMi5kZXZpY2VLZXk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHJlc3BvbmRUb0F1dGhDaGFsbGVuZ2UgPSBmdW5jdGlvbiByZXNwb25kVG9BdXRoQ2hhbGxlbmdlKGNoYWxsZW5nZSwgY2hhbGxlbmdlQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpczIuY2xpZW50LnJlcXVlc3QoJ1Jlc3BvbmRUb0F1dGhDaGFsbGVuZ2UnLCBjaGFsbGVuZ2UsIGZ1bmN0aW9uIChlcnJDaGFsbGVuZ2UsIGRhdGFDaGFsbGVuZ2UpIHtcbiAgICAgICAgICAgICAgaWYgKGVyckNoYWxsZW5nZSAmJiBlcnJDaGFsbGVuZ2UuY29kZSA9PT0gJ1Jlc291cmNlTm90Rm91bmRFeGNlcHRpb24nICYmIGVyckNoYWxsZW5nZS5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZGV2aWNlJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY2hhbGxlbmdlUmVzcG9uc2VzLkRFVklDRV9LRVkgPSBudWxsO1xuICAgICAgICAgICAgICAgIF90aGlzMi5kZXZpY2VLZXkgPSBudWxsO1xuICAgICAgICAgICAgICAgIF90aGlzMi5yYW5kb21QYXNzd29yZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgX3RoaXMyLmRldmljZUdyb3VwS2V5ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIF90aGlzMi5jbGVhckNhY2hlZERldmljZUtleUFuZFBhc3N3b3JkKCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uZFRvQXV0aENoYWxsZW5nZShjaGFsbGVuZ2UsIGNoYWxsZW5nZUNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiBjaGFsbGVuZ2VDYWxsYmFjayhlcnJDaGFsbGVuZ2UsIGRhdGFDaGFsbGVuZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBqc29uUmVxUmVzcCA9IHtcbiAgICAgICAgICAgIENoYWxsZW5nZU5hbWU6ICdQQVNTV09SRF9WRVJJRklFUicsXG4gICAgICAgICAgICBDbGllbnRJZDogX3RoaXMyLnBvb2wuZ2V0Q2xpZW50SWQoKSxcbiAgICAgICAgICAgIENoYWxsZW5nZVJlc3BvbnNlczogY2hhbGxlbmdlUmVzcG9uc2VzLFxuICAgICAgICAgICAgU2Vzc2lvbjogZGF0YS5TZXNzaW9uLFxuICAgICAgICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFEYXRhXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChfdGhpczIuZ2V0VXNlckNvbnRleHREYXRhKCkpIHtcbiAgICAgICAgICAgIGpzb25SZXFSZXNwLlVzZXJDb250ZXh0RGF0YSA9IF90aGlzMi5nZXRVc2VyQ29udGV4dERhdGEoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNwb25kVG9BdXRoQ2hhbGxlbmdlKGpzb25SZXFSZXNwLCBmdW5jdGlvbiAoZXJyQXV0aGVudGljYXRlLCBkYXRhQXV0aGVudGljYXRlKSB7XG4gICAgICAgICAgICBpZiAoZXJyQXV0aGVudGljYXRlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyQXV0aGVudGljYXRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5hdXRoZW50aWNhdGVVc2VySW50ZXJuYWwoZGF0YUF1dGhlbnRpY2F0ZSwgYXV0aGVudGljYXRpb25IZWxwZXIsIGNhbGxiYWNrKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkOyAvLyBnZXRQYXNzd29yZEF1dGhlbnRpY2F0aW9uS2V5IGNhbGxiYWNrIGVuZFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0pOyAvLyBnZXRMYXJnZUFWYWx1ZSBjYWxsYmFjayBlbmRcblxuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBQUklWQVRFIE9OTFk6IFRoaXMgaXMgYW4gaW50ZXJuYWwgb25seSBtZXRob2QgYW5kIHNob3VsZCBub3RcbiAgICogYmUgZGlyZWN0bHkgY2FsbGVkIGJ5IHRoZSBjb25zdW1lcnMuXG4gICAqIEBwYXJhbSB7QXV0aGVudGljYXRpb25EZXRhaWxzfSBhdXRoRGV0YWlscyBDb250YWlucyB0aGUgYXV0aGVudGljYXRpb24gZGF0YS5cbiAgICogQHBhcmFtIHtvYmplY3R9IGNhbGxiYWNrIFJlc3VsdCBjYWxsYmFjayBtYXAuXG4gICAqIEBwYXJhbSB7b25GYWlsdXJlfSBjYWxsYmFjay5vbkZhaWx1cmUgQ2FsbGVkIG9uIGFueSBlcnJvci5cbiAgICogQHBhcmFtIHttZmFSZXF1aXJlZH0gY2FsbGJhY2subWZhUmVxdWlyZWQgTUZBIGNvZGVcbiAgICogICAgICAgIHJlcXVpcmVkIHRvIGNvbnRpbnVlLlxuICAgKiBAcGFyYW0ge2F1dGhTdWNjZXNzfSBjYWxsYmFjay5vblN1Y2Nlc3MgQ2FsbGVkIG9uIHN1Y2Nlc3Mgd2l0aCB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5hdXRoZW50aWNhdGVVc2VyUGxhaW5Vc2VybmFtZVBhc3N3b3JkID0gZnVuY3Rpb24gYXV0aGVudGljYXRlVXNlclBsYWluVXNlcm5hbWVQYXNzd29yZChhdXRoRGV0YWlscywgY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgIHZhciBhdXRoUGFyYW1ldGVycyA9IHt9O1xuICAgIGF1dGhQYXJhbWV0ZXJzLlVTRVJOQU1FID0gdGhpcy51c2VybmFtZTtcbiAgICBhdXRoUGFyYW1ldGVycy5QQVNTV09SRCA9IGF1dGhEZXRhaWxzLmdldFBhc3N3b3JkKCk7XG5cbiAgICBpZiAoIWF1dGhQYXJhbWV0ZXJzLlBBU1NXT1JEKSB7XG4gICAgICBjYWxsYmFjay5vbkZhaWx1cmUobmV3IEVycm9yKCdQQVNTV09SRCBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGF1dGhlbnRpY2F0aW9uSGVscGVyID0gbmV3IF9BdXRoZW50aWNhdGlvbkhlbHBlcltcImRlZmF1bHRcIl0odGhpcy5wb29sLmdldFVzZXJQb29sSWQoKS5zcGxpdCgnXycpWzFdKTtcbiAgICB0aGlzLmdldENhY2hlZERldmljZUtleUFuZFBhc3N3b3JkKCk7XG5cbiAgICBpZiAodGhpcy5kZXZpY2VLZXkgIT0gbnVsbCkge1xuICAgICAgYXV0aFBhcmFtZXRlcnMuREVWSUNFX0tFWSA9IHRoaXMuZGV2aWNlS2V5O1xuICAgIH1cblxuICAgIHZhciBjbGllbnRNZXRhRGF0YSA9IE9iamVjdC5rZXlzKGF1dGhEZXRhaWxzLmdldFZhbGlkYXRpb25EYXRhKCkpLmxlbmd0aCAhPT0gMCA/IGF1dGhEZXRhaWxzLmdldFZhbGlkYXRpb25EYXRhKCkgOiBhdXRoRGV0YWlscy5nZXRDbGllbnRNZXRhZGF0YSgpO1xuICAgIHZhciBqc29uUmVxID0ge1xuICAgICAgQXV0aEZsb3c6ICdVU0VSX1BBU1NXT1JEX0FVVEgnLFxuICAgICAgQ2xpZW50SWQ6IHRoaXMucG9vbC5nZXRDbGllbnRJZCgpLFxuICAgICAgQXV0aFBhcmFtZXRlcnM6IGF1dGhQYXJhbWV0ZXJzLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFEYXRhXG4gICAgfTtcblxuICAgIGlmICh0aGlzLmdldFVzZXJDb250ZXh0RGF0YSh0aGlzLnVzZXJuYW1lKSkge1xuICAgICAganNvblJlcS5Vc2VyQ29udGV4dERhdGEgPSB0aGlzLmdldFVzZXJDb250ZXh0RGF0YSh0aGlzLnVzZXJuYW1lKTtcbiAgICB9IC8vIFVTRVJfUEFTU1dPUkRfQVVUSCBoYXBwZW5zIGluIGEgc2luZ2xlIHJvdW5kLXRyaXA6IGNsaWVudCBzZW5kcyB1c2VyTmFtZSBhbmQgcGFzc3dvcmQsXG4gICAgLy8gQ29nbml0byBVc2VyUG9vbHMgdmVyaWZpZXMgcGFzc3dvcmQgYW5kIHJldHVybnMgdG9rZW5zLlxuXG5cbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdJbml0aWF0ZUF1dGgnLCBqc29uUmVxLCBmdW5jdGlvbiAoZXJyLCBhdXRoUmVzdWx0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF90aGlzMy5hdXRoZW50aWNhdGVVc2VySW50ZXJuYWwoYXV0aFJlc3VsdCwgYXV0aGVudGljYXRpb25IZWxwZXIsIGNhbGxiYWNrKTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogUFJJVkFURSBPTkxZOiBUaGlzIGlzIGFuIGludGVybmFsIG9ubHkgbWV0aG9kIGFuZCBzaG91bGQgbm90XG4gICAqIGJlIGRpcmVjdGx5IGNhbGxlZCBieSB0aGUgY29uc3VtZXJzLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YUF1dGhlbnRpY2F0ZSBhdXRoZW50aWNhdGlvbiBkYXRhXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhdXRoZW50aWNhdGlvbkhlbHBlciBoZWxwZXIgY3JlYXRlZFxuICAgKiBAcGFyYW0ge2NhbGxiYWNrfSBjYWxsYmFjayBwYXNzZWQgb24gZnJvbSBjYWxsZXJcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmF1dGhlbnRpY2F0ZVVzZXJJbnRlcm5hbCA9IGZ1bmN0aW9uIGF1dGhlbnRpY2F0ZVVzZXJJbnRlcm5hbChkYXRhQXV0aGVudGljYXRlLCBhdXRoZW50aWNhdGlvbkhlbHBlciwgY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgIHZhciBjaGFsbGVuZ2VOYW1lID0gZGF0YUF1dGhlbnRpY2F0ZS5DaGFsbGVuZ2VOYW1lO1xuICAgIHZhciBjaGFsbGVuZ2VQYXJhbWV0ZXJzID0gZGF0YUF1dGhlbnRpY2F0ZS5DaGFsbGVuZ2VQYXJhbWV0ZXJzO1xuXG4gICAgaWYgKGNoYWxsZW5nZU5hbWUgPT09ICdTTVNfTUZBJykge1xuICAgICAgdGhpcy5TZXNzaW9uID0gZGF0YUF1dGhlbnRpY2F0ZS5TZXNzaW9uO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLm1mYVJlcXVpcmVkKGNoYWxsZW5nZU5hbWUsIGNoYWxsZW5nZVBhcmFtZXRlcnMpO1xuICAgIH1cblxuICAgIGlmIChjaGFsbGVuZ2VOYW1lID09PSAnU0VMRUNUX01GQV9UWVBFJykge1xuICAgICAgdGhpcy5TZXNzaW9uID0gZGF0YUF1dGhlbnRpY2F0ZS5TZXNzaW9uO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLnNlbGVjdE1GQVR5cGUoY2hhbGxlbmdlTmFtZSwgY2hhbGxlbmdlUGFyYW1ldGVycyk7XG4gICAgfVxuXG4gICAgaWYgKGNoYWxsZW5nZU5hbWUgPT09ICdNRkFfU0VUVVAnKSB7XG4gICAgICB0aGlzLlNlc3Npb24gPSBkYXRhQXV0aGVudGljYXRlLlNlc3Npb247XG4gICAgICByZXR1cm4gY2FsbGJhY2subWZhU2V0dXAoY2hhbGxlbmdlTmFtZSwgY2hhbGxlbmdlUGFyYW1ldGVycyk7XG4gICAgfVxuXG4gICAgaWYgKGNoYWxsZW5nZU5hbWUgPT09ICdTT0ZUV0FSRV9UT0tFTl9NRkEnKSB7XG4gICAgICB0aGlzLlNlc3Npb24gPSBkYXRhQXV0aGVudGljYXRlLlNlc3Npb247XG4gICAgICByZXR1cm4gY2FsbGJhY2sudG90cFJlcXVpcmVkKGNoYWxsZW5nZU5hbWUsIGNoYWxsZW5nZVBhcmFtZXRlcnMpO1xuICAgIH1cblxuICAgIGlmIChjaGFsbGVuZ2VOYW1lID09PSAnQ1VTVE9NX0NIQUxMRU5HRScpIHtcbiAgICAgIHRoaXMuU2Vzc2lvbiA9IGRhdGFBdXRoZW50aWNhdGUuU2Vzc2lvbjtcbiAgICAgIHJldHVybiBjYWxsYmFjay5jdXN0b21DaGFsbGVuZ2UoY2hhbGxlbmdlUGFyYW1ldGVycyk7XG4gICAgfVxuXG4gICAgaWYgKGNoYWxsZW5nZU5hbWUgPT09ICdORVdfUEFTU1dPUkRfUkVRVUlSRUQnKSB7XG4gICAgICB0aGlzLlNlc3Npb24gPSBkYXRhQXV0aGVudGljYXRlLlNlc3Npb247XG4gICAgICB2YXIgdXNlckF0dHJpYnV0ZXMgPSBudWxsO1xuICAgICAgdmFyIHJhd1JlcXVpcmVkQXR0cmlidXRlcyA9IG51bGw7XG4gICAgICB2YXIgcmVxdWlyZWRBdHRyaWJ1dGVzID0gW107XG4gICAgICB2YXIgdXNlckF0dHJpYnV0ZXNQcmVmaXggPSBhdXRoZW50aWNhdGlvbkhlbHBlci5nZXROZXdQYXNzd29yZFJlcXVpcmVkQ2hhbGxlbmdlVXNlckF0dHJpYnV0ZVByZWZpeCgpO1xuXG4gICAgICBpZiAoY2hhbGxlbmdlUGFyYW1ldGVycykge1xuICAgICAgICB1c2VyQXR0cmlidXRlcyA9IEpTT04ucGFyc2UoZGF0YUF1dGhlbnRpY2F0ZS5DaGFsbGVuZ2VQYXJhbWV0ZXJzLnVzZXJBdHRyaWJ1dGVzKTtcbiAgICAgICAgcmF3UmVxdWlyZWRBdHRyaWJ1dGVzID0gSlNPTi5wYXJzZShkYXRhQXV0aGVudGljYXRlLkNoYWxsZW5nZVBhcmFtZXRlcnMucmVxdWlyZWRBdHRyaWJ1dGVzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJhd1JlcXVpcmVkQXR0cmlidXRlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhd1JlcXVpcmVkQXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHJlcXVpcmVkQXR0cmlidXRlc1tpXSA9IHJhd1JlcXVpcmVkQXR0cmlidXRlc1tpXS5zdWJzdHIodXNlckF0dHJpYnV0ZXNQcmVmaXgubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FsbGJhY2submV3UGFzc3dvcmRSZXF1aXJlZCh1c2VyQXR0cmlidXRlcywgcmVxdWlyZWRBdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICBpZiAoY2hhbGxlbmdlTmFtZSA9PT0gJ0RFVklDRV9TUlBfQVVUSCcpIHtcbiAgICAgIHRoaXMuZ2V0RGV2aWNlUmVzcG9uc2UoY2FsbGJhY2spO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnNpZ25JblVzZXJTZXNzaW9uID0gdGhpcy5nZXRDb2duaXRvVXNlclNlc3Npb24oZGF0YUF1dGhlbnRpY2F0ZS5BdXRoZW50aWNhdGlvblJlc3VsdCk7XG4gICAgdGhpcy5jaGFsbGVuZ2VOYW1lID0gY2hhbGxlbmdlTmFtZTtcbiAgICB0aGlzLmNhY2hlVG9rZW5zKCk7XG4gICAgdmFyIG5ld0RldmljZU1ldGFkYXRhID0gZGF0YUF1dGhlbnRpY2F0ZS5BdXRoZW50aWNhdGlvblJlc3VsdC5OZXdEZXZpY2VNZXRhZGF0YTtcblxuICAgIGlmIChuZXdEZXZpY2VNZXRhZGF0YSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sub25TdWNjZXNzKHRoaXMuc2lnbkluVXNlclNlc3Npb24pO1xuICAgIH1cblxuICAgIGF1dGhlbnRpY2F0aW9uSGVscGVyLmdlbmVyYXRlSGFzaERldmljZShkYXRhQXV0aGVudGljYXRlLkF1dGhlbnRpY2F0aW9uUmVzdWx0Lk5ld0RldmljZU1ldGFkYXRhLkRldmljZUdyb3VwS2V5LCBkYXRhQXV0aGVudGljYXRlLkF1dGhlbnRpY2F0aW9uUmVzdWx0Lk5ld0RldmljZU1ldGFkYXRhLkRldmljZUtleSwgZnVuY3Rpb24gKGVyckdlbkhhc2gpIHtcbiAgICAgIGlmIChlcnJHZW5IYXNoKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyR2VuSGFzaCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBkZXZpY2VTZWNyZXRWZXJpZmllckNvbmZpZyA9IHtcbiAgICAgICAgU2FsdDogX2J1ZmZlci5CdWZmZXIuZnJvbShhdXRoZW50aWNhdGlvbkhlbHBlci5nZXRTYWx0RGV2aWNlcygpLCAnaGV4JykudG9TdHJpbmcoJ2Jhc2U2NCcpLFxuICAgICAgICBQYXNzd29yZFZlcmlmaWVyOiBfYnVmZmVyLkJ1ZmZlci5mcm9tKGF1dGhlbnRpY2F0aW9uSGVscGVyLmdldFZlcmlmaWVyRGV2aWNlcygpLCAnaGV4JykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgICB9O1xuICAgICAgX3RoaXM0LnZlcmlmaWVyRGV2aWNlcyA9IGRldmljZVNlY3JldFZlcmlmaWVyQ29uZmlnLlBhc3N3b3JkVmVyaWZpZXI7XG4gICAgICBfdGhpczQuZGV2aWNlR3JvdXBLZXkgPSBuZXdEZXZpY2VNZXRhZGF0YS5EZXZpY2VHcm91cEtleTtcbiAgICAgIF90aGlzNC5yYW5kb21QYXNzd29yZCA9IGF1dGhlbnRpY2F0aW9uSGVscGVyLmdldFJhbmRvbVBhc3N3b3JkKCk7XG5cbiAgICAgIF90aGlzNC5jbGllbnQucmVxdWVzdCgnQ29uZmlybURldmljZScsIHtcbiAgICAgICAgRGV2aWNlS2V5OiBuZXdEZXZpY2VNZXRhZGF0YS5EZXZpY2VLZXksXG4gICAgICAgIEFjY2Vzc1Rva2VuOiBfdGhpczQuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgICBEZXZpY2VTZWNyZXRWZXJpZmllckNvbmZpZzogZGV2aWNlU2VjcmV0VmVyaWZpZXJDb25maWcsXG4gICAgICAgIERldmljZU5hbWU6IHVzZXJBZ2VudFxuICAgICAgfSwgZnVuY3Rpb24gKGVyckNvbmZpcm0sIGRhdGFDb25maXJtKSB7XG4gICAgICAgIGlmIChlcnJDb25maXJtKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnJDb25maXJtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzNC5kZXZpY2VLZXkgPSBkYXRhQXV0aGVudGljYXRlLkF1dGhlbnRpY2F0aW9uUmVzdWx0Lk5ld0RldmljZU1ldGFkYXRhLkRldmljZUtleTtcblxuICAgICAgICBfdGhpczQuY2FjaGVEZXZpY2VLZXlBbmRQYXNzd29yZCgpO1xuXG4gICAgICAgIGlmIChkYXRhQ29uZmlybS5Vc2VyQ29uZmlybWF0aW9uTmVjZXNzYXJ5ID09PSB0cnVlKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcyhfdGhpczQuc2lnbkluVXNlclNlc3Npb24sIGRhdGFDb25maXJtLlVzZXJDb25maXJtYXRpb25OZWNlc3NhcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcyhfdGhpczQuc2lnbkluVXNlclNlc3Npb24pO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgdXNlciB0byBjb21wbGV0ZSB0aGUgTkVXX1BBU1NXT1JEX1JFUVVJUkVEIGNoYWxsZW5nZS5cbiAgICogUGFzcyB0aGUgbmV3IHBhc3N3b3JkIHdpdGggYW55IG5ldyB1c2VyIGF0dHJpYnV0ZXMgdG8gYmUgdXBkYXRlZC5cbiAgICogVXNlciBhdHRyaWJ1dGUga2V5cyBtdXN0IGJlIG9mIGZvcm1hdCB1c2VyQXR0cmlidXRlcy48YXR0cmlidXRlX25hbWU+LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFzc3dvcmQgbmV3IHBhc3N3b3JkIGZvciB0aGlzIHVzZXJcbiAgICogQHBhcmFtIHtvYmplY3R9IHJlcXVpcmVkQXR0cmlidXRlRGF0YSBtYXAgd2l0aCB2YWx1ZXMgZm9yIGFsbCByZXF1aXJlZCBhdHRyaWJ1dGVzXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjYWxsYmFjayBSZXN1bHQgY2FsbGJhY2sgbWFwLlxuICAgKiBAcGFyYW0ge29uRmFpbHVyZX0gY2FsbGJhY2sub25GYWlsdXJlIENhbGxlZCBvbiBhbnkgZXJyb3IuXG4gICAqIEBwYXJhbSB7bWZhUmVxdWlyZWR9IGNhbGxiYWNrLm1mYVJlcXVpcmVkIE1GQSBjb2RlIHJlcXVpcmVkIHRvIGNvbnRpbnVlLlxuICAgKiBAcGFyYW0ge2N1c3RvbUNoYWxsZW5nZX0gY2FsbGJhY2suY3VzdG9tQ2hhbGxlbmdlIEN1c3RvbSBjaGFsbGVuZ2VcbiAgICogICAgICAgICByZXNwb25zZSByZXF1aXJlZCB0byBjb250aW51ZS5cbiAgICogQHBhcmFtIHthdXRoU3VjY2Vzc30gY2FsbGJhY2sub25TdWNjZXNzIENhbGxlZCBvbiBzdWNjZXNzIHdpdGggdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge0NsaWVudE1ldGFkYXRhfSBjbGllbnRNZXRhZGF0YSBvYmplY3Qgd2hpY2ggaXMgcGFzc2VkIGZyb20gY2xpZW50IHRvIENvZ25pdG8gTGFtYmRhIHRyaWdnZXJcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmNvbXBsZXRlTmV3UGFzc3dvcmRDaGFsbGVuZ2UgPSBmdW5jdGlvbiBjb21wbGV0ZU5ld1Bhc3N3b3JkQ2hhbGxlbmdlKG5ld1Bhc3N3b3JkLCByZXF1aXJlZEF0dHJpYnV0ZURhdGEsIGNhbGxiYWNrLCBjbGllbnRNZXRhZGF0YSkge1xuICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgaWYgKCFuZXdQYXNzd29yZCkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShuZXcgRXJyb3IoJ05ldyBwYXNzd29yZCBpcyByZXF1aXJlZC4nKSk7XG4gICAgfVxuXG4gICAgdmFyIGF1dGhlbnRpY2F0aW9uSGVscGVyID0gbmV3IF9BdXRoZW50aWNhdGlvbkhlbHBlcltcImRlZmF1bHRcIl0odGhpcy5wb29sLmdldFVzZXJQb29sSWQoKS5zcGxpdCgnXycpWzFdKTtcbiAgICB2YXIgdXNlckF0dHJpYnV0ZXNQcmVmaXggPSBhdXRoZW50aWNhdGlvbkhlbHBlci5nZXROZXdQYXNzd29yZFJlcXVpcmVkQ2hhbGxlbmdlVXNlckF0dHJpYnV0ZVByZWZpeCgpO1xuICAgIHZhciBmaW5hbFVzZXJBdHRyaWJ1dGVzID0ge307XG5cbiAgICBpZiAocmVxdWlyZWRBdHRyaWJ1dGVEYXRhKSB7XG4gICAgICBPYmplY3Qua2V5cyhyZXF1aXJlZEF0dHJpYnV0ZURhdGEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBmaW5hbFVzZXJBdHRyaWJ1dGVzW3VzZXJBdHRyaWJ1dGVzUHJlZml4ICsga2V5XSA9IHJlcXVpcmVkQXR0cmlidXRlRGF0YVtrZXldO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZmluYWxVc2VyQXR0cmlidXRlcy5ORVdfUEFTU1dPUkQgPSBuZXdQYXNzd29yZDtcbiAgICBmaW5hbFVzZXJBdHRyaWJ1dGVzLlVTRVJOQU1FID0gdGhpcy51c2VybmFtZTtcbiAgICB2YXIganNvblJlcSA9IHtcbiAgICAgIENoYWxsZW5nZU5hbWU6ICdORVdfUEFTU1dPUkRfUkVRVUlSRUQnLFxuICAgICAgQ2xpZW50SWQ6IHRoaXMucG9vbC5nZXRDbGllbnRJZCgpLFxuICAgICAgQ2hhbGxlbmdlUmVzcG9uc2VzOiBmaW5hbFVzZXJBdHRyaWJ1dGVzLFxuICAgICAgU2Vzc2lvbjogdGhpcy5TZXNzaW9uLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFkYXRhXG4gICAgfTtcblxuICAgIGlmICh0aGlzLmdldFVzZXJDb250ZXh0RGF0YSgpKSB7XG4gICAgICBqc29uUmVxLlVzZXJDb250ZXh0RGF0YSA9IHRoaXMuZ2V0VXNlckNvbnRleHREYXRhKCk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnUmVzcG9uZFRvQXV0aENoYWxsZW5nZScsIGpzb25SZXEsIGZ1bmN0aW9uIChlcnJBdXRoZW50aWNhdGUsIGRhdGFBdXRoZW50aWNhdGUpIHtcbiAgICAgIGlmIChlcnJBdXRoZW50aWNhdGUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnJBdXRoZW50aWNhdGUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gX3RoaXM1LmF1dGhlbnRpY2F0ZVVzZXJJbnRlcm5hbChkYXRhQXV0aGVudGljYXRlLCBhdXRoZW50aWNhdGlvbkhlbHBlciwgY2FsbGJhY2spO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBnZXQgYSBzZXNzaW9uIHVzaW5nIGRldmljZSBhdXRoZW50aWNhdGlvbi4gSXQgaXMgY2FsbGVkIGF0IHRoZSBlbmQgb2YgdXNlclxuICAgKiBhdXRoZW50aWNhdGlvblxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gY2FsbGJhY2sgUmVzdWx0IGNhbGxiYWNrIG1hcC5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge2F1dGhTdWNjZXNzfSBjYWxsYmFjay5vblN1Y2Nlc3MgQ2FsbGVkIG9uIHN1Y2Nlc3Mgd2l0aCB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7Q2xpZW50TWV0YWRhdGF9IGNsaWVudE1ldGFkYXRhIG9iamVjdCB3aGljaCBpcyBwYXNzZWQgZnJvbSBjbGllbnQgdG8gQ29nbml0byBMYW1iZGEgdHJpZ2dlclxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0RGV2aWNlUmVzcG9uc2UgPSBmdW5jdGlvbiBnZXREZXZpY2VSZXNwb25zZShjYWxsYmFjaywgY2xpZW50TWV0YWRhdGEpIHtcbiAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgIHZhciBhdXRoZW50aWNhdGlvbkhlbHBlciA9IG5ldyBfQXV0aGVudGljYXRpb25IZWxwZXJbXCJkZWZhdWx0XCJdKHRoaXMuZGV2aWNlR3JvdXBLZXkpO1xuICAgIHZhciBkYXRlSGVscGVyID0gbmV3IF9EYXRlSGVscGVyW1wiZGVmYXVsdFwiXSgpO1xuICAgIHZhciBhdXRoUGFyYW1ldGVycyA9IHt9O1xuICAgIGF1dGhQYXJhbWV0ZXJzLlVTRVJOQU1FID0gdGhpcy51c2VybmFtZTtcbiAgICBhdXRoUGFyYW1ldGVycy5ERVZJQ0VfS0VZID0gdGhpcy5kZXZpY2VLZXk7XG4gICAgYXV0aGVudGljYXRpb25IZWxwZXIuZ2V0TGFyZ2VBVmFsdWUoZnVuY3Rpb24gKGVyckFWYWx1ZSwgYVZhbHVlKSB7XG4gICAgICAvLyBnZXRMYXJnZUFWYWx1ZSBjYWxsYmFjayBzdGFydFxuICAgICAgaWYgKGVyckFWYWx1ZSkge1xuICAgICAgICBjYWxsYmFjay5vbkZhaWx1cmUoZXJyQVZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgYXV0aFBhcmFtZXRlcnMuU1JQX0EgPSBhVmFsdWUudG9TdHJpbmcoMTYpO1xuICAgICAgdmFyIGpzb25SZXEgPSB7XG4gICAgICAgIENoYWxsZW5nZU5hbWU6ICdERVZJQ0VfU1JQX0FVVEgnLFxuICAgICAgICBDbGllbnRJZDogX3RoaXM2LnBvb2wuZ2V0Q2xpZW50SWQoKSxcbiAgICAgICAgQ2hhbGxlbmdlUmVzcG9uc2VzOiBhdXRoUGFyYW1ldGVycyxcbiAgICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFkYXRhXG4gICAgICB9O1xuXG4gICAgICBpZiAoX3RoaXM2LmdldFVzZXJDb250ZXh0RGF0YSgpKSB7XG4gICAgICAgIGpzb25SZXEuVXNlckNvbnRleHREYXRhID0gX3RoaXM2LmdldFVzZXJDb250ZXh0RGF0YSgpO1xuICAgICAgfVxuXG4gICAgICBfdGhpczYuY2xpZW50LnJlcXVlc3QoJ1Jlc3BvbmRUb0F1dGhDaGFsbGVuZ2UnLCBqc29uUmVxLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hhbGxlbmdlUGFyYW1ldGVycyA9IGRhdGEuQ2hhbGxlbmdlUGFyYW1ldGVycztcbiAgICAgICAgdmFyIHNlcnZlckJWYWx1ZSA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0oY2hhbGxlbmdlUGFyYW1ldGVycy5TUlBfQiwgMTYpO1xuICAgICAgICB2YXIgc2FsdCA9IG5ldyBfQmlnSW50ZWdlcltcImRlZmF1bHRcIl0oY2hhbGxlbmdlUGFyYW1ldGVycy5TQUxULCAxNik7XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uSGVscGVyLmdldFBhc3N3b3JkQXV0aGVudGljYXRpb25LZXkoX3RoaXM2LmRldmljZUtleSwgX3RoaXM2LnJhbmRvbVBhc3N3b3JkLCBzZXJ2ZXJCVmFsdWUsIHNhbHQsIGZ1bmN0aW9uIChlcnJIa2RmLCBoa2RmKSB7XG4gICAgICAgICAgLy8gZ2V0UGFzc3dvcmRBdXRoZW50aWNhdGlvbktleSBjYWxsYmFjayBzdGFydFxuICAgICAgICAgIGlmIChlcnJIa2RmKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVyckhrZGYpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBkYXRlTm93ID0gZGF0ZUhlbHBlci5nZXROb3dTdHJpbmcoKTtcblxuICAgICAgICAgIHZhciBtZXNzYWdlID0gX2NvcmVbXCJkZWZhdWx0XCJdLmxpYi5Xb3JkQXJyYXkuY3JlYXRlKF9idWZmZXIuQnVmZmVyLmNvbmNhdChbX2J1ZmZlci5CdWZmZXIuZnJvbShfdGhpczYuZGV2aWNlR3JvdXBLZXksICd1dGY4JyksIF9idWZmZXIuQnVmZmVyLmZyb20oX3RoaXM2LmRldmljZUtleSwgJ3V0ZjgnKSwgX2J1ZmZlci5CdWZmZXIuZnJvbShjaGFsbGVuZ2VQYXJhbWV0ZXJzLlNFQ1JFVF9CTE9DSywgJ2Jhc2U2NCcpLCBfYnVmZmVyLkJ1ZmZlci5mcm9tKGRhdGVOb3csICd1dGY4JyldKSk7XG5cbiAgICAgICAgICB2YXIga2V5ID0gX2NvcmVbXCJkZWZhdWx0XCJdLmxpYi5Xb3JkQXJyYXkuY3JlYXRlKGhrZGYpO1xuXG4gICAgICAgICAgdmFyIHNpZ25hdHVyZVN0cmluZyA9IF9lbmNCYXNlW1wiZGVmYXVsdFwiXS5zdHJpbmdpZnkoKDAsIF9obWFjU2hhW1wiZGVmYXVsdFwiXSkobWVzc2FnZSwga2V5KSk7XG5cbiAgICAgICAgICB2YXIgY2hhbGxlbmdlUmVzcG9uc2VzID0ge307XG4gICAgICAgICAgY2hhbGxlbmdlUmVzcG9uc2VzLlVTRVJOQU1FID0gX3RoaXM2LnVzZXJuYW1lO1xuICAgICAgICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5QQVNTV09SRF9DTEFJTV9TRUNSRVRfQkxPQ0sgPSBjaGFsbGVuZ2VQYXJhbWV0ZXJzLlNFQ1JFVF9CTE9DSztcbiAgICAgICAgICBjaGFsbGVuZ2VSZXNwb25zZXMuVElNRVNUQU1QID0gZGF0ZU5vdztcbiAgICAgICAgICBjaGFsbGVuZ2VSZXNwb25zZXMuUEFTU1dPUkRfQ0xBSU1fU0lHTkFUVVJFID0gc2lnbmF0dXJlU3RyaW5nO1xuICAgICAgICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5ERVZJQ0VfS0VZID0gX3RoaXM2LmRldmljZUtleTtcbiAgICAgICAgICB2YXIganNvblJlcVJlc3AgPSB7XG4gICAgICAgICAgICBDaGFsbGVuZ2VOYW1lOiAnREVWSUNFX1BBU1NXT1JEX1ZFUklGSUVSJyxcbiAgICAgICAgICAgIENsaWVudElkOiBfdGhpczYucG9vbC5nZXRDbGllbnRJZCgpLFxuICAgICAgICAgICAgQ2hhbGxlbmdlUmVzcG9uc2VzOiBjaGFsbGVuZ2VSZXNwb25zZXMsXG4gICAgICAgICAgICBTZXNzaW9uOiBkYXRhLlNlc3Npb25cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKF90aGlzNi5nZXRVc2VyQ29udGV4dERhdGEoKSkge1xuICAgICAgICAgICAganNvblJlcVJlc3AuVXNlckNvbnRleHREYXRhID0gX3RoaXM2LmdldFVzZXJDb250ZXh0RGF0YSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF90aGlzNi5jbGllbnQucmVxdWVzdCgnUmVzcG9uZFRvQXV0aENoYWxsZW5nZScsIGpzb25SZXFSZXNwLCBmdW5jdGlvbiAoZXJyQXV0aGVudGljYXRlLCBkYXRhQXV0aGVudGljYXRlKSB7XG4gICAgICAgICAgICBpZiAoZXJyQXV0aGVudGljYXRlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyQXV0aGVudGljYXRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXM2LnNpZ25JblVzZXJTZXNzaW9uID0gX3RoaXM2LmdldENvZ25pdG9Vc2VyU2Vzc2lvbihkYXRhQXV0aGVudGljYXRlLkF1dGhlbnRpY2F0aW9uUmVzdWx0KTtcblxuICAgICAgICAgICAgX3RoaXM2LmNhY2hlVG9rZW5zKCk7XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5vblN1Y2Nlc3MoX3RoaXM2LnNpZ25JblVzZXJTZXNzaW9uKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7IC8vIGdldFBhc3N3b3JkQXV0aGVudGljYXRpb25LZXkgY2FsbGJhY2sgZW5kXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfSk7IC8vIGdldExhcmdlQVZhbHVlIGNhbGxiYWNrIGVuZFxuXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCBmb3IgYSBjZXJ0YWluIHVzZXIgdG8gY29uZmlybSB0aGUgcmVnaXN0cmF0aW9uIGJ5IHVzaW5nIGEgY29uZmlybWF0aW9uIGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpcm1hdGlvbkNvZGUgQ29kZSBlbnRlcmVkIGJ5IHVzZXIuXG4gICAqIEBwYXJhbSB7Ym9vbH0gZm9yY2VBbGlhc0NyZWF0aW9uIEFsbG93IG1pZ3JhdGluZyBmcm9tIGFuIGV4aXN0aW5nIGVtYWlsIC8gcGhvbmUgbnVtYmVyLlxuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxzdHJpbmc+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHBhcmFtIHtDbGllbnRNZXRhZGF0YX0gY2xpZW50TWV0YWRhdGEgb2JqZWN0IHdoaWNoIGlzIHBhc3NlZCBmcm9tIGNsaWVudCB0byBDb2duaXRvIExhbWJkYSB0cmlnZ2VyXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5jb25maXJtUmVnaXN0cmF0aW9uID0gZnVuY3Rpb24gY29uZmlybVJlZ2lzdHJhdGlvbihjb25maXJtYXRpb25Db2RlLCBmb3JjZUFsaWFzQ3JlYXRpb24sIGNhbGxiYWNrLCBjbGllbnRNZXRhZGF0YSkge1xuICAgIHZhciBqc29uUmVxID0ge1xuICAgICAgQ2xpZW50SWQ6IHRoaXMucG9vbC5nZXRDbGllbnRJZCgpLFxuICAgICAgQ29uZmlybWF0aW9uQ29kZTogY29uZmlybWF0aW9uQ29kZSxcbiAgICAgIFVzZXJuYW1lOiB0aGlzLnVzZXJuYW1lLFxuICAgICAgRm9yY2VBbGlhc0NyZWF0aW9uOiBmb3JjZUFsaWFzQ3JlYXRpb24sXG4gICAgICBDbGllbnRNZXRhZGF0YTogY2xpZW50TWV0YWRhdGFcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuZ2V0VXNlckNvbnRleHREYXRhKCkpIHtcbiAgICAgIGpzb25SZXEuVXNlckNvbnRleHREYXRhID0gdGhpcy5nZXRVc2VyQ29udGV4dERhdGEoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdDb25maXJtU2lnblVwJywganNvblJlcSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsICdTVUNDRVNTJyk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCBieSB0aGUgdXNlciBvbmNlIGhlIGhhcyB0aGUgcmVzcG9uc2VzIHRvIGEgY3VzdG9tIGNoYWxsZW5nZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYW5zd2VyQ2hhbGxlbmdlIFRoZSBjdXN0b20gY2hhbGxlbmdlIGFuc3dlci5cbiAgICogQHBhcmFtIHtvYmplY3R9IGNhbGxiYWNrIFJlc3VsdCBjYWxsYmFjayBtYXAuXG4gICAqIEBwYXJhbSB7b25GYWlsdXJlfSBjYWxsYmFjay5vbkZhaWx1cmUgQ2FsbGVkIG9uIGFueSBlcnJvci5cbiAgICogQHBhcmFtIHtjdXN0b21DaGFsbGVuZ2V9IGNhbGxiYWNrLmN1c3RvbUNoYWxsZW5nZVxuICAgKiAgICBDdXN0b20gY2hhbGxlbmdlIHJlc3BvbnNlIHJlcXVpcmVkIHRvIGNvbnRpbnVlLlxuICAgKiBAcGFyYW0ge2F1dGhTdWNjZXNzfSBjYWxsYmFjay5vblN1Y2Nlc3MgQ2FsbGVkIG9uIHN1Y2Nlc3Mgd2l0aCB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7Q2xpZW50TWV0YWRhdGF9IGNsaWVudE1ldGFkYXRhIG9iamVjdCB3aGljaCBpcyBwYXNzZWQgZnJvbSBjbGllbnQgdG8gQ29nbml0byBMYW1iZGEgdHJpZ2dlclxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uc2VuZEN1c3RvbUNoYWxsZW5nZUFuc3dlciA9IGZ1bmN0aW9uIHNlbmRDdXN0b21DaGFsbGVuZ2VBbnN3ZXIoYW5zd2VyQ2hhbGxlbmdlLCBjYWxsYmFjaywgY2xpZW50TWV0YWRhdGEpIHtcbiAgICB2YXIgX3RoaXM3ID0gdGhpcztcblxuICAgIHZhciBjaGFsbGVuZ2VSZXNwb25zZXMgPSB7fTtcbiAgICBjaGFsbGVuZ2VSZXNwb25zZXMuVVNFUk5BTUUgPSB0aGlzLnVzZXJuYW1lO1xuICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5BTlNXRVIgPSBhbnN3ZXJDaGFsbGVuZ2U7XG4gICAgdmFyIGF1dGhlbnRpY2F0aW9uSGVscGVyID0gbmV3IF9BdXRoZW50aWNhdGlvbkhlbHBlcltcImRlZmF1bHRcIl0odGhpcy5wb29sLmdldFVzZXJQb29sSWQoKS5zcGxpdCgnXycpWzFdKTtcbiAgICB0aGlzLmdldENhY2hlZERldmljZUtleUFuZFBhc3N3b3JkKCk7XG5cbiAgICBpZiAodGhpcy5kZXZpY2VLZXkgIT0gbnVsbCkge1xuICAgICAgY2hhbGxlbmdlUmVzcG9uc2VzLkRFVklDRV9LRVkgPSB0aGlzLmRldmljZUtleTtcbiAgICB9XG5cbiAgICB2YXIganNvblJlcSA9IHtcbiAgICAgIENoYWxsZW5nZU5hbWU6ICdDVVNUT01fQ0hBTExFTkdFJyxcbiAgICAgIENoYWxsZW5nZVJlc3BvbnNlczogY2hhbGxlbmdlUmVzcG9uc2VzLFxuICAgICAgQ2xpZW50SWQ6IHRoaXMucG9vbC5nZXRDbGllbnRJZCgpLFxuICAgICAgU2Vzc2lvbjogdGhpcy5TZXNzaW9uLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFkYXRhXG4gICAgfTtcblxuICAgIGlmICh0aGlzLmdldFVzZXJDb250ZXh0RGF0YSgpKSB7XG4gICAgICBqc29uUmVxLlVzZXJDb250ZXh0RGF0YSA9IHRoaXMuZ2V0VXNlckNvbnRleHREYXRhKCk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnUmVzcG9uZFRvQXV0aENoYWxsZW5nZScsIGpzb25SZXEsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gX3RoaXM3LmF1dGhlbnRpY2F0ZVVzZXJJbnRlcm5hbChkYXRhLCBhdXRoZW50aWNhdGlvbkhlbHBlciwgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgdGhlIHVzZXIgb25jZSBoZSBoYXMgYW4gTUZBIGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpcm1hdGlvbkNvZGUgVGhlIE1GQSBjb2RlIGVudGVyZWQgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjYWxsYmFjayBSZXN1bHQgY2FsbGJhY2sgbWFwLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhVHlwZSBUaGUgbWZhIHdlIGFyZSByZXBseWluZyB0by5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge2F1dGhTdWNjZXNzfSBjYWxsYmFjay5vblN1Y2Nlc3MgQ2FsbGVkIG9uIHN1Y2Nlc3Mgd2l0aCB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7Q2xpZW50TWV0YWRhdGF9IGNsaWVudE1ldGFkYXRhIG9iamVjdCB3aGljaCBpcyBwYXNzZWQgZnJvbSBjbGllbnQgdG8gQ29nbml0byBMYW1iZGEgdHJpZ2dlclxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uc2VuZE1GQUNvZGUgPSBmdW5jdGlvbiBzZW5kTUZBQ29kZShjb25maXJtYXRpb25Db2RlLCBjYWxsYmFjaywgbWZhVHlwZSwgY2xpZW50TWV0YWRhdGEpIHtcbiAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuICAgIHZhciBjaGFsbGVuZ2VSZXNwb25zZXMgPSB7fTtcbiAgICBjaGFsbGVuZ2VSZXNwb25zZXMuVVNFUk5BTUUgPSB0aGlzLnVzZXJuYW1lO1xuICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5TTVNfTUZBX0NPREUgPSBjb25maXJtYXRpb25Db2RlO1xuICAgIHZhciBtZmFUeXBlU2VsZWN0aW9uID0gbWZhVHlwZSB8fCAnU01TX01GQSc7XG5cbiAgICBpZiAobWZhVHlwZVNlbGVjdGlvbiA9PT0gJ1NPRlRXQVJFX1RPS0VOX01GQScpIHtcbiAgICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5TT0ZUV0FSRV9UT0tFTl9NRkFfQ09ERSA9IGNvbmZpcm1hdGlvbkNvZGU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZGV2aWNlS2V5ICE9IG51bGwpIHtcbiAgICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5ERVZJQ0VfS0VZID0gdGhpcy5kZXZpY2VLZXk7XG4gICAgfVxuXG4gICAgdmFyIGpzb25SZXEgPSB7XG4gICAgICBDaGFsbGVuZ2VOYW1lOiBtZmFUeXBlU2VsZWN0aW9uLFxuICAgICAgQ2hhbGxlbmdlUmVzcG9uc2VzOiBjaGFsbGVuZ2VSZXNwb25zZXMsXG4gICAgICBDbGllbnRJZDogdGhpcy5wb29sLmdldENsaWVudElkKCksXG4gICAgICBTZXNzaW9uOiB0aGlzLlNlc3Npb24sXG4gICAgICBDbGllbnRNZXRhZGF0YTogY2xpZW50TWV0YWRhdGFcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuZ2V0VXNlckNvbnRleHREYXRhKCkpIHtcbiAgICAgIGpzb25SZXEuVXNlckNvbnRleHREYXRhID0gdGhpcy5nZXRVc2VyQ29udGV4dERhdGEoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdSZXNwb25kVG9BdXRoQ2hhbGxlbmdlJywganNvblJlcSwgZnVuY3Rpb24gKGVyciwgZGF0YUF1dGhlbnRpY2F0ZSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVycik7XG4gICAgICB9XG5cbiAgICAgIHZhciBjaGFsbGVuZ2VOYW1lID0gZGF0YUF1dGhlbnRpY2F0ZS5DaGFsbGVuZ2VOYW1lO1xuXG4gICAgICBpZiAoY2hhbGxlbmdlTmFtZSA9PT0gJ0RFVklDRV9TUlBfQVVUSCcpIHtcbiAgICAgICAgX3RoaXM4LmdldERldmljZVJlc3BvbnNlKGNhbGxiYWNrKTtcblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBfdGhpczguc2lnbkluVXNlclNlc3Npb24gPSBfdGhpczguZ2V0Q29nbml0b1VzZXJTZXNzaW9uKGRhdGFBdXRoZW50aWNhdGUuQXV0aGVudGljYXRpb25SZXN1bHQpO1xuXG4gICAgICBfdGhpczguY2FjaGVUb2tlbnMoKTtcblxuICAgICAgaWYgKGRhdGFBdXRoZW50aWNhdGUuQXV0aGVudGljYXRpb25SZXN1bHQuTmV3RGV2aWNlTWV0YWRhdGEgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sub25TdWNjZXNzKF90aGlzOC5zaWduSW5Vc2VyU2Vzc2lvbik7XG4gICAgICB9XG5cbiAgICAgIHZhciBhdXRoZW50aWNhdGlvbkhlbHBlciA9IG5ldyBfQXV0aGVudGljYXRpb25IZWxwZXJbXCJkZWZhdWx0XCJdKF90aGlzOC5wb29sLmdldFVzZXJQb29sSWQoKS5zcGxpdCgnXycpWzFdKTtcbiAgICAgIGF1dGhlbnRpY2F0aW9uSGVscGVyLmdlbmVyYXRlSGFzaERldmljZShkYXRhQXV0aGVudGljYXRlLkF1dGhlbnRpY2F0aW9uUmVzdWx0Lk5ld0RldmljZU1ldGFkYXRhLkRldmljZUdyb3VwS2V5LCBkYXRhQXV0aGVudGljYXRlLkF1dGhlbnRpY2F0aW9uUmVzdWx0Lk5ld0RldmljZU1ldGFkYXRhLkRldmljZUtleSwgZnVuY3Rpb24gKGVyckdlbkhhc2gpIHtcbiAgICAgICAgaWYgKGVyckdlbkhhc2gpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVyckdlbkhhc2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRldmljZVNlY3JldFZlcmlmaWVyQ29uZmlnID0ge1xuICAgICAgICAgIFNhbHQ6IF9idWZmZXIuQnVmZmVyLmZyb20oYXV0aGVudGljYXRpb25IZWxwZXIuZ2V0U2FsdERldmljZXMoKSwgJ2hleCcpLnRvU3RyaW5nKCdiYXNlNjQnKSxcbiAgICAgICAgICBQYXNzd29yZFZlcmlmaWVyOiBfYnVmZmVyLkJ1ZmZlci5mcm9tKGF1dGhlbnRpY2F0aW9uSGVscGVyLmdldFZlcmlmaWVyRGV2aWNlcygpLCAnaGV4JykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgICAgIH07XG4gICAgICAgIF90aGlzOC52ZXJpZmllckRldmljZXMgPSBkZXZpY2VTZWNyZXRWZXJpZmllckNvbmZpZy5QYXNzd29yZFZlcmlmaWVyO1xuICAgICAgICBfdGhpczguZGV2aWNlR3JvdXBLZXkgPSBkYXRhQXV0aGVudGljYXRlLkF1dGhlbnRpY2F0aW9uUmVzdWx0Lk5ld0RldmljZU1ldGFkYXRhLkRldmljZUdyb3VwS2V5O1xuICAgICAgICBfdGhpczgucmFuZG9tUGFzc3dvcmQgPSBhdXRoZW50aWNhdGlvbkhlbHBlci5nZXRSYW5kb21QYXNzd29yZCgpO1xuXG4gICAgICAgIF90aGlzOC5jbGllbnQucmVxdWVzdCgnQ29uZmlybURldmljZScsIHtcbiAgICAgICAgICBEZXZpY2VLZXk6IGRhdGFBdXRoZW50aWNhdGUuQXV0aGVudGljYXRpb25SZXN1bHQuTmV3RGV2aWNlTWV0YWRhdGEuRGV2aWNlS2V5LFxuICAgICAgICAgIEFjY2Vzc1Rva2VuOiBfdGhpczguc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgICAgIERldmljZVNlY3JldFZlcmlmaWVyQ29uZmlnOiBkZXZpY2VTZWNyZXRWZXJpZmllckNvbmZpZyxcbiAgICAgICAgICBEZXZpY2VOYW1lOiB1c2VyQWdlbnRcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyckNvbmZpcm0sIGRhdGFDb25maXJtKSB7XG4gICAgICAgICAgaWYgKGVyckNvbmZpcm0pIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyQ29uZmlybSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgX3RoaXM4LmRldmljZUtleSA9IGRhdGFBdXRoZW50aWNhdGUuQXV0aGVudGljYXRpb25SZXN1bHQuTmV3RGV2aWNlTWV0YWRhdGEuRGV2aWNlS2V5O1xuXG4gICAgICAgICAgX3RoaXM4LmNhY2hlRGV2aWNlS2V5QW5kUGFzc3dvcmQoKTtcblxuICAgICAgICAgIGlmIChkYXRhQ29uZmlybS5Vc2VyQ29uZmlybWF0aW9uTmVjZXNzYXJ5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sub25TdWNjZXNzKF90aGlzOC5zaWduSW5Vc2VyU2Vzc2lvbiwgZGF0YUNvbmZpcm0uVXNlckNvbmZpcm1hdGlvbk5lY2Vzc2FyeSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcyhfdGhpczguc2lnbkluVXNlclNlc3Npb24pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYW4gYXV0aGVudGljYXRlZCB1c2VyIHRvIGNoYW5nZSB0aGUgY3VycmVudCBwYXNzd29yZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkVXNlclBhc3N3b3JkIFRoZSBjdXJyZW50IHBhc3N3b3JkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3VXNlclBhc3N3b3JkIFRoZSByZXF1ZXN0ZWQgbmV3IHBhc3N3b3JkLlxuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxzdHJpbmc+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHBhcmFtIHtDbGllbnRNZXRhZGF0YX0gY2xpZW50TWV0YWRhdGEgb2JqZWN0IHdoaWNoIGlzIHBhc3NlZCBmcm9tIGNsaWVudCB0byBDb2duaXRvIExhbWJkYSB0cmlnZ2VyXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5jaGFuZ2VQYXNzd29yZCA9IGZ1bmN0aW9uIGNoYW5nZVBhc3N3b3JkKG9sZFVzZXJQYXNzd29yZCwgbmV3VXNlclBhc3N3b3JkLCBjYWxsYmFjaywgY2xpZW50TWV0YWRhdGEpIHtcbiAgICBpZiAoISh0aGlzLnNpZ25JblVzZXJTZXNzaW9uICE9IG51bGwgJiYgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5pc1ZhbGlkKCkpKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJyksIG51bGwpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ0NoYW5nZVBhc3N3b3JkJywge1xuICAgICAgUHJldmlvdXNQYXNzd29yZDogb2xkVXNlclBhc3N3b3JkLFxuICAgICAgUHJvcG9zZWRQYXNzd29yZDogbmV3VXNlclBhc3N3b3JkLFxuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFkYXRhXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsICdTVUNDRVNTJyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBlbmFibGUgTUZBIGZvciBpdHNlbGZcbiAgICogQGRlcHJlY2F0ZWRcbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8c3RyaW5nPn0gY2FsbGJhY2sgQ2FsbGVkIG9uIHN1Y2Nlc3Mgb3IgZXJyb3IuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5lbmFibGVNRkEgPSBmdW5jdGlvbiBlbmFibGVNRkEoY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignVXNlciBpcyBub3QgYXV0aGVudGljYXRlZCcpLCBudWxsKTtcbiAgICB9XG5cbiAgICB2YXIgbWZhT3B0aW9ucyA9IFtdO1xuICAgIHZhciBtZmFFbmFibGVkID0ge1xuICAgICAgRGVsaXZlcnlNZWRpdW06ICdTTVMnLFxuICAgICAgQXR0cmlidXRlTmFtZTogJ3Bob25lX251bWJlcidcbiAgICB9O1xuICAgIG1mYU9wdGlvbnMucHVzaChtZmFFbmFibGVkKTtcbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdTZXRVc2VyU2V0dGluZ3MnLCB7XG4gICAgICBNRkFPcHRpb25zOiBtZmFPcHRpb25zLFxuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsICdTVUNDRVNTJyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBlbmFibGUgTUZBIGZvciBpdHNlbGZcbiAgICogQHBhcmFtIHtJTWZhU2V0dGluZ3N9IHNtc01mYVNldHRpbmdzIHRoZSBzbXMgbWZhIHNldHRpbmdzXG4gICAqIEBwYXJhbSB7SU1GQVNldHRpbmdzfSBzb2Z0d2FyZVRva2VuTWZhU2V0dGluZ3MgdGhlIHNvZnR3YXJlIHRva2VuIG1mYSBzZXR0aW5nc1xuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxzdHJpbmc+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLnNldFVzZXJNZmFQcmVmZXJlbmNlID0gZnVuY3Rpb24gc2V0VXNlck1mYVByZWZlcmVuY2Uoc21zTWZhU2V0dGluZ3MsIHNvZnR3YXJlVG9rZW5NZmFTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignVXNlciBpcyBub3QgYXV0aGVudGljYXRlZCcpLCBudWxsKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdTZXRVc2VyTUZBUHJlZmVyZW5jZScsIHtcbiAgICAgIFNNU01mYVNldHRpbmdzOiBzbXNNZmFTZXR0aW5ncyxcbiAgICAgIFNvZnR3YXJlVG9rZW5NZmFTZXR0aW5nczogc29mdHdhcmVUb2tlbk1mYVNldHRpbmdzLFxuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsICdTVUNDRVNTJyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBkaXNhYmxlIE1GQSBmb3IgaXRzZWxmXG4gICAqIEBkZXByZWNhdGVkXG4gICAqIEBwYXJhbSB7bm9kZUNhbGxiYWNrPHN0cmluZz59IGNhbGxiYWNrIENhbGxlZCBvbiBzdWNjZXNzIG9yIGVycm9yLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZGlzYWJsZU1GQSA9IGZ1bmN0aW9uIGRpc2FibGVNRkEoY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignVXNlciBpcyBub3QgYXV0aGVudGljYXRlZCcpLCBudWxsKTtcbiAgICB9XG5cbiAgICB2YXIgbWZhT3B0aW9ucyA9IFtdO1xuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ1NldFVzZXJTZXR0aW5ncycsIHtcbiAgICAgIE1GQU9wdGlvbnM6IG1mYU9wdGlvbnMsXG4gICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKClcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgJ1NVQ0NFU1MnKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYW4gYXV0aGVudGljYXRlZCB1c2VyIHRvIGRlbGV0ZSBpdHNlbGZcbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8c3RyaW5nPn0gY2FsbGJhY2sgQ2FsbGVkIG9uIHN1Y2Nlc3Mgb3IgZXJyb3IuXG4gICAqIEBwYXJhbSB7Q2xpZW50TWV0YWRhdGF9IGNsaWVudE1ldGFkYXRhIG9iamVjdCB3aGljaCBpcyBwYXNzZWQgZnJvbSBjbGllbnQgdG8gQ29nbml0byBMYW1iZGEgdHJpZ2dlclxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZGVsZXRlVXNlciA9IGZ1bmN0aW9uIGRlbGV0ZVVzZXIoY2FsbGJhY2ssIGNsaWVudE1ldGFkYXRhKSB7XG4gICAgdmFyIF90aGlzOSA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignVXNlciBpcyBub3QgYXV0aGVudGljYXRlZCcpLCBudWxsKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdEZWxldGVVc2VyJywge1xuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFkYXRhXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXM5LmNsZWFyQ2FjaGVkVXNlcigpO1xuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgJ1NVQ0NFU1MnKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIC8qKlxuICAgKiBAdHlwZWRlZiB7Q29nbml0b1VzZXJBdHRyaWJ1dGUgfCB7IE5hbWU6c3RyaW5nLCBWYWx1ZTpzdHJpbmcgfX0gQXR0cmlidXRlQXJnXG4gICAqL1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYW4gYXV0aGVudGljYXRlZCB1c2VyIHRvIGNoYW5nZSBhIGxpc3Qgb2YgYXR0cmlidXRlc1xuICAgKiBAcGFyYW0ge0F0dHJpYnV0ZUFyZ1tdfSBhdHRyaWJ1dGVzIEEgbGlzdCBvZiB0aGUgbmV3IHVzZXIgYXR0cmlidXRlcy5cbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8c3RyaW5nPn0gY2FsbGJhY2sgQ2FsbGVkIG9uIHN1Y2Nlc3Mgb3IgZXJyb3IuXG4gICAqIEBwYXJhbSB7Q2xpZW50TWV0YWRhdGF9IGNsaWVudE1ldGFkYXRhIG9iamVjdCB3aGljaCBpcyBwYXNzZWQgZnJvbSBjbGllbnQgdG8gQ29nbml0byBMYW1iZGEgdHJpZ2dlclxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8udXBkYXRlQXR0cmlidXRlcyA9IGZ1bmN0aW9uIHVwZGF0ZUF0dHJpYnV0ZXMoYXR0cmlidXRlcywgY2FsbGJhY2ssIGNsaWVudE1ldGFkYXRhKSB7XG4gICAgaWYgKHRoaXMuc2lnbkluVXNlclNlc3Npb24gPT0gbnVsbCB8fCAhdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5pc1ZhbGlkKCkpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ1VzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQnKSwgbnVsbCk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnVXBkYXRlVXNlckF0dHJpYnV0ZXMnLCB7XG4gICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKCksXG4gICAgICBVc2VyQXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgICAgIENsaWVudE1ldGFkYXRhOiBjbGllbnRNZXRhZGF0YVxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCAnU1VDQ0VTUycpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCBieSBhbiBhdXRoZW50aWNhdGVkIHVzZXIgdG8gZ2V0IGEgbGlzdCBvZiBhdHRyaWJ1dGVzXG4gICAqIEBwYXJhbSB7bm9kZUNhbGxiYWNrPENvZ25pdG9Vc2VyQXR0cmlidXRlW10+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldFVzZXJBdHRyaWJ1dGVzID0gZnVuY3Rpb24gZ2V0VXNlckF0dHJpYnV0ZXMoY2FsbGJhY2spIHtcbiAgICBpZiAoISh0aGlzLnNpZ25JblVzZXJTZXNzaW9uICE9IG51bGwgJiYgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5pc1ZhbGlkKCkpKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJyksIG51bGwpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ0dldFVzZXInLCB7XG4gICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKClcbiAgICB9LCBmdW5jdGlvbiAoZXJyLCB1c2VyRGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGF0dHJpYnV0ZUxpc3QgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB1c2VyRGF0YS5Vc2VyQXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYXR0cmlidXRlID0ge1xuICAgICAgICAgIE5hbWU6IHVzZXJEYXRhLlVzZXJBdHRyaWJ1dGVzW2ldLk5hbWUsXG4gICAgICAgICAgVmFsdWU6IHVzZXJEYXRhLlVzZXJBdHRyaWJ1dGVzW2ldLlZhbHVlXG4gICAgICAgIH07XG4gICAgICAgIHZhciB1c2VyQXR0cmlidXRlID0gbmV3IF9Db2duaXRvVXNlckF0dHJpYnV0ZVtcImRlZmF1bHRcIl0oYXR0cmlidXRlKTtcbiAgICAgICAgYXR0cmlidXRlTGlzdC5wdXNoKHVzZXJBdHRyaWJ1dGUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgYXR0cmlidXRlTGlzdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBnZXQgdGhlIE1GQU9wdGlvbnNcbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8TUZBT3B0aW9ucz59IGNhbGxiYWNrIENhbGxlZCBvbiBzdWNjZXNzIG9yIGVycm9yLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0TUZBT3B0aW9ucyA9IGZ1bmN0aW9uIGdldE1GQU9wdGlvbnMoY2FsbGJhY2spIHtcbiAgICBpZiAoISh0aGlzLnNpZ25JblVzZXJTZXNzaW9uICE9IG51bGwgJiYgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5pc1ZhbGlkKCkpKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJyksIG51bGwpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ0dldFVzZXInLCB7XG4gICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKClcbiAgICB9LCBmdW5jdGlvbiAoZXJyLCB1c2VyRGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHVzZXJEYXRhLk1GQU9wdGlvbnMpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCBieSBhbiBhdXRoZW50aWNhdGVkIHVzZXJzIHRvIGdldCB0aGUgdXNlckRhdGFcbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8VXNlckRhdGE+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldFVzZXJEYXRhID0gZnVuY3Rpb24gZ2V0VXNlckRhdGEoY2FsbGJhY2ssIHBhcmFtcykge1xuICAgIHZhciBfdGhpczEwID0gdGhpcztcblxuICAgIGlmICghKHRoaXMuc2lnbkluVXNlclNlc3Npb24gIT0gbnVsbCAmJiB0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkpIHtcbiAgICAgIHRoaXMuY2xlYXJDYWNoZWRVc2VyRGF0YSgpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignVXNlciBpcyBub3QgYXV0aGVudGljYXRlZCcpLCBudWxsKTtcbiAgICB9XG5cbiAgICB2YXIgYnlwYXNzQ2FjaGUgPSBwYXJhbXMgPyBwYXJhbXMuYnlwYXNzQ2FjaGUgOiBmYWxzZTtcbiAgICB2YXIgdXNlckRhdGEgPSB0aGlzLnN0b3JhZ2UuZ2V0SXRlbSh0aGlzLnVzZXJEYXRhS2V5KTsgLy8gZ2V0IHRoZSBjYWNoZWQgdXNlciBkYXRhXG5cbiAgICBpZiAoIXVzZXJEYXRhIHx8IGJ5cGFzc0NhY2hlKSB7XG4gICAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdHZXRVc2VyJywge1xuICAgICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKClcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGxhdGVzdFVzZXJEYXRhKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzMTAuY2FjaGVVc2VyRGF0YShsYXRlc3RVc2VyRGF0YSk7XG5cbiAgICAgICAgdmFyIHJlZnJlc2ggPSBfdGhpczEwLnNpZ25JblVzZXJTZXNzaW9uLmdldFJlZnJlc2hUb2tlbigpO1xuXG4gICAgICAgIGlmIChyZWZyZXNoICYmIHJlZnJlc2guZ2V0VG9rZW4oKSkge1xuICAgICAgICAgIF90aGlzMTAucmVmcmVzaFNlc3Npb24ocmVmcmVzaCwgZnVuY3Rpb24gKHJlZnJlc2hFcnJvciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKHJlZnJlc2hFcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2socmVmcmVzaEVycm9yLCBudWxsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGxhdGVzdFVzZXJEYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgbGF0ZXN0VXNlckRhdGEpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIEpTT04ucGFyc2UodXNlckRhdGEpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLmNsZWFyQ2FjaGVkVXNlckRhdGEoKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBkZWxldGUgYSBsaXN0IG9mIGF0dHJpYnV0ZXNcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gYXR0cmlidXRlTGlzdCBOYW1lcyBvZiB0aGUgYXR0cmlidXRlcyB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7bm9kZUNhbGxiYWNrPHN0cmluZz59IGNhbGxiYWNrIENhbGxlZCBvbiBzdWNjZXNzIG9yIGVycm9yLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZGVsZXRlQXR0cmlidXRlcyA9IGZ1bmN0aW9uIGRlbGV0ZUF0dHJpYnV0ZXMoYXR0cmlidXRlTGlzdCwgY2FsbGJhY2spIHtcbiAgICBpZiAoISh0aGlzLnNpZ25JblVzZXJTZXNzaW9uICE9IG51bGwgJiYgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5pc1ZhbGlkKCkpKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJyksIG51bGwpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ0RlbGV0ZVVzZXJBdHRyaWJ1dGVzJywge1xuICAgICAgVXNlckF0dHJpYnV0ZU5hbWVzOiBhdHRyaWJ1dGVMaXN0LFxuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsICdTVUNDRVNTJyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGEgdXNlciB0byByZXNlbmQgYSBjb25maXJtYXRpb24gY29kZVxuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxzdHJpbmc+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHBhcmFtIHtDbGllbnRNZXRhZGF0YX0gY2xpZW50TWV0YWRhdGEgb2JqZWN0IHdoaWNoIGlzIHBhc3NlZCBmcm9tIGNsaWVudCB0byBDb2duaXRvIExhbWJkYSB0cmlnZ2VyXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5yZXNlbmRDb25maXJtYXRpb25Db2RlID0gZnVuY3Rpb24gcmVzZW5kQ29uZmlybWF0aW9uQ29kZShjYWxsYmFjaywgY2xpZW50TWV0YWRhdGEpIHtcbiAgICB2YXIganNvblJlcSA9IHtcbiAgICAgIENsaWVudElkOiB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKSxcbiAgICAgIFVzZXJuYW1lOiB0aGlzLnVzZXJuYW1lLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFkYXRhXG4gICAgfTtcbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdSZXNlbmRDb25maXJtYXRpb25Db2RlJywganNvblJlcSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcmVzdWx0KTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIGdldCBhIHNlc3Npb24sIGVpdGhlciBmcm9tIHRoZSBzZXNzaW9uIG9iamVjdFxuICAgKiBvciBmcm9tICB0aGUgbG9jYWwgc3RvcmFnZSwgb3IgYnkgdXNpbmcgYSByZWZyZXNoIHRva2VuXG4gICAqXG4gICAqIEBwYXJhbSB7bm9kZUNhbGxiYWNrPENvZ25pdG9Vc2VyU2Vzc2lvbj59IGNhbGxiYWNrIENhbGxlZCBvbiBzdWNjZXNzIG9yIGVycm9yLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0U2Vzc2lvbiA9IGZ1bmN0aW9uIGdldFNlc3Npb24oY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy51c2VybmFtZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdVc2VybmFtZSBpcyBudWxsLiBDYW5ub3QgcmV0cmlldmUgYSBuZXcgc2Vzc2lvbicpLCBudWxsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiAhPSBudWxsICYmIHRoaXMuc2lnbkluVXNlclNlc3Npb24uaXNWYWxpZCgpKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbik7XG4gICAgfVxuXG4gICAgdmFyIGtleVByZWZpeCA9IFwiQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLlwiICsgdGhpcy5wb29sLmdldENsaWVudElkKCkgKyBcIi5cIiArIHRoaXMudXNlcm5hbWU7XG4gICAgdmFyIGlkVG9rZW5LZXkgPSBrZXlQcmVmaXggKyBcIi5pZFRva2VuXCI7XG4gICAgdmFyIGFjY2Vzc1Rva2VuS2V5ID0ga2V5UHJlZml4ICsgXCIuYWNjZXNzVG9rZW5cIjtcbiAgICB2YXIgcmVmcmVzaFRva2VuS2V5ID0ga2V5UHJlZml4ICsgXCIucmVmcmVzaFRva2VuXCI7XG4gICAgdmFyIGNsb2NrRHJpZnRLZXkgPSBrZXlQcmVmaXggKyBcIi5jbG9ja0RyaWZ0XCI7XG5cbiAgICBpZiAodGhpcy5zdG9yYWdlLmdldEl0ZW0oaWRUb2tlbktleSkpIHtcbiAgICAgIHZhciBpZFRva2VuID0gbmV3IF9Db2duaXRvSWRUb2tlbltcImRlZmF1bHRcIl0oe1xuICAgICAgICBJZFRva2VuOiB0aGlzLnN0b3JhZ2UuZ2V0SXRlbShpZFRva2VuS2V5KVxuICAgICAgfSk7XG4gICAgICB2YXIgYWNjZXNzVG9rZW4gPSBuZXcgX0NvZ25pdG9BY2Nlc3NUb2tlbltcImRlZmF1bHRcIl0oe1xuICAgICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zdG9yYWdlLmdldEl0ZW0oYWNjZXNzVG9rZW5LZXkpXG4gICAgICB9KTtcbiAgICAgIHZhciByZWZyZXNoVG9rZW4gPSBuZXcgX0NvZ25pdG9SZWZyZXNoVG9rZW5bXCJkZWZhdWx0XCJdKHtcbiAgICAgICAgUmVmcmVzaFRva2VuOiB0aGlzLnN0b3JhZ2UuZ2V0SXRlbShyZWZyZXNoVG9rZW5LZXkpXG4gICAgICB9KTtcbiAgICAgIHZhciBjbG9ja0RyaWZ0ID0gcGFyc2VJbnQodGhpcy5zdG9yYWdlLmdldEl0ZW0oY2xvY2tEcmlmdEtleSksIDApIHx8IDA7XG4gICAgICB2YXIgc2Vzc2lvbkRhdGEgPSB7XG4gICAgICAgIElkVG9rZW46IGlkVG9rZW4sXG4gICAgICAgIEFjY2Vzc1Rva2VuOiBhY2Nlc3NUb2tlbixcbiAgICAgICAgUmVmcmVzaFRva2VuOiByZWZyZXNoVG9rZW4sXG4gICAgICAgIENsb2NrRHJpZnQ6IGNsb2NrRHJpZnRcbiAgICAgIH07XG4gICAgICB2YXIgY2FjaGVkU2Vzc2lvbiA9IG5ldyBfQ29nbml0b1VzZXJTZXNzaW9uW1wiZGVmYXVsdFwiXShzZXNzaW9uRGF0YSk7XG5cbiAgICAgIGlmIChjYWNoZWRTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgICB0aGlzLnNpZ25JblVzZXJTZXNzaW9uID0gY2FjaGVkU2Vzc2lvbjtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHRoaXMuc2lnbkluVXNlclNlc3Npb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJlZnJlc2hUb2tlbi5nZXRUb2tlbigpKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ0Nhbm5vdCByZXRyaWV2ZSBhIG5ldyBzZXNzaW9uLiBQbGVhc2UgYXV0aGVudGljYXRlLicpLCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZWZyZXNoU2Vzc2lvbihyZWZyZXNoVG9rZW4sIGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdMb2NhbCBzdG9yYWdlIGlzIG1pc3NpbmcgYW4gSUQgVG9rZW4sIFBsZWFzZSBhdXRoZW50aWNhdGUnKSwgbnVsbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICAvKipcbiAgICogVGhpcyB1c2VzIHRoZSByZWZyZXNoVG9rZW4gdG8gcmV0cmlldmUgYSBuZXcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge0NvZ25pdG9SZWZyZXNoVG9rZW59IHJlZnJlc2hUb2tlbiBBIHByZXZpb3VzIHNlc3Npb24ncyByZWZyZXNoIHRva2VuLlxuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxDb2duaXRvVXNlclNlc3Npb24+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHBhcmFtIHtDbGllbnRNZXRhZGF0YX0gY2xpZW50TWV0YWRhdGEgb2JqZWN0IHdoaWNoIGlzIHBhc3NlZCBmcm9tIGNsaWVudCB0byBDb2duaXRvIExhbWJkYSB0cmlnZ2VyXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5yZWZyZXNoU2Vzc2lvbiA9IGZ1bmN0aW9uIHJlZnJlc2hTZXNzaW9uKHJlZnJlc2hUb2tlbiwgY2FsbGJhY2ssIGNsaWVudE1ldGFkYXRhKSB7XG4gICAgdmFyIF90aGlzMTEgPSB0aGlzO1xuXG4gICAgdmFyIGF1dGhQYXJhbWV0ZXJzID0ge307XG4gICAgYXV0aFBhcmFtZXRlcnMuUkVGUkVTSF9UT0tFTiA9IHJlZnJlc2hUb2tlbi5nZXRUb2tlbigpO1xuICAgIHZhciBrZXlQcmVmaXggPSBcIkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5cIiArIHRoaXMucG9vbC5nZXRDbGllbnRJZCgpO1xuICAgIHZhciBsYXN0VXNlcktleSA9IGtleVByZWZpeCArIFwiLkxhc3RBdXRoVXNlclwiO1xuXG4gICAgaWYgKHRoaXMuc3RvcmFnZS5nZXRJdGVtKGxhc3RVc2VyS2V5KSkge1xuICAgICAgdGhpcy51c2VybmFtZSA9IHRoaXMuc3RvcmFnZS5nZXRJdGVtKGxhc3RVc2VyS2V5KTtcbiAgICAgIHZhciBkZXZpY2VLZXlLZXkgPSBrZXlQcmVmaXggKyBcIi5cIiArIHRoaXMudXNlcm5hbWUgKyBcIi5kZXZpY2VLZXlcIjtcbiAgICAgIHRoaXMuZGV2aWNlS2V5ID0gdGhpcy5zdG9yYWdlLmdldEl0ZW0oZGV2aWNlS2V5S2V5KTtcbiAgICAgIGF1dGhQYXJhbWV0ZXJzLkRFVklDRV9LRVkgPSB0aGlzLmRldmljZUtleTtcbiAgICB9XG5cbiAgICB2YXIganNvblJlcSA9IHtcbiAgICAgIENsaWVudElkOiB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKSxcbiAgICAgIEF1dGhGbG93OiAnUkVGUkVTSF9UT0tFTl9BVVRIJyxcbiAgICAgIEF1dGhQYXJhbWV0ZXJzOiBhdXRoUGFyYW1ldGVycyxcbiAgICAgIENsaWVudE1ldGFkYXRhOiBjbGllbnRNZXRhZGF0YVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5nZXRVc2VyQ29udGV4dERhdGEoKSkge1xuICAgICAganNvblJlcS5Vc2VyQ29udGV4dERhdGEgPSB0aGlzLmdldFVzZXJDb250ZXh0RGF0YSgpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ0luaXRpYXRlQXV0aCcsIGpzb25SZXEsIGZ1bmN0aW9uIChlcnIsIGF1dGhSZXN1bHQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgaWYgKGVyci5jb2RlID09PSAnTm90QXV0aG9yaXplZEV4Y2VwdGlvbicpIHtcbiAgICAgICAgICBfdGhpczExLmNsZWFyQ2FjaGVkVXNlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhdXRoUmVzdWx0KSB7XG4gICAgICAgIHZhciBhdXRoZW50aWNhdGlvblJlc3VsdCA9IGF1dGhSZXN1bHQuQXV0aGVudGljYXRpb25SZXN1bHQ7XG5cbiAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXV0aGVudGljYXRpb25SZXN1bHQsICdSZWZyZXNoVG9rZW4nKSkge1xuICAgICAgICAgIGF1dGhlbnRpY2F0aW9uUmVzdWx0LlJlZnJlc2hUb2tlbiA9IHJlZnJlc2hUb2tlbi5nZXRUb2tlbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXMxMS5zaWduSW5Vc2VyU2Vzc2lvbiA9IF90aGlzMTEuZ2V0Q29nbml0b1VzZXJTZXNzaW9uKGF1dGhlbnRpY2F0aW9uUmVzdWx0KTtcblxuICAgICAgICBfdGhpczExLmNhY2hlVG9rZW5zKCk7XG5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIF90aGlzMTEuc2lnbkluVXNlclNlc3Npb24pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gc2F2ZSB0aGUgc2Vzc2lvbiB0b2tlbnMgdG8gbG9jYWwgc3RvcmFnZVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uY2FjaGVUb2tlbnMgPSBmdW5jdGlvbiBjYWNoZVRva2VucygpIHtcbiAgICB2YXIga2V5UHJlZml4ID0gXCJDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuXCIgKyB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKTtcbiAgICB2YXIgaWRUb2tlbktleSA9IGtleVByZWZpeCArIFwiLlwiICsgdGhpcy51c2VybmFtZSArIFwiLmlkVG9rZW5cIjtcbiAgICB2YXIgYWNjZXNzVG9rZW5LZXkgPSBrZXlQcmVmaXggKyBcIi5cIiArIHRoaXMudXNlcm5hbWUgKyBcIi5hY2Nlc3NUb2tlblwiO1xuICAgIHZhciByZWZyZXNoVG9rZW5LZXkgPSBrZXlQcmVmaXggKyBcIi5cIiArIHRoaXMudXNlcm5hbWUgKyBcIi5yZWZyZXNoVG9rZW5cIjtcbiAgICB2YXIgY2xvY2tEcmlmdEtleSA9IGtleVByZWZpeCArIFwiLlwiICsgdGhpcy51c2VybmFtZSArIFwiLmNsb2NrRHJpZnRcIjtcbiAgICB2YXIgbGFzdFVzZXJLZXkgPSBrZXlQcmVmaXggKyBcIi5MYXN0QXV0aFVzZXJcIjtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShpZFRva2VuS2V5LCB0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmdldElkVG9rZW4oKS5nZXRKd3RUb2tlbigpKTtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShhY2Nlc3NUb2tlbktleSwgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKCkpO1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKHJlZnJlc2hUb2tlbktleSwgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRSZWZyZXNoVG9rZW4oKS5nZXRUb2tlbigpKTtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShjbG9ja0RyaWZ0S2V5LCBcIlwiICsgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRDbG9ja0RyaWZ0KCkpO1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKGxhc3RVc2VyS2V5LCB0aGlzLnVzZXJuYW1lKTtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB0byBjYWNoZSB1c2VyIGRhdGFcbiAgICovXG4gIDtcblxuICBfcHJvdG8uY2FjaGVVc2VyRGF0YSA9IGZ1bmN0aW9uIGNhY2hlVXNlckRhdGEodXNlckRhdGEpIHtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnVzZXJEYXRhS2V5LCBKU09OLnN0cmluZ2lmeSh1c2VyRGF0YSkpO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHRvIHJlbW92ZSBjYWNoZWQgdXNlciBkYXRhXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmNsZWFyQ2FjaGVkVXNlckRhdGEgPSBmdW5jdGlvbiBjbGVhckNhY2hlZFVzZXJEYXRhKCkge1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMudXNlckRhdGFLZXkpO1xuICB9O1xuXG4gIF9wcm90by5jbGVhckNhY2hlZFVzZXIgPSBmdW5jdGlvbiBjbGVhckNhY2hlZFVzZXIoKSB7XG4gICAgdGhpcy5jbGVhckNhY2hlZFRva2VucygpO1xuICAgIHRoaXMuY2xlYXJDYWNoZWRVc2VyRGF0YSgpO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gY2FjaGUgdGhlIGRldmljZSBrZXkgYW5kIGRldmljZSBncm91cCBhbmQgZGV2aWNlIHBhc3N3b3JkXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5jYWNoZURldmljZUtleUFuZFBhc3N3b3JkID0gZnVuY3Rpb24gY2FjaGVEZXZpY2VLZXlBbmRQYXNzd29yZCgpIHtcbiAgICB2YXIga2V5UHJlZml4ID0gXCJDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuXCIgKyB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKSArIFwiLlwiICsgdGhpcy51c2VybmFtZTtcbiAgICB2YXIgZGV2aWNlS2V5S2V5ID0ga2V5UHJlZml4ICsgXCIuZGV2aWNlS2V5XCI7XG4gICAgdmFyIHJhbmRvbVBhc3N3b3JkS2V5ID0ga2V5UHJlZml4ICsgXCIucmFuZG9tUGFzc3dvcmRLZXlcIjtcbiAgICB2YXIgZGV2aWNlR3JvdXBLZXlLZXkgPSBrZXlQcmVmaXggKyBcIi5kZXZpY2VHcm91cEtleVwiO1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKGRldmljZUtleUtleSwgdGhpcy5kZXZpY2VLZXkpO1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKHJhbmRvbVBhc3N3b3JkS2V5LCB0aGlzLnJhbmRvbVBhc3N3b3JkKTtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShkZXZpY2VHcm91cEtleUtleSwgdGhpcy5kZXZpY2VHcm91cEtleSk7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBnZXQgY3VycmVudCBkZXZpY2Uga2V5IGFuZCBkZXZpY2UgZ3JvdXAgYW5kIGRldmljZSBwYXNzd29yZFxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0Q2FjaGVkRGV2aWNlS2V5QW5kUGFzc3dvcmQgPSBmdW5jdGlvbiBnZXRDYWNoZWREZXZpY2VLZXlBbmRQYXNzd29yZCgpIHtcbiAgICB2YXIga2V5UHJlZml4ID0gXCJDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuXCIgKyB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKSArIFwiLlwiICsgdGhpcy51c2VybmFtZTtcbiAgICB2YXIgZGV2aWNlS2V5S2V5ID0ga2V5UHJlZml4ICsgXCIuZGV2aWNlS2V5XCI7XG4gICAgdmFyIHJhbmRvbVBhc3N3b3JkS2V5ID0ga2V5UHJlZml4ICsgXCIucmFuZG9tUGFzc3dvcmRLZXlcIjtcbiAgICB2YXIgZGV2aWNlR3JvdXBLZXlLZXkgPSBrZXlQcmVmaXggKyBcIi5kZXZpY2VHcm91cEtleVwiO1xuXG4gICAgaWYgKHRoaXMuc3RvcmFnZS5nZXRJdGVtKGRldmljZUtleUtleSkpIHtcbiAgICAgIHRoaXMuZGV2aWNlS2V5ID0gdGhpcy5zdG9yYWdlLmdldEl0ZW0oZGV2aWNlS2V5S2V5KTtcbiAgICAgIHRoaXMucmFuZG9tUGFzc3dvcmQgPSB0aGlzLnN0b3JhZ2UuZ2V0SXRlbShyYW5kb21QYXNzd29yZEtleSk7XG4gICAgICB0aGlzLmRldmljZUdyb3VwS2V5ID0gdGhpcy5zdG9yYWdlLmdldEl0ZW0oZGV2aWNlR3JvdXBLZXlLZXkpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIGNsZWFyIHRoZSBkZXZpY2Uga2V5IGluZm8gZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5jbGVhckNhY2hlZERldmljZUtleUFuZFBhc3N3b3JkID0gZnVuY3Rpb24gY2xlYXJDYWNoZWREZXZpY2VLZXlBbmRQYXNzd29yZCgpIHtcbiAgICB2YXIga2V5UHJlZml4ID0gXCJDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuXCIgKyB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKSArIFwiLlwiICsgdGhpcy51c2VybmFtZTtcbiAgICB2YXIgZGV2aWNlS2V5S2V5ID0ga2V5UHJlZml4ICsgXCIuZGV2aWNlS2V5XCI7XG4gICAgdmFyIHJhbmRvbVBhc3N3b3JkS2V5ID0ga2V5UHJlZml4ICsgXCIucmFuZG9tUGFzc3dvcmRLZXlcIjtcbiAgICB2YXIgZGV2aWNlR3JvdXBLZXlLZXkgPSBrZXlQcmVmaXggKyBcIi5kZXZpY2VHcm91cEtleVwiO1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKGRldmljZUtleUtleSk7XG4gICAgdGhpcy5zdG9yYWdlLnJlbW92ZUl0ZW0ocmFuZG9tUGFzc3dvcmRLZXkpO1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKGRldmljZUdyb3VwS2V5S2V5KTtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIGNsZWFyIHRoZSBzZXNzaW9uIHRva2VucyBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmNsZWFyQ2FjaGVkVG9rZW5zID0gZnVuY3Rpb24gY2xlYXJDYWNoZWRUb2tlbnMoKSB7XG4gICAgdmFyIGtleVByZWZpeCA9IFwiQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLlwiICsgdGhpcy5wb29sLmdldENsaWVudElkKCk7XG4gICAgdmFyIGlkVG9rZW5LZXkgPSBrZXlQcmVmaXggKyBcIi5cIiArIHRoaXMudXNlcm5hbWUgKyBcIi5pZFRva2VuXCI7XG4gICAgdmFyIGFjY2Vzc1Rva2VuS2V5ID0ga2V5UHJlZml4ICsgXCIuXCIgKyB0aGlzLnVzZXJuYW1lICsgXCIuYWNjZXNzVG9rZW5cIjtcbiAgICB2YXIgcmVmcmVzaFRva2VuS2V5ID0ga2V5UHJlZml4ICsgXCIuXCIgKyB0aGlzLnVzZXJuYW1lICsgXCIucmVmcmVzaFRva2VuXCI7XG4gICAgdmFyIGxhc3RVc2VyS2V5ID0ga2V5UHJlZml4ICsgXCIuTGFzdEF1dGhVc2VyXCI7XG4gICAgdmFyIGNsb2NrRHJpZnRLZXkgPSBrZXlQcmVmaXggKyBcIi5cIiArIHRoaXMudXNlcm5hbWUgKyBcIi5jbG9ja0RyaWZ0XCI7XG4gICAgdGhpcy5zdG9yYWdlLnJlbW92ZUl0ZW0oaWRUb2tlbktleSk7XG4gICAgdGhpcy5zdG9yYWdlLnJlbW92ZUl0ZW0oYWNjZXNzVG9rZW5LZXkpO1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKHJlZnJlc2hUb2tlbktleSk7XG4gICAgdGhpcy5zdG9yYWdlLnJlbW92ZUl0ZW0obGFzdFVzZXJLZXkpO1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKGNsb2NrRHJpZnRLZXkpO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gYnVpbGQgYSB1c2VyIHNlc3Npb24gZnJvbSB0b2tlbnMgcmV0cmlldmVkIGluIHRoZSBhdXRoZW50aWNhdGlvbiByZXN1bHRcbiAgICogQHBhcmFtIHtvYmplY3R9IGF1dGhSZXN1bHQgU3VjY2Vzc2Z1bCBhdXRoIHJlc3BvbnNlIGZyb20gc2VydmVyLlxuICAgKiBAcmV0dXJucyB7Q29nbml0b1VzZXJTZXNzaW9ufSBUaGUgbmV3IHVzZXIgc2Vzc2lvbi5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0Q29nbml0b1VzZXJTZXNzaW9uID0gZnVuY3Rpb24gZ2V0Q29nbml0b1VzZXJTZXNzaW9uKGF1dGhSZXN1bHQpIHtcbiAgICB2YXIgaWRUb2tlbiA9IG5ldyBfQ29nbml0b0lkVG9rZW5bXCJkZWZhdWx0XCJdKGF1dGhSZXN1bHQpO1xuICAgIHZhciBhY2Nlc3NUb2tlbiA9IG5ldyBfQ29nbml0b0FjY2Vzc1Rva2VuW1wiZGVmYXVsdFwiXShhdXRoUmVzdWx0KTtcbiAgICB2YXIgcmVmcmVzaFRva2VuID0gbmV3IF9Db2duaXRvUmVmcmVzaFRva2VuW1wiZGVmYXVsdFwiXShhdXRoUmVzdWx0KTtcbiAgICB2YXIgc2Vzc2lvbkRhdGEgPSB7XG4gICAgICBJZFRva2VuOiBpZFRva2VuLFxuICAgICAgQWNjZXNzVG9rZW46IGFjY2Vzc1Rva2VuLFxuICAgICAgUmVmcmVzaFRva2VuOiByZWZyZXNoVG9rZW5cbiAgICB9O1xuICAgIHJldHVybiBuZXcgX0NvZ25pdG9Vc2VyU2Vzc2lvbltcImRlZmF1bHRcIl0oc2Vzc2lvbkRhdGEpO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gaW5pdGlhdGUgYSBmb3Jnb3QgcGFzc3dvcmQgcmVxdWVzdFxuICAgKiBAcGFyYW0ge29iamVjdH0gY2FsbGJhY2sgUmVzdWx0IGNhbGxiYWNrIG1hcC5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge2lucHV0VmVyaWZpY2F0aW9uQ29kZT99IGNhbGxiYWNrLmlucHV0VmVyaWZpY2F0aW9uQ29kZVxuICAgKiAgICBPcHRpb25hbCBjYWxsYmFjayByYWlzZWQgaW5zdGVhZCBvZiBvblN1Y2Nlc3Mgd2l0aCByZXNwb25zZSBkYXRhLlxuICAgKiBAcGFyYW0ge29uU3VjY2Vzc30gY2FsbGJhY2sub25TdWNjZXNzIENhbGxlZCBvbiBzdWNjZXNzLlxuICAgKiBAcGFyYW0ge0NsaWVudE1ldGFkYXRhfSBjbGllbnRNZXRhZGF0YSBvYmplY3Qgd2hpY2ggaXMgcGFzc2VkIGZyb20gY2xpZW50IHRvIENvZ25pdG8gTGFtYmRhIHRyaWdnZXJcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmZvcmdvdFBhc3N3b3JkID0gZnVuY3Rpb24gZm9yZ290UGFzc3dvcmQoY2FsbGJhY2ssIGNsaWVudE1ldGFkYXRhKSB7XG4gICAgdmFyIGpzb25SZXEgPSB7XG4gICAgICBDbGllbnRJZDogdGhpcy5wb29sLmdldENsaWVudElkKCksXG4gICAgICBVc2VybmFtZTogdGhpcy51c2VybmFtZSxcbiAgICAgIENsaWVudE1ldGFkYXRhOiBjbGllbnRNZXRhZGF0YVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5nZXRVc2VyQ29udGV4dERhdGEoKSkge1xuICAgICAganNvblJlcS5Vc2VyQ29udGV4dERhdGEgPSB0aGlzLmdldFVzZXJDb250ZXh0RGF0YSgpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ0ZvcmdvdFBhc3N3b3JkJywganNvblJlcSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVycik7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2suaW5wdXRWZXJpZmljYXRpb25Db2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5pbnB1dFZlcmlmaWNhdGlvbkNvZGUoZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWxsYmFjay5vblN1Y2Nlc3MoZGF0YSk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBjb25maXJtIGEgbmV3IHBhc3N3b3JkIHVzaW5nIGEgY29uZmlybWF0aW9uQ29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlybWF0aW9uQ29kZSBDb2RlIGVudGVyZWQgYnkgdXNlci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1Bhc3N3b3JkIENvbmZpcm0gbmV3IHBhc3N3b3JkLlxuICAgKiBAcGFyYW0ge29iamVjdH0gY2FsbGJhY2sgUmVzdWx0IGNhbGxiYWNrIG1hcC5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge29uU3VjY2Vzczx2b2lkPn0gY2FsbGJhY2sub25TdWNjZXNzIENhbGxlZCBvbiBzdWNjZXNzLlxuICAgKiBAcGFyYW0ge0NsaWVudE1ldGFkYXRhfSBjbGllbnRNZXRhZGF0YSBvYmplY3Qgd2hpY2ggaXMgcGFzc2VkIGZyb20gY2xpZW50IHRvIENvZ25pdG8gTGFtYmRhIHRyaWdnZXJcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmNvbmZpcm1QYXNzd29yZCA9IGZ1bmN0aW9uIGNvbmZpcm1QYXNzd29yZChjb25maXJtYXRpb25Db2RlLCBuZXdQYXNzd29yZCwgY2FsbGJhY2ssIGNsaWVudE1ldGFkYXRhKSB7XG4gICAgdmFyIGpzb25SZXEgPSB7XG4gICAgICBDbGllbnRJZDogdGhpcy5wb29sLmdldENsaWVudElkKCksXG4gICAgICBVc2VybmFtZTogdGhpcy51c2VybmFtZSxcbiAgICAgIENvbmZpcm1hdGlvbkNvZGU6IGNvbmZpcm1hdGlvbkNvZGUsXG4gICAgICBQYXNzd29yZDogbmV3UGFzc3dvcmQsXG4gICAgICBDbGllbnRNZXRhZGF0YTogY2xpZW50TWV0YWRhdGFcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuZ2V0VXNlckNvbnRleHREYXRhKCkpIHtcbiAgICAgIGpzb25SZXEuVXNlckNvbnRleHREYXRhID0gdGhpcy5nZXRVc2VyQ29udGV4dERhdGEoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdDb25maXJtRm9yZ290UGFzc3dvcmQnLCBqc29uUmVxLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcygpO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gaW5pdGlhdGUgYW4gYXR0cmlidXRlIGNvbmZpcm1hdGlvbiByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGVOYW1lIFVzZXIgYXR0cmlidXRlIHRoYXQgbmVlZHMgY29uZmlybWF0aW9uLlxuICAgKiBAcGFyYW0ge29iamVjdH0gY2FsbGJhY2sgUmVzdWx0IGNhbGxiYWNrIG1hcC5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge2lucHV0VmVyaWZpY2F0aW9uQ29kZX0gY2FsbGJhY2suaW5wdXRWZXJpZmljYXRpb25Db2RlIENhbGxlZCBvbiBzdWNjZXNzLlxuICAgKiBAcGFyYW0ge0NsaWVudE1ldGFkYXRhfSBjbGllbnRNZXRhZGF0YSBvYmplY3Qgd2hpY2ggaXMgcGFzc2VkIGZyb20gY2xpZW50IHRvIENvZ25pdG8gTGFtYmRhIHRyaWdnZXJcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldEF0dHJpYnV0ZVZlcmlmaWNhdGlvbkNvZGUgPSBmdW5jdGlvbiBnZXRBdHRyaWJ1dGVWZXJpZmljYXRpb25Db2RlKGF0dHJpYnV0ZU5hbWUsIGNhbGxiYWNrLCBjbGllbnRNZXRhZGF0YSkge1xuICAgIGlmICh0aGlzLnNpZ25JblVzZXJTZXNzaW9uID09IG51bGwgfHwgIXRoaXMuc2lnbkluVXNlclNlc3Npb24uaXNWYWxpZCgpKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKG5ldyBFcnJvcignVXNlciBpcyBub3QgYXV0aGVudGljYXRlZCcpKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdHZXRVc2VyQXR0cmlidXRlVmVyaWZpY2F0aW9uQ29kZScsIHtcbiAgICAgIEF0dHJpYnV0ZU5hbWU6IGF0dHJpYnV0ZU5hbWUsXG4gICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKCksXG4gICAgICBDbGllbnRNZXRhZGF0YTogY2xpZW50TWV0YWRhdGFcbiAgICB9LCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjay5pbnB1dFZlcmlmaWNhdGlvbkNvZGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmlucHV0VmVyaWZpY2F0aW9uQ29kZShkYXRhKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcygpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBjb25maXJtIGFuIGF0dHJpYnV0ZSB1c2luZyBhIGNvbmZpcm1hdGlvbiBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGVOYW1lIEF0dHJpYnV0ZSBiZWluZyBjb25maXJtZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maXJtYXRpb25Db2RlIENvZGUgZW50ZXJlZCBieSB1c2VyLlxuICAgKiBAcGFyYW0ge29iamVjdH0gY2FsbGJhY2sgUmVzdWx0IGNhbGxiYWNrIG1hcC5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge29uU3VjY2VzczxzdHJpbmc+fSBjYWxsYmFjay5vblN1Y2Nlc3MgQ2FsbGVkIG9uIHN1Y2Nlc3MuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by52ZXJpZnlBdHRyaWJ1dGUgPSBmdW5jdGlvbiB2ZXJpZnlBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSwgY29uZmlybWF0aW9uQ29kZSwgY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShuZXcgRXJyb3IoJ1VzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnVmVyaWZ5VXNlckF0dHJpYnV0ZScsIHtcbiAgICAgIEF0dHJpYnV0ZU5hbWU6IGF0dHJpYnV0ZU5hbWUsXG4gICAgICBDb2RlOiBjb25maXJtYXRpb25Db2RlLFxuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVycik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWxsYmFjay5vblN1Y2Nlc3MoJ1NVQ0NFU1MnKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gZ2V0IHRoZSBkZXZpY2UgaW5mb3JtYXRpb24gdXNpbmcgdGhlIGN1cnJlbnQgZGV2aWNlIGtleVxuICAgKiBAcGFyYW0ge29iamVjdH0gY2FsbGJhY2sgUmVzdWx0IGNhbGxiYWNrIG1hcC5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge29uU3VjY2VzczwqPn0gY2FsbGJhY2sub25TdWNjZXNzIENhbGxlZCBvbiBzdWNjZXNzIHdpdGggZGV2aWNlIGRhdGEuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXREZXZpY2UgPSBmdW5jdGlvbiBnZXREZXZpY2UoY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShuZXcgRXJyb3IoJ1VzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnR2V0RGV2aWNlJywge1xuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgRGV2aWNlS2V5OiB0aGlzLmRldmljZUtleVxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FsbGJhY2sub25TdWNjZXNzKGRhdGEpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBmb3JnZXQgYSBzcGVjaWZpYyBkZXZpY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRldmljZUtleSBEZXZpY2Uga2V5LlxuICAgKiBAcGFyYW0ge29iamVjdH0gY2FsbGJhY2sgUmVzdWx0IGNhbGxiYWNrIG1hcC5cbiAgICogQHBhcmFtIHtvbkZhaWx1cmV9IGNhbGxiYWNrLm9uRmFpbHVyZSBDYWxsZWQgb24gYW55IGVycm9yLlxuICAgKiBAcGFyYW0ge29uU3VjY2VzczxzdHJpbmc+fSBjYWxsYmFjay5vblN1Y2Nlc3MgQ2FsbGVkIG9uIHN1Y2Nlc3MuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5mb3JnZXRTcGVjaWZpY0RldmljZSA9IGZ1bmN0aW9uIGZvcmdldFNwZWNpZmljRGV2aWNlKGRldmljZUtleSwgY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShuZXcgRXJyb3IoJ1VzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnRm9yZ2V0RGV2aWNlJywge1xuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgRGV2aWNlS2V5OiBkZXZpY2VLZXlcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcygnU1VDQ0VTUycpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBmb3JnZXQgdGhlIGN1cnJlbnQgZGV2aWNlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjYWxsYmFjayBSZXN1bHQgY2FsbGJhY2sgbWFwLlxuICAgKiBAcGFyYW0ge29uRmFpbHVyZX0gY2FsbGJhY2sub25GYWlsdXJlIENhbGxlZCBvbiBhbnkgZXJyb3IuXG4gICAqIEBwYXJhbSB7b25TdWNjZXNzPHN0cmluZz59IGNhbGxiYWNrLm9uU3VjY2VzcyBDYWxsZWQgb24gc3VjY2Vzcy5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmZvcmdldERldmljZSA9IGZ1bmN0aW9uIGZvcmdldERldmljZShjYWxsYmFjaykge1xuICAgIHZhciBfdGhpczEyID0gdGhpcztcblxuICAgIHRoaXMuZm9yZ2V0U3BlY2lmaWNEZXZpY2UodGhpcy5kZXZpY2VLZXksIHtcbiAgICAgIG9uRmFpbHVyZTogY2FsbGJhY2sub25GYWlsdXJlLFxuICAgICAgb25TdWNjZXNzOiBmdW5jdGlvbiBvblN1Y2Nlc3MocmVzdWx0KSB7XG4gICAgICAgIF90aGlzMTIuZGV2aWNlS2V5ID0gbnVsbDtcbiAgICAgICAgX3RoaXMxMi5kZXZpY2VHcm91cEtleSA9IG51bGw7XG4gICAgICAgIF90aGlzMTIucmFuZG9tUGFzc3dvcmQgPSBudWxsO1xuXG4gICAgICAgIF90aGlzMTIuY2xlYXJDYWNoZWREZXZpY2VLZXlBbmRQYXNzd29yZCgpO1xuXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vblN1Y2Nlc3MocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIHNldCB0aGUgZGV2aWNlIHN0YXR1cyBhcyByZW1lbWJlcmVkXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjYWxsYmFjayBSZXN1bHQgY2FsbGJhY2sgbWFwLlxuICAgKiBAcGFyYW0ge29uRmFpbHVyZX0gY2FsbGJhY2sub25GYWlsdXJlIENhbGxlZCBvbiBhbnkgZXJyb3IuXG4gICAqIEBwYXJhbSB7b25TdWNjZXNzPHN0cmluZz59IGNhbGxiYWNrLm9uU3VjY2VzcyBDYWxsZWQgb24gc3VjY2Vzcy5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLnNldERldmljZVN0YXR1c1JlbWVtYmVyZWQgPSBmdW5jdGlvbiBzZXREZXZpY2VTdGF0dXNSZW1lbWJlcmVkKGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuc2lnbkluVXNlclNlc3Npb24gPT0gbnVsbCB8fCAhdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5pc1ZhbGlkKCkpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUobmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJykpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ1VwZGF0ZURldmljZVN0YXR1cycsIHtcbiAgICAgIEFjY2Vzc1Rva2VuOiB0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmdldEFjY2Vzc1Rva2VuKCkuZ2V0Snd0VG9rZW4oKSxcbiAgICAgIERldmljZUtleTogdGhpcy5kZXZpY2VLZXksXG4gICAgICBEZXZpY2VSZW1lbWJlcmVkU3RhdHVzOiAncmVtZW1iZXJlZCdcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcygnU1VDQ0VTUycpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBzZXQgdGhlIGRldmljZSBzdGF0dXMgYXMgbm90IHJlbWVtYmVyZWRcbiAgICogQHBhcmFtIHtvYmplY3R9IGNhbGxiYWNrIFJlc3VsdCBjYWxsYmFjayBtYXAuXG4gICAqIEBwYXJhbSB7b25GYWlsdXJlfSBjYWxsYmFjay5vbkZhaWx1cmUgQ2FsbGVkIG9uIGFueSBlcnJvci5cbiAgICogQHBhcmFtIHtvblN1Y2Nlc3M8c3RyaW5nPn0gY2FsbGJhY2sub25TdWNjZXNzIENhbGxlZCBvbiBzdWNjZXNzLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uc2V0RGV2aWNlU3RhdHVzTm90UmVtZW1iZXJlZCA9IGZ1bmN0aW9uIHNldERldmljZVN0YXR1c05vdFJlbWVtYmVyZWQoY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShuZXcgRXJyb3IoJ1VzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnVXBkYXRlRGV2aWNlU3RhdHVzJywge1xuICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgRGV2aWNlS2V5OiB0aGlzLmRldmljZUtleSxcbiAgICAgIERldmljZVJlbWVtYmVyZWRTdGF0dXM6ICdub3RfcmVtZW1iZXJlZCdcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcygnU1VDQ0VTUycpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBsaXN0IGFsbCBkZXZpY2VzIGZvciBhIHVzZXJcbiAgICpcbiAgICogQHBhcmFtIHtpbnR9IGxpbWl0IHRoZSBudW1iZXIgb2YgZGV2aWNlcyByZXR1cm5lZCBpbiBhIGNhbGxcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhZ2luYXRpb25Ub2tlbiB0aGUgcGFnaW5hdGlvbiB0b2tlbiBpbiBjYXNlIGFueSB3YXMgcmV0dXJuZWQgYmVmb3JlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjYWxsYmFjayBSZXN1bHQgY2FsbGJhY2sgbWFwLlxuICAgKiBAcGFyYW0ge29uRmFpbHVyZX0gY2FsbGJhY2sub25GYWlsdXJlIENhbGxlZCBvbiBhbnkgZXJyb3IuXG4gICAqIEBwYXJhbSB7b25TdWNjZXNzPCo+fSBjYWxsYmFjay5vblN1Y2Nlc3MgQ2FsbGVkIG9uIHN1Y2Nlc3Mgd2l0aCBkZXZpY2UgbGlzdC5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmxpc3REZXZpY2VzID0gZnVuY3Rpb24gbGlzdERldmljZXMobGltaXQsIHBhZ2luYXRpb25Ub2tlbiwgY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9PSBudWxsIHx8ICF0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShuZXcgRXJyb3IoJ1VzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGllbnQucmVxdWVzdCgnTGlzdERldmljZXMnLCB7XG4gICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKCksXG4gICAgICBMaW1pdDogbGltaXQsXG4gICAgICBQYWdpbmF0aW9uVG9rZW46IHBhZ2luYXRpb25Ub2tlblxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FsbGJhY2sub25TdWNjZXNzKGRhdGEpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBnbG9iYWxseSByZXZva2UgYWxsIHRva2VucyBpc3N1ZWQgdG8gYSB1c2VyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjYWxsYmFjayBSZXN1bHQgY2FsbGJhY2sgbWFwLlxuICAgKiBAcGFyYW0ge29uRmFpbHVyZX0gY2FsbGJhY2sub25GYWlsdXJlIENhbGxlZCBvbiBhbnkgZXJyb3IuXG4gICAqIEBwYXJhbSB7b25TdWNjZXNzPHN0cmluZz59IGNhbGxiYWNrLm9uU3VjY2VzcyBDYWxsZWQgb24gc3VjY2Vzcy5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdsb2JhbFNpZ25PdXQgPSBmdW5jdGlvbiBnbG9iYWxTaWduT3V0KGNhbGxiYWNrKSB7XG4gICAgdmFyIF90aGlzMTMgPSB0aGlzO1xuXG4gICAgaWYgKHRoaXMuc2lnbkluVXNlclNlc3Npb24gPT0gbnVsbCB8fCAhdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5pc1ZhbGlkKCkpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUobmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJykpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ0dsb2JhbFNpZ25PdXQnLCB7XG4gICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKClcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMxMy5jbGVhckNhY2hlZFVzZXIoKTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcygnU1VDQ0VTUycpO1xuICAgIH0pO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCBmb3IgdGhlIHVzZXIgdG8gc2lnbk91dCBvZiB0aGUgYXBwbGljYXRpb24gYW5kIGNsZWFyIHRoZSBjYWNoZWQgdG9rZW5zLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIDtcblxuICBfcHJvdG8uc2lnbk91dCA9IGZ1bmN0aW9uIHNpZ25PdXQoKSB7XG4gICAgdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiA9IG51bGw7XG4gICAgdGhpcy5jbGVhckNhY2hlZFVzZXIoKTtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGEgdXNlciB0cnlpbmcgdG8gc2VsZWN0IGEgZ2l2ZW4gTUZBXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhbnN3ZXJDaGFsbGVuZ2UgdGhlIG1mYSB0aGUgdXNlciB3YW50c1xuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxzdHJpbmc+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLnNlbmRNRkFTZWxlY3Rpb25BbnN3ZXIgPSBmdW5jdGlvbiBzZW5kTUZBU2VsZWN0aW9uQW5zd2VyKGFuc3dlckNoYWxsZW5nZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMxNCA9IHRoaXM7XG5cbiAgICB2YXIgY2hhbGxlbmdlUmVzcG9uc2VzID0ge307XG4gICAgY2hhbGxlbmdlUmVzcG9uc2VzLlVTRVJOQU1FID0gdGhpcy51c2VybmFtZTtcbiAgICBjaGFsbGVuZ2VSZXNwb25zZXMuQU5TV0VSID0gYW5zd2VyQ2hhbGxlbmdlO1xuICAgIHZhciBqc29uUmVxID0ge1xuICAgICAgQ2hhbGxlbmdlTmFtZTogJ1NFTEVDVF9NRkFfVFlQRScsXG4gICAgICBDaGFsbGVuZ2VSZXNwb25zZXM6IGNoYWxsZW5nZVJlc3BvbnNlcyxcbiAgICAgIENsaWVudElkOiB0aGlzLnBvb2wuZ2V0Q2xpZW50SWQoKSxcbiAgICAgIFNlc3Npb246IHRoaXMuU2Vzc2lvblxuICAgIH07XG5cbiAgICBpZiAodGhpcy5nZXRVc2VyQ29udGV4dERhdGEoKSkge1xuICAgICAganNvblJlcS5Vc2VyQ29udGV4dERhdGEgPSB0aGlzLmdldFVzZXJDb250ZXh0RGF0YSgpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ1Jlc3BvbmRUb0F1dGhDaGFsbGVuZ2UnLCBqc29uUmVxLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMxNC5TZXNzaW9uID0gZGF0YS5TZXNzaW9uO1xuXG4gICAgICBpZiAoYW5zd2VyQ2hhbGxlbmdlID09PSAnU01TX01GQScpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm1mYVJlcXVpcmVkKGRhdGEuY2hhbGxlbmdlTmFtZSwgZGF0YS5jaGFsbGVuZ2VQYXJhbWV0ZXJzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFuc3dlckNoYWxsZW5nZSA9PT0gJ1NPRlRXQVJFX1RPS0VOX01GQScpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLnRvdHBSZXF1aXJlZChkYXRhLmNoYWxsZW5nZU5hbWUsIGRhdGEuY2hhbGxlbmdlUGFyYW1ldGVycyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgcmV0dXJucyB0aGUgdXNlciBjb250ZXh0IGRhdGEgZm9yIGFkdmFuY2VkIHNlY3VyaXR5IGZlYXR1cmUuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXRVc2VyQ29udGV4dERhdGEgPSBmdW5jdGlvbiBnZXRVc2VyQ29udGV4dERhdGEoKSB7XG4gICAgdmFyIHBvb2wgPSB0aGlzLnBvb2w7XG4gICAgcmV0dXJuIHBvb2wuZ2V0VXNlckNvbnRleHREYXRhKHRoaXMudXNlcm5hbWUpO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYW4gYXV0aGVudGljYXRlZCBvciBhIHVzZXIgdHJ5aW5nIHRvIGF1dGhlbnRpY2F0ZSB0byBhc3NvY2lhdGUgYSBUT1RQIE1GQVxuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxzdHJpbmc+fSBjYWxsYmFjayBDYWxsZWQgb24gc3VjY2VzcyBvciBlcnJvci5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmFzc29jaWF0ZVNvZnR3YXJlVG9rZW4gPSBmdW5jdGlvbiBhc3NvY2lhdGVTb2Z0d2FyZVRva2VuKGNhbGxiYWNrKSB7XG4gICAgdmFyIF90aGlzMTUgPSB0aGlzO1xuXG4gICAgaWYgKCEodGhpcy5zaWduSW5Vc2VyU2Vzc2lvbiAhPSBudWxsICYmIHRoaXMuc2lnbkluVXNlclNlc3Npb24uaXNWYWxpZCgpKSkge1xuICAgICAgdGhpcy5jbGllbnQucmVxdWVzdCgnQXNzb2NpYXRlU29mdHdhcmVUb2tlbicsIHtcbiAgICAgICAgU2Vzc2lvbjogdGhpcy5TZXNzaW9uXG4gICAgICB9LCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBfdGhpczE1LlNlc3Npb24gPSBkYXRhLlNlc3Npb247XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hc3NvY2lhdGVTZWNyZXRDb2RlKGRhdGEuU2VjcmV0Q29kZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jbGllbnQucmVxdWVzdCgnQXNzb2NpYXRlU29mdHdhcmVUb2tlbicsIHtcbiAgICAgICAgQWNjZXNzVG9rZW46IHRoaXMuc2lnbkluVXNlclNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpXG4gICAgICB9LCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sub25GYWlsdXJlKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FsbGJhY2suYXNzb2NpYXRlU2VjcmV0Q29kZShkYXRhLlNlY3JldENvZGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYW4gYXV0aGVudGljYXRlZCBvciBhIHVzZXIgdHJ5aW5nIHRvIGF1dGhlbnRpY2F0ZSB0byB2ZXJpZnkgYSBUT1RQIE1GQVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG90cENvZGUgVGhlIE1GQSBjb2RlIGVudGVyZWQgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmcmllbmRseURldmljZU5hbWUgVGhlIGRldmljZSBuYW1lIHdlIGFyZSBhc3NpZ25pbmcgdG8gdGhlIGRldmljZS5cbiAgICogQHBhcmFtIHtub2RlQ2FsbGJhY2s8c3RyaW5nPn0gY2FsbGJhY2sgQ2FsbGVkIG9uIHN1Y2Nlc3Mgb3IgZXJyb3IuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by52ZXJpZnlTb2Z0d2FyZVRva2VuID0gZnVuY3Rpb24gdmVyaWZ5U29mdHdhcmVUb2tlbih0b3RwQ29kZSwgZnJpZW5kbHlEZXZpY2VOYW1lLCBjYWxsYmFjaykge1xuICAgIHZhciBfdGhpczE2ID0gdGhpcztcblxuICAgIGlmICghKHRoaXMuc2lnbkluVXNlclNlc3Npb24gIT0gbnVsbCAmJiB0aGlzLnNpZ25JblVzZXJTZXNzaW9uLmlzVmFsaWQoKSkpIHtcbiAgICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ1ZlcmlmeVNvZnR3YXJlVG9rZW4nLCB7XG4gICAgICAgIFNlc3Npb246IHRoaXMuU2Vzc2lvbixcbiAgICAgICAgVXNlckNvZGU6IHRvdHBDb2RlLFxuICAgICAgICBGcmllbmRseURldmljZU5hbWU6IGZyaWVuZGx5RGV2aWNlTmFtZVxuICAgICAgfSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXMxNi5TZXNzaW9uID0gZGF0YS5TZXNzaW9uO1xuICAgICAgICB2YXIgY2hhbGxlbmdlUmVzcG9uc2VzID0ge307XG4gICAgICAgIGNoYWxsZW5nZVJlc3BvbnNlcy5VU0VSTkFNRSA9IF90aGlzMTYudXNlcm5hbWU7XG4gICAgICAgIHZhciBqc29uUmVxID0ge1xuICAgICAgICAgIENoYWxsZW5nZU5hbWU6ICdNRkFfU0VUVVAnLFxuICAgICAgICAgIENsaWVudElkOiBfdGhpczE2LnBvb2wuZ2V0Q2xpZW50SWQoKSxcbiAgICAgICAgICBDaGFsbGVuZ2VSZXNwb25zZXM6IGNoYWxsZW5nZVJlc3BvbnNlcyxcbiAgICAgICAgICBTZXNzaW9uOiBfdGhpczE2LlNlc3Npb25cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoX3RoaXMxNi5nZXRVc2VyQ29udGV4dERhdGEoKSkge1xuICAgICAgICAgIGpzb25SZXEuVXNlckNvbnRleHREYXRhID0gX3RoaXMxNi5nZXRVc2VyQ29udGV4dERhdGEoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzMTYuY2xpZW50LnJlcXVlc3QoJ1Jlc3BvbmRUb0F1dGhDaGFsbGVuZ2UnLCBqc29uUmVxLCBmdW5jdGlvbiAoZXJyUmVzcG9uZCwgZGF0YVJlc3BvbmQpIHtcbiAgICAgICAgICBpZiAoZXJyUmVzcG9uZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uRmFpbHVyZShlcnJSZXNwb25kKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBfdGhpczE2LnNpZ25JblVzZXJTZXNzaW9uID0gX3RoaXMxNi5nZXRDb2duaXRvVXNlclNlc3Npb24oZGF0YVJlc3BvbmQuQXV0aGVudGljYXRpb25SZXN1bHQpO1xuXG4gICAgICAgICAgX3RoaXMxNi5jYWNoZVRva2VucygpO1xuXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLm9uU3VjY2VzcyhfdGhpczE2LnNpZ25JblVzZXJTZXNzaW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNsaWVudC5yZXF1ZXN0KCdWZXJpZnlTb2Z0d2FyZVRva2VuJywge1xuICAgICAgICBBY2Nlc3NUb2tlbjogdGhpcy5zaWduSW5Vc2VyU2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKCksXG4gICAgICAgIFVzZXJDb2RlOiB0b3RwQ29kZSxcbiAgICAgICAgRnJpZW5kbHlEZXZpY2VOYW1lOiBmcmllbmRseURldmljZU5hbWVcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjay5vbkZhaWx1cmUoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5vblN1Y2Nlc3MoZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIENvZ25pdG9Vc2VyO1xufSgpO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IENvZ25pdG9Vc2VyOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbi8qIVxuICogQ29weXJpZ2h0IDIwMTYgQW1hem9uLmNvbSxcbiAqIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFtYXpvbiBTb2Z0d2FyZSBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpLlxuICogWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZVxuICogTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cDovL2F3cy5hbWF6b24uY29tL2FzbC9cbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXNcbiAqIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZVxuICogZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogQGNsYXNzICovXG52YXIgQ29nbml0b1VzZXJBdHRyaWJ1dGUgPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBDb2duaXRvVXNlckF0dHJpYnV0ZSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBOYW1lIFRoZSByZWNvcmQncyBuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gVmFsdWUgVGhlIHJlY29yZCdzIHZhbHVlXG4gICAqL1xuICBmdW5jdGlvbiBDb2duaXRvVXNlckF0dHJpYnV0ZShfdGVtcCkge1xuICAgIHZhciBfcmVmID0gX3RlbXAgPT09IHZvaWQgMCA/IHt9IDogX3RlbXAsXG4gICAgICAgIE5hbWUgPSBfcmVmLk5hbWUsXG4gICAgICAgIFZhbHVlID0gX3JlZi5WYWx1ZTtcblxuICAgIHRoaXMuTmFtZSA9IE5hbWUgfHwgJyc7XG4gICAgdGhpcy5WYWx1ZSA9IFZhbHVlIHx8ICcnO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgcmVjb3JkJ3MgdmFsdWUuXG4gICAqL1xuXG5cbiAgdmFyIF9wcm90byA9IENvZ25pdG9Vc2VyQXR0cmlidXRlLnByb3RvdHlwZTtcblxuICBfcHJvdG8uZ2V0VmFsdWUgPSBmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5WYWx1ZTtcbiAgfVxuICAvKipcbiAgICogU2V0cyB0aGUgcmVjb3JkJ3MgdmFsdWUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBUaGUgbmV3IHZhbHVlLlxuICAgKiBAcmV0dXJucyB7Q29nbml0b1VzZXJBdHRyaWJ1dGV9IFRoZSByZWNvcmQgZm9yIG1ldGhvZCBjaGFpbmluZy5cbiAgICovXG4gIDtcblxuICBfcHJvdG8uc2V0VmFsdWUgPSBmdW5jdGlvbiBzZXRWYWx1ZSh2YWx1ZSkge1xuICAgIHRoaXMuVmFsdWUgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIHJlY29yZCdzIG5hbWUuXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldE5hbWUgPSBmdW5jdGlvbiBnZXROYW1lKCkge1xuICAgIHJldHVybiB0aGlzLk5hbWU7XG4gIH1cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJlY29yZCdzIG5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5ldyBuYW1lLlxuICAgKiBAcmV0dXJucyB7Q29nbml0b1VzZXJBdHRyaWJ1dGV9IFRoZSByZWNvcmQgZm9yIG1ldGhvZCBjaGFpbmluZy5cbiAgICovXG4gIDtcblxuICBfcHJvdG8uc2V0TmFtZSA9IGZ1bmN0aW9uIHNldE5hbWUobmFtZSkge1xuICAgIHRoaXMuTmFtZSA9IG5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSByZWNvcmQuXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMpO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7b2JqZWN0fSBhIGZsYXQgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgcmVjb3JkLlxuICAgKi9cbiAgO1xuXG4gIF9wcm90by50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIE5hbWU6IHRoaXMuTmFtZSxcbiAgICAgIFZhbHVlOiB0aGlzLlZhbHVlXG4gICAgfTtcbiAgfTtcblxuICByZXR1cm4gQ29nbml0b1VzZXJBdHRyaWJ1dGU7XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gQ29nbml0b1VzZXJBdHRyaWJ1dGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9DbGllbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0NsaWVudFwiKSk7XG5cbnZhciBfQ29nbml0b1VzZXIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0NvZ25pdG9Vc2VyXCIpKTtcblxudmFyIF9TdG9yYWdlSGVscGVyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9TdG9yYWdlSGVscGVyXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbi8qIVxuICogQ29weXJpZ2h0IDIwMTYgQW1hem9uLmNvbSxcbiAqIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFtYXpvbiBTb2Z0d2FyZSBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpLlxuICogWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZVxuICogTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cDovL2F3cy5hbWF6b24uY29tL2FzbC9cbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXNcbiAqIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZVxuICogZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogQGNsYXNzICovXG52YXIgQ29nbml0b1VzZXJQb29sID1cbi8qI19fUFVSRV9fKi9cbmZ1bmN0aW9uICgpIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgYSBuZXcgQ29nbml0b1VzZXJQb29sIG9iamVjdFxuICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBDcmVhdGlvbiBvcHRpb25zLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YS5Vc2VyUG9vbElkIENvZ25pdG8gdXNlciBwb29sIGlkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YS5DbGllbnRJZCBVc2VyIHBvb2wgYXBwbGljYXRpb24gY2xpZW50IGlkLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YS5TdG9yYWdlIE9wdGlvbmFsIHN0b3JhZ2Ugb2JqZWN0LlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGRhdGEuQWR2YW5jZWRTZWN1cml0eURhdGFDb2xsZWN0aW9uRmxhZyBPcHRpb25hbDpcbiAgICogICAgICAgIGJvb2xlYW4gZmxhZyBpbmRpY2F0aW5nIGlmIHRoZSBkYXRhIGNvbGxlY3Rpb24gaXMgZW5hYmxlZFxuICAgKiAgICAgICAgdG8gc3VwcG9ydCBjb2duaXRvIGFkdmFuY2VkIHNlY3VyaXR5IGZlYXR1cmVzLiBCeSBkZWZhdWx0LCB0aGlzXG4gICAqICAgICAgICBmbGFnIGlzIHNldCB0byB0cnVlLlxuICAgKi9cbiAgZnVuY3Rpb24gQ29nbml0b1VzZXJQb29sKGRhdGEpIHtcbiAgICB2YXIgX3JlZiA9IGRhdGEgfHwge30sXG4gICAgICAgIFVzZXJQb29sSWQgPSBfcmVmLlVzZXJQb29sSWQsXG4gICAgICAgIENsaWVudElkID0gX3JlZi5DbGllbnRJZCxcbiAgICAgICAgZW5kcG9pbnQgPSBfcmVmLmVuZHBvaW50LFxuICAgICAgICBBZHZhbmNlZFNlY3VyaXR5RGF0YUNvbGxlY3Rpb25GbGFnID0gX3JlZi5BZHZhbmNlZFNlY3VyaXR5RGF0YUNvbGxlY3Rpb25GbGFnO1xuXG4gICAgaWYgKCFVc2VyUG9vbElkIHx8ICFDbGllbnRJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb3RoIFVzZXJQb29sSWQgYW5kIENsaWVudElkIGFyZSByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICBpZiAoIS9eW1xcdy1dK18uKyQvLnRlc3QoVXNlclBvb2xJZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBVc2VyUG9vbElkIGZvcm1hdC4nKTtcbiAgICB9XG5cbiAgICB2YXIgcmVnaW9uID0gVXNlclBvb2xJZC5zcGxpdCgnXycpWzBdO1xuICAgIHRoaXMudXNlclBvb2xJZCA9IFVzZXJQb29sSWQ7XG4gICAgdGhpcy5jbGllbnRJZCA9IENsaWVudElkO1xuICAgIHRoaXMuY2xpZW50ID0gbmV3IF9DbGllbnRbXCJkZWZhdWx0XCJdKHJlZ2lvbiwgZW5kcG9pbnQpO1xuICAgIC8qKlxuICAgICAqIEJ5IGRlZmF1bHQsIEFkdmFuY2VkU2VjdXJpdHlEYXRhQ29sbGVjdGlvbkZsYWcgaXMgc2V0IHRvIHRydWUsXG4gICAgICogaWYgbm8gaW5wdXQgdmFsdWUgaXMgcHJvdmlkZWQuXG4gICAgICovXG5cbiAgICB0aGlzLmFkdmFuY2VkU2VjdXJpdHlEYXRhQ29sbGVjdGlvbkZsYWcgPSBBZHZhbmNlZFNlY3VyaXR5RGF0YUNvbGxlY3Rpb25GbGFnICE9PSBmYWxzZTtcbiAgICB0aGlzLnN0b3JhZ2UgPSBkYXRhLlN0b3JhZ2UgfHwgbmV3IF9TdG9yYWdlSGVscGVyW1wiZGVmYXVsdFwiXSgpLmdldFN0b3JhZ2UoKTtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIHVzZXIgcG9vbCBpZFxuICAgKi9cblxuXG4gIHZhciBfcHJvdG8gPSBDb2duaXRvVXNlclBvb2wucHJvdG90eXBlO1xuXG4gIF9wcm90by5nZXRVc2VyUG9vbElkID0gZnVuY3Rpb24gZ2V0VXNlclBvb2xJZCgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyUG9vbElkO1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgY2xpZW50IGlkXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmdldENsaWVudElkID0gZnVuY3Rpb24gZ2V0Q2xpZW50SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xpZW50SWQ7XG4gIH1cbiAgLyoqXG4gICAqIEB0eXBlZGVmIHtvYmplY3R9IFNpZ25VcFJlc3VsdFxuICAgKiBAcHJvcGVydHkge0NvZ25pdG9Vc2VyfSB1c2VyIE5ldyB1c2VyLlxuICAgKiBAcHJvcGVydHkge2Jvb2x9IHVzZXJDb25maXJtZWQgSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBjb25maXJtZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBtZXRob2QgZm9yIHNpZ25pbmcgdXAgYSB1c2VyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSBVc2VyJ3MgdXNlcm5hbWUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCBQbGFpbi10ZXh0IGluaXRpYWwgcGFzc3dvcmQgZW50ZXJlZCBieSB1c2VyLlxuICAgKiBAcGFyYW0geyhBdHRyaWJ1dGVBcmdbXSk9fSB1c2VyQXR0cmlidXRlcyBOZXcgdXNlciBhdHRyaWJ1dGVzLlxuICAgKiBAcGFyYW0geyhBdHRyaWJ1dGVBcmdbXSk9fSB2YWxpZGF0aW9uRGF0YSBBcHBsaWNhdGlvbiBtZXRhZGF0YS5cbiAgICogQHBhcmFtIHsoQXR0cmlidXRlQXJnW10pPX0gY2xpZW50TWV0YWRhdGEgQ2xpZW50IG1ldGFkYXRhLlxuICAgKiBAcGFyYW0ge25vZGVDYWxsYmFjazxTaWduVXBSZXN1bHQ+fSBjYWxsYmFjayBDYWxsZWQgb24gZXJyb3Igb3Igd2l0aCB0aGUgbmV3IHVzZXIuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5zaWduVXAgPSBmdW5jdGlvbiBzaWduVXAodXNlcm5hbWUsIHBhc3N3b3JkLCB1c2VyQXR0cmlidXRlcywgdmFsaWRhdGlvbkRhdGEsIGNhbGxiYWNrLCBjbGllbnRNZXRhZGF0YSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIganNvblJlcSA9IHtcbiAgICAgIENsaWVudElkOiB0aGlzLmNsaWVudElkLFxuICAgICAgVXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgUGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgVXNlckF0dHJpYnV0ZXM6IHVzZXJBdHRyaWJ1dGVzLFxuICAgICAgVmFsaWRhdGlvbkRhdGE6IHZhbGlkYXRpb25EYXRhLFxuICAgICAgQ2xpZW50TWV0YWRhdGE6IGNsaWVudE1ldGFkYXRhXG4gICAgfTtcblxuICAgIGlmICh0aGlzLmdldFVzZXJDb250ZXh0RGF0YSh1c2VybmFtZSkpIHtcbiAgICAgIGpzb25SZXEuVXNlckNvbnRleHREYXRhID0gdGhpcy5nZXRVc2VyQ29udGV4dERhdGEodXNlcm5hbWUpO1xuICAgIH1cblxuICAgIHRoaXMuY2xpZW50LnJlcXVlc3QoJ1NpZ25VcCcsIGpzb25SZXEsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBjb2duaXRvVXNlciA9IHtcbiAgICAgICAgVXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICBQb29sOiBfdGhpcyxcbiAgICAgICAgU3RvcmFnZTogX3RoaXMuc3RvcmFnZVxuICAgICAgfTtcbiAgICAgIHZhciByZXR1cm5EYXRhID0ge1xuICAgICAgICB1c2VyOiBuZXcgX0NvZ25pdG9Vc2VyW1wiZGVmYXVsdFwiXShjb2duaXRvVXNlciksXG4gICAgICAgIHVzZXJDb25maXJtZWQ6IGRhdGEuVXNlckNvbmZpcm1lZCxcbiAgICAgICAgdXNlclN1YjogZGF0YS5Vc2VyU3ViLFxuICAgICAgICBjb2RlRGVsaXZlcnlEZXRhaWxzOiBkYXRhLkNvZGVEZWxpdmVyeURldGFpbHNcbiAgICAgIH07XG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcmV0dXJuRGF0YSk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIG1ldGhvZCBmb3IgZ2V0dGluZyB0aGUgY3VycmVudCB1c2VyIG9mIHRoZSBhcHBsaWNhdGlvbiBmcm9tIHRoZSBsb2NhbCBzdG9yYWdlXG4gICAqXG4gICAqIEByZXR1cm5zIHtDb2duaXRvVXNlcn0gdGhlIHVzZXIgcmV0cmlldmVkIGZyb20gc3RvcmFnZVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXRDdXJyZW50VXNlciA9IGZ1bmN0aW9uIGdldEN1cnJlbnRVc2VyKCkge1xuICAgIHZhciBsYXN0VXNlcktleSA9IFwiQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLlwiICsgdGhpcy5jbGllbnRJZCArIFwiLkxhc3RBdXRoVXNlclwiO1xuICAgIHZhciBsYXN0QXV0aFVzZXIgPSB0aGlzLnN0b3JhZ2UuZ2V0SXRlbShsYXN0VXNlcktleSk7XG5cbiAgICBpZiAobGFzdEF1dGhVc2VyKSB7XG4gICAgICB2YXIgY29nbml0b1VzZXIgPSB7XG4gICAgICAgIFVzZXJuYW1lOiBsYXN0QXV0aFVzZXIsXG4gICAgICAgIFBvb2w6IHRoaXMsXG4gICAgICAgIFN0b3JhZ2U6IHRoaXMuc3RvcmFnZVxuICAgICAgfTtcbiAgICAgIHJldHVybiBuZXcgX0NvZ25pdG9Vc2VyW1wiZGVmYXVsdFwiXShjb2duaXRvVXNlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGVuY29kZWQgZGF0YSBzdHJpbmcgdXNlZCBmb3IgY29nbml0byBhZHZhbmNlZCBzZWN1cml0eSBmZWF0dXJlLlxuICAgKiBUaGlzIHdvdWxkIGJlIGdlbmVyYXRlZCBvbmx5IHdoZW4gZGV2ZWxvcGVyIGhhcyBpbmNsdWRlZCB0aGUgSlMgdXNlZCBmb3IgY29sbGVjdGluZyB0aGVcbiAgICogZGF0YSBvbiB0aGVpciBjbGllbnQuIFBsZWFzZSByZWZlciB0byBkb2N1bWVudGF0aW9uIHRvIGtub3cgbW9yZSBhYm91dCB1c2luZyBBZHZhbmNlZFNlY3VyaXR5XG4gICAqIGZlYXR1cmVzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSB0aGUgdXNlcm5hbWUgZm9yIHRoZSBjb250ZXh0IGRhdGFcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIHVzZXIgY29udGV4dCBkYXRhXG4gICAqKi9cbiAgO1xuXG4gIF9wcm90by5nZXRVc2VyQ29udGV4dERhdGEgPSBmdW5jdGlvbiBnZXRVc2VyQ29udGV4dERhdGEodXNlcm5hbWUpIHtcbiAgICBpZiAodHlwZW9mIEFtYXpvbkNvZ25pdG9BZHZhbmNlZFNlY3VyaXR5RGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8qIGVzbGludC1kaXNhYmxlICovXG5cblxuICAgIHZhciBhbWF6b25Db2duaXRvQWR2YW5jZWRTZWN1cml0eURhdGFDb25zdCA9IEFtYXpvbkNvZ25pdG9BZHZhbmNlZFNlY3VyaXR5RGF0YTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlICovXG5cbiAgICBpZiAodGhpcy5hZHZhbmNlZFNlY3VyaXR5RGF0YUNvbGxlY3Rpb25GbGFnKSB7XG4gICAgICB2YXIgYWR2YW5jZWRTZWN1cml0eURhdGEgPSBhbWF6b25Db2duaXRvQWR2YW5jZWRTZWN1cml0eURhdGFDb25zdC5nZXREYXRhKHVzZXJuYW1lLCB0aGlzLnVzZXJQb29sSWQsIHRoaXMuY2xpZW50SWQpO1xuXG4gICAgICBpZiAoYWR2YW5jZWRTZWN1cml0eURhdGEpIHtcbiAgICAgICAgdmFyIHVzZXJDb250ZXh0RGF0YSA9IHtcbiAgICAgICAgICBFbmNvZGVkRGF0YTogYWR2YW5jZWRTZWN1cml0eURhdGFcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHVzZXJDb250ZXh0RGF0YTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge307XG4gIH07XG5cbiAgcmV0dXJuIENvZ25pdG9Vc2VyUG9vbDtcbn0oKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBDb2duaXRvVXNlclBvb2w7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxuLyohXG4gKiBDb3B5cmlnaHQgMjAxNiBBbWF6b24uY29tLFxuICogSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQW1hem9uIFNvZnR3YXJlIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIikuXG4gKiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlXG4gKiBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwOi8vYXdzLmFtYXpvbi5jb20vYXNsL1xuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpc1xuICogZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlXG4gKiBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY2xhc3MgKi9cbnZhciBDb2duaXRvVXNlclNlc3Npb24gPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBDb2duaXRvVXNlclNlc3Npb24gb2JqZWN0XG4gICAqIEBwYXJhbSB7Q29nbml0b0lkVG9rZW59IElkVG9rZW4gVGhlIHNlc3Npb24ncyBJZCB0b2tlbi5cbiAgICogQHBhcmFtIHtDb2duaXRvUmVmcmVzaFRva2VuPX0gUmVmcmVzaFRva2VuIFRoZSBzZXNzaW9uJ3MgcmVmcmVzaCB0b2tlbi5cbiAgICogQHBhcmFtIHtDb2duaXRvQWNjZXNzVG9rZW59IEFjY2Vzc1Rva2VuIFRoZSBzZXNzaW9uJ3MgYWNjZXNzIHRva2VuLlxuICAgKiBAcGFyYW0ge2ludH0gQ2xvY2tEcmlmdCBUaGUgc2F2ZWQgY29tcHV0ZXIncyBjbG9jayBkcmlmdCBvciB1bmRlZmluZWQgdG8gZm9yY2UgY2FsY3VsYXRpb24uXG4gICAqL1xuICBmdW5jdGlvbiBDb2duaXRvVXNlclNlc3Npb24oX3RlbXApIHtcbiAgICB2YXIgX3JlZiA9IF90ZW1wID09PSB2b2lkIDAgPyB7fSA6IF90ZW1wLFxuICAgICAgICBJZFRva2VuID0gX3JlZi5JZFRva2VuLFxuICAgICAgICBSZWZyZXNoVG9rZW4gPSBfcmVmLlJlZnJlc2hUb2tlbixcbiAgICAgICAgQWNjZXNzVG9rZW4gPSBfcmVmLkFjY2Vzc1Rva2VuLFxuICAgICAgICBDbG9ja0RyaWZ0ID0gX3JlZi5DbG9ja0RyaWZ0O1xuXG4gICAgaWYgKEFjY2Vzc1Rva2VuID09IG51bGwgfHwgSWRUb2tlbiA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lkIHRva2VuIGFuZCBBY2Nlc3MgVG9rZW4gbXVzdCBiZSBwcmVzZW50LicpO1xuICAgIH1cblxuICAgIHRoaXMuaWRUb2tlbiA9IElkVG9rZW47XG4gICAgdGhpcy5yZWZyZXNoVG9rZW4gPSBSZWZyZXNoVG9rZW47XG4gICAgdGhpcy5hY2Nlc3NUb2tlbiA9IEFjY2Vzc1Rva2VuO1xuICAgIHRoaXMuY2xvY2tEcmlmdCA9IENsb2NrRHJpZnQgPT09IHVuZGVmaW5lZCA/IHRoaXMuY2FsY3VsYXRlQ2xvY2tEcmlmdCgpIDogQ2xvY2tEcmlmdDtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge0NvZ25pdG9JZFRva2VufSB0aGUgc2Vzc2lvbidzIElkIHRva2VuXG4gICAqL1xuXG5cbiAgdmFyIF9wcm90byA9IENvZ25pdG9Vc2VyU2Vzc2lvbi5wcm90b3R5cGU7XG5cbiAgX3Byb3RvLmdldElkVG9rZW4gPSBmdW5jdGlvbiBnZXRJZFRva2VuKCkge1xuICAgIHJldHVybiB0aGlzLmlkVG9rZW47XG4gIH1cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtDb2duaXRvUmVmcmVzaFRva2VufSB0aGUgc2Vzc2lvbidzIHJlZnJlc2ggdG9rZW5cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0UmVmcmVzaFRva2VuID0gZnVuY3Rpb24gZ2V0UmVmcmVzaFRva2VuKCkge1xuICAgIHJldHVybiB0aGlzLnJlZnJlc2hUb2tlbjtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge0NvZ25pdG9BY2Nlc3NUb2tlbn0gdGhlIHNlc3Npb24ncyBhY2Nlc3MgdG9rZW5cbiAgICovXG4gIDtcblxuICBfcHJvdG8uZ2V0QWNjZXNzVG9rZW4gPSBmdW5jdGlvbiBnZXRBY2Nlc3NUb2tlbigpIHtcbiAgICByZXR1cm4gdGhpcy5hY2Nlc3NUb2tlbjtcbiAgfVxuICAvKipcbiAgICogQHJldHVybnMge2ludH0gdGhlIHNlc3Npb24ncyBjbG9jayBkcmlmdFxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXRDbG9ja0RyaWZ0ID0gZnVuY3Rpb24gZ2V0Q2xvY2tEcmlmdCgpIHtcbiAgICByZXR1cm4gdGhpcy5jbG9ja0RyaWZ0O1xuICB9XG4gIC8qKlxuICAgKiBAcmV0dXJucyB7aW50fSB0aGUgY29tcHV0ZXIncyBjbG9jayBkcmlmdFxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5jYWxjdWxhdGVDbG9ja0RyaWZ0ID0gZnVuY3Rpb24gY2FsY3VsYXRlQ2xvY2tEcmlmdCgpIHtcbiAgICB2YXIgbm93ID0gTWF0aC5mbG9vcihuZXcgRGF0ZSgpIC8gMTAwMCk7XG4gICAgdmFyIGlhdCA9IE1hdGgubWluKHRoaXMuYWNjZXNzVG9rZW4uZ2V0SXNzdWVkQXQoKSwgdGhpcy5pZFRva2VuLmdldElzc3VlZEF0KCkpO1xuICAgIHJldHVybiBub3cgLSBpYXQ7XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyB0byBzZWUgaWYgdGhlIHNlc3Npb24gaXMgc3RpbGwgdmFsaWQgYmFzZWQgb24gc2Vzc2lvbiBleHBpcnkgaW5mb3JtYXRpb24gZm91bmRcbiAgICogaW4gdG9rZW5zIGFuZCB0aGUgY3VycmVudCB0aW1lIChhZGp1c3RlZCB3aXRoIGNsb2NrIGRyaWZ0KVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gaWYgdGhlIHNlc3Npb24gaXMgc3RpbGwgdmFsaWRcbiAgICovXG4gIDtcblxuICBfcHJvdG8uaXNWYWxpZCA9IGZ1bmN0aW9uIGlzVmFsaWQoKSB7XG4gICAgdmFyIG5vdyA9IE1hdGguZmxvb3IobmV3IERhdGUoKSAvIDEwMDApO1xuICAgIHZhciBhZGp1c3RlZCA9IG5vdyAtIHRoaXMuY2xvY2tEcmlmdDtcbiAgICByZXR1cm4gYWRqdXN0ZWQgPCB0aGlzLmFjY2Vzc1Rva2VuLmdldEV4cGlyYXRpb24oKSAmJiBhZGp1c3RlZCA8IHRoaXMuaWRUb2tlbi5nZXRFeHBpcmF0aW9uKCk7XG4gIH07XG5cbiAgcmV0dXJuIENvZ25pdG9Vc2VyU2Vzc2lvbjtcbn0oKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBDb2duaXRvVXNlclNlc3Npb247IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIENvb2tpZXMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChyZXF1aXJlKFwianMtY29va2llXCIpKTtcblxuZnVuY3Rpb24gX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlKCkgeyBpZiAodHlwZW9mIFdlYWtNYXAgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIG51bGw7IHZhciBjYWNoZSA9IG5ldyBXZWFrTWFwKCk7IF9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZSA9IGZ1bmN0aW9uIF9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZSgpIHsgcmV0dXJuIGNhY2hlOyB9OyByZXR1cm4gY2FjaGU7IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBpZiAob2JqID09PSBudWxsIHx8IHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iaiAhPT0gXCJmdW5jdGlvblwiKSB7IHJldHVybiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfSB2YXIgY2FjaGUgPSBfZ2V0UmVxdWlyZVdpbGRjYXJkQ2FjaGUoKTsgaWYgKGNhY2hlICYmIGNhY2hlLmhhcyhvYmopKSB7IHJldHVybiBjYWNoZS5nZXQob2JqKTsgfSB2YXIgbmV3T2JqID0ge307IHZhciBoYXNQcm9wZXJ0eURlc2NyaXB0b3IgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkgJiYgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyB2YXIgZGVzYyA9IGhhc1Byb3BlcnR5RGVzY3JpcHRvciA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpIDogbnVsbDsgaWYgKGRlc2MgJiYgKGRlc2MuZ2V0IHx8IGRlc2Muc2V0KSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkobmV3T2JqLCBrZXksIGRlc2MpOyB9IGVsc2UgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmpbXCJkZWZhdWx0XCJdID0gb2JqOyBpZiAoY2FjaGUpIHsgY2FjaGUuc2V0KG9iaiwgbmV3T2JqKTsgfSByZXR1cm4gbmV3T2JqOyB9XG5cbi8qKiBAY2xhc3MgKi9cbnZhciBDb29raWVTdG9yYWdlID1cbi8qI19fUFVSRV9fKi9cbmZ1bmN0aW9uICgpIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgYSBuZXcgQ29va2llU3RvcmFnZSBvYmplY3RcbiAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgQ3JlYXRpb24gb3B0aW9ucy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGEuZG9tYWluIENvb2tpZXMgZG9tYWluIChtYW5kYXRvcnkpLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YS5wYXRoIENvb2tpZXMgcGF0aCAoZGVmYXVsdDogJy8nKVxuICAgKiBAcGFyYW0ge2ludGVnZXJ9IGRhdGEuZXhwaXJlcyBDb29raWUgZXhwaXJhdGlvbiAoaW4gZGF5cywgZGVmYXVsdDogMzY1KVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGRhdGEuc2VjdXJlIENvb2tpZSBzZWN1cmUgZmxhZyAoZGVmYXVsdDogdHJ1ZSlcbiAgICovXG4gIGZ1bmN0aW9uIENvb2tpZVN0b3JhZ2UoZGF0YSkge1xuICAgIGlmIChkYXRhLmRvbWFpbikge1xuICAgICAgdGhpcy5kb21haW4gPSBkYXRhLmRvbWFpbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZG9tYWluIG9mIGNvb2tpZVN0b3JhZ2UgY2FuIG5vdCBiZSB1bmRlZmluZWQuJyk7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEucGF0aCkge1xuICAgICAgdGhpcy5wYXRoID0gZGF0YS5wYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhdGggPSAnLyc7XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCAnZXhwaXJlcycpKSB7XG4gICAgICB0aGlzLmV4cGlyZXMgPSBkYXRhLmV4cGlyZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZXhwaXJlcyA9IDM2NTtcbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsICdzZWN1cmUnKSkge1xuICAgICAgdGhpcy5zZWN1cmUgPSBkYXRhLnNlY3VyZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZWN1cmUgPSB0cnVlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIHNldCBhIHNwZWNpZmljIGl0ZW0gaW4gc3RvcmFnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gdGhlIGtleSBmb3IgdGhlIGl0ZW1cbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlIC0gdGhlIHZhbHVlXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHZhbHVlIHRoYXQgd2FzIHNldFxuICAgKi9cblxuXG4gIHZhciBfcHJvdG8gPSBDb29raWVTdG9yYWdlLnByb3RvdHlwZTtcblxuICBfcHJvdG8uc2V0SXRlbSA9IGZ1bmN0aW9uIHNldEl0ZW0oa2V5LCB2YWx1ZSkge1xuICAgIENvb2tpZXMuc2V0KGtleSwgdmFsdWUsIHtcbiAgICAgIHBhdGg6IHRoaXMucGF0aCxcbiAgICAgIGV4cGlyZXM6IHRoaXMuZXhwaXJlcyxcbiAgICAgIGRvbWFpbjogdGhpcy5kb21haW4sXG4gICAgICBzZWN1cmU6IHRoaXMuc2VjdXJlXG4gICAgfSk7XG4gICAgcmV0dXJuIENvb2tpZXMuZ2V0KGtleSk7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBnZXQgYSBzcGVjaWZpYyBrZXkgZnJvbSBzdG9yYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSB0aGUga2V5IGZvciB0aGUgaXRlbVxuICAgKiBUaGlzIGlzIHVzZWQgdG8gY2xlYXIgdGhlIHN0b3JhZ2VcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIGRhdGEgaXRlbVxuICAgKi9cbiAgO1xuXG4gIF9wcm90by5nZXRJdGVtID0gZnVuY3Rpb24gZ2V0SXRlbShrZXkpIHtcbiAgICByZXR1cm4gQ29va2llcy5nZXQoa2V5KTtcbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIHJlbW92ZSBhbiBpdGVtIGZyb20gc3RvcmFnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gdGhlIGtleSBiZWluZyBzZXRcbiAgICogQHJldHVybnMge3N0cmluZ30gdmFsdWUgLSB2YWx1ZSB0aGF0IHdhcyBkZWxldGVkXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSkge1xuICAgIHJldHVybiBDb29raWVzLnJlbW92ZShrZXksIHtcbiAgICAgIHBhdGg6IHRoaXMucGF0aCxcbiAgICAgIGRvbWFpbjogdGhpcy5kb21haW4sXG4gICAgICBzZWN1cmU6IHRoaXMuc2VjdXJlXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBjbGVhciB0aGUgc3RvcmFnZVxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBub3RoaW5nXG4gICAqL1xuICA7XG5cbiAgX3Byb3RvLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdmFyIGNvb2tpZXMgPSBDb29raWVzLmdldCgpO1xuICAgIHZhciBpbmRleDtcblxuICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IGNvb2tpZXMubGVuZ3RoOyArK2luZGV4KSB7XG4gICAgICBDb29raWVzLnJlbW92ZShjb29raWVzW2luZGV4XSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHt9O1xuICB9O1xuXG4gIHJldHVybiBDb29raWVTdG9yYWdlO1xufSgpO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IENvb2tpZVN0b3JhZ2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxuLyohXG4gKiBDb3B5cmlnaHQgMjAxNiBBbWF6b24uY29tLFxuICogSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQW1hem9uIFNvZnR3YXJlIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIikuXG4gKiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlXG4gKiBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwOi8vYXdzLmFtYXpvbi5jb20vYXNsL1xuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpc1xuICogZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlXG4gKiBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgbW9udGhOYW1lcyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXTtcbnZhciB3ZWVrTmFtZXMgPSBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddO1xuLyoqIEBjbGFzcyAqL1xuXG52YXIgRGF0ZUhlbHBlciA9XG4vKiNfX1BVUkVfXyovXG5mdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIERhdGVIZWxwZXIoKSB7fVxuXG4gIHZhciBfcHJvdG8gPSBEYXRlSGVscGVyLnByb3RvdHlwZTtcblxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ30gVGhlIGN1cnJlbnQgdGltZSBpbiBcImRkZCBNTU0gRCBISDptbTpzcyBVVEMgWVlZWVwiIGZvcm1hdC5cbiAgICovXG4gIF9wcm90by5nZXROb3dTdHJpbmcgPSBmdW5jdGlvbiBnZXROb3dTdHJpbmcoKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgdmFyIHdlZWtEYXkgPSB3ZWVrTmFtZXNbbm93LmdldFVUQ0RheSgpXTtcbiAgICB2YXIgbW9udGggPSBtb250aE5hbWVzW25vdy5nZXRVVENNb250aCgpXTtcbiAgICB2YXIgZGF5ID0gbm93LmdldFVUQ0RhdGUoKTtcbiAgICB2YXIgaG91cnMgPSBub3cuZ2V0VVRDSG91cnMoKTtcblxuICAgIGlmIChob3VycyA8IDEwKSB7XG4gICAgICBob3VycyA9IFwiMFwiICsgaG91cnM7XG4gICAgfVxuXG4gICAgdmFyIG1pbnV0ZXMgPSBub3cuZ2V0VVRDTWludXRlcygpO1xuXG4gICAgaWYgKG1pbnV0ZXMgPCAxMCkge1xuICAgICAgbWludXRlcyA9IFwiMFwiICsgbWludXRlcztcbiAgICB9XG5cbiAgICB2YXIgc2Vjb25kcyA9IG5vdy5nZXRVVENTZWNvbmRzKCk7XG5cbiAgICBpZiAoc2Vjb25kcyA8IDEwKSB7XG4gICAgICBzZWNvbmRzID0gXCIwXCIgKyBzZWNvbmRzO1xuICAgIH1cblxuICAgIHZhciB5ZWFyID0gbm93LmdldFVUQ0Z1bGxZZWFyKCk7IC8vIGRkZCBNTU0gRCBISDptbTpzcyBVVEMgWVlZWVxuXG4gICAgdmFyIGRhdGVOb3cgPSB3ZWVrRGF5ICsgXCIgXCIgKyBtb250aCArIFwiIFwiICsgZGF5ICsgXCIgXCIgKyBob3VycyArIFwiOlwiICsgbWludXRlcyArIFwiOlwiICsgc2Vjb25kcyArIFwiIFVUQyBcIiArIHllYXI7XG4gICAgcmV0dXJuIGRhdGVOb3c7XG4gIH07XG5cbiAgcmV0dXJuIERhdGVIZWxwZXI7XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gRGF0ZUhlbHBlcjsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG4vKiFcbiAqIENvcHlyaWdodCAyMDE2IEFtYXpvbi5jb20sXG4gKiBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBbWF6b24gU29mdHdhcmUgTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKS5cbiAqIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGVcbiAqIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHA6Ly9hd3MuYW1hem9uLmNvbS9hc2wvXG4gKlxuICogb3IgaW4gdGhlIFwibGljZW5zZVwiIGZpbGUgYWNjb21wYW55aW5nIHRoaXMgZmlsZS4gVGhpcyBmaWxlIGlzXG4gKiBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2VcbiAqIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBkYXRhTWVtb3J5ID0ge307XG4vKiogQGNsYXNzICovXG5cbnZhciBNZW1vcnlTdG9yYWdlID1cbi8qI19fUFVSRV9fKi9cbmZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTWVtb3J5U3RvcmFnZSgpIHt9XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBzZXQgYSBzcGVjaWZpYyBpdGVtIGluIHN0b3JhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIHRoZSBrZXkgZm9yIHRoZSBpdGVtXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZSAtIHRoZSB2YWx1ZVxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB2YWx1ZSB0aGF0IHdhcyBzZXRcbiAgICovXG4gIE1lbW9yeVN0b3JhZ2Uuc2V0SXRlbSA9IGZ1bmN0aW9uIHNldEl0ZW0oa2V5LCB2YWx1ZSkge1xuICAgIGRhdGFNZW1vcnlba2V5XSA9IHZhbHVlO1xuICAgIHJldHVybiBkYXRhTWVtb3J5W2tleV07XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBnZXQgYSBzcGVjaWZpYyBrZXkgZnJvbSBzdG9yYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSB0aGUga2V5IGZvciB0aGUgaXRlbVxuICAgKiBUaGlzIGlzIHVzZWQgdG8gY2xlYXIgdGhlIHN0b3JhZ2VcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIGRhdGEgaXRlbVxuICAgKi9cbiAgO1xuXG4gIE1lbW9yeVN0b3JhZ2UuZ2V0SXRlbSA9IGZ1bmN0aW9uIGdldEl0ZW0oa2V5KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhTWVtb3J5LCBrZXkpID8gZGF0YU1lbW9yeVtrZXldIDogdW5kZWZpbmVkO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gcmVtb3ZlIGFuIGl0ZW0gZnJvbSBzdG9yYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSB0aGUga2V5IGJlaW5nIHNldFxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB2YWx1ZSAtIHZhbHVlIHRoYXQgd2FzIGRlbGV0ZWRcbiAgICovXG4gIDtcblxuICBNZW1vcnlTdG9yYWdlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSkge1xuICAgIHJldHVybiBkZWxldGUgZGF0YU1lbW9yeVtrZXldO1xuICB9XG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gY2xlYXIgdGhlIHN0b3JhZ2VcbiAgICogQHJldHVybnMge3N0cmluZ30gbm90aGluZ1xuICAgKi9cbiAgO1xuXG4gIE1lbW9yeVN0b3JhZ2UuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBkYXRhTWVtb3J5ID0ge307XG4gICAgcmV0dXJuIGRhdGFNZW1vcnk7XG4gIH07XG5cbiAgcmV0dXJuIE1lbW9yeVN0b3JhZ2U7XG59KCk7XG4vKiogQGNsYXNzICovXG5cblxudmFyIFN0b3JhZ2VIZWxwZXIgPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIGdldCBhIHN0b3JhZ2Ugb2JqZWN0XG4gICAqIEByZXR1cm5zIHtvYmplY3R9IHRoZSBzdG9yYWdlXG4gICAqL1xuICBmdW5jdGlvbiBTdG9yYWdlSGVscGVyKCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnN0b3JhZ2VXaW5kb3cgPSB3aW5kb3cubG9jYWxTdG9yYWdlO1xuICAgICAgdGhpcy5zdG9yYWdlV2luZG93LnNldEl0ZW0oJ2F3cy5jb2duaXRvLnRlc3QtbHMnLCAxKTtcbiAgICAgIHRoaXMuc3RvcmFnZVdpbmRvdy5yZW1vdmVJdGVtKCdhd3MuY29nbml0by50ZXN0LWxzJyk7XG4gICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICB0aGlzLnN0b3JhZ2VXaW5kb3cgPSBNZW1vcnlTdG9yYWdlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIHRvIHJldHVybiB0aGUgc3RvcmFnZVxuICAgKiBAcmV0dXJucyB7b2JqZWN0fSB0aGUgc3RvcmFnZVxuICAgKi9cblxuXG4gIHZhciBfcHJvdG8gPSBTdG9yYWdlSGVscGVyLnByb3RvdHlwZTtcblxuICBfcHJvdG8uZ2V0U3RvcmFnZSA9IGZ1bmN0aW9uIGdldFN0b3JhZ2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcmFnZVdpbmRvdztcbiAgfTtcblxuICByZXR1cm4gU3RvcmFnZUhlbHBlcjtcbn0oKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBTdG9yYWdlSGVscGVyOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG4vLyBjbGFzcyBmb3IgZGVmaW5pbmcgdGhlIGFtem4gdXNlci1hZ2VudFxudmFyIF9kZWZhdWx0ID0gVXNlckFnZW50OyAvLyBjb25zdHJ1Y3RvclxuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0O1xuXG5mdW5jdGlvbiBVc2VyQWdlbnQoKSB7fSAvLyBwdWJsaWNcblxuXG5Vc2VyQWdlbnQucHJvdG90eXBlLnVzZXJBZ2VudCA9ICdhd3MtYW1wbGlmeS8wLjEueCBqcyc7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzLkRhdGVIZWxwZXIgPSBleHBvcnRzLkNvb2tpZVN0b3JhZ2UgPSBleHBvcnRzLkNvZ25pdG9Vc2VyU2Vzc2lvbiA9IGV4cG9ydHMuQ29nbml0b1VzZXJQb29sID0gZXhwb3J0cy5Db2duaXRvVXNlckF0dHJpYnV0ZSA9IGV4cG9ydHMuQ29nbml0b1VzZXIgPSBleHBvcnRzLkNvZ25pdG9SZWZyZXNoVG9rZW4gPSBleHBvcnRzLkNvZ25pdG9JZFRva2VuID0gZXhwb3J0cy5Db2duaXRvQWNjZXNzVG9rZW4gPSBleHBvcnRzLkF1dGhlbnRpY2F0aW9uSGVscGVyID0gZXhwb3J0cy5BdXRoZW50aWNhdGlvbkRldGFpbHMgPSB2b2lkIDA7XG5cbnZhciBfQXV0aGVudGljYXRpb25EZXRhaWxzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdXRoZW50aWNhdGlvbkRldGFpbHNcIikpO1xuXG5leHBvcnRzLkF1dGhlbnRpY2F0aW9uRGV0YWlscyA9IF9BdXRoZW50aWNhdGlvbkRldGFpbHNbXCJkZWZhdWx0XCJdO1xuXG52YXIgX0F1dGhlbnRpY2F0aW9uSGVscGVyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdXRoZW50aWNhdGlvbkhlbHBlclwiKSk7XG5cbmV4cG9ydHMuQXV0aGVudGljYXRpb25IZWxwZXIgPSBfQXV0aGVudGljYXRpb25IZWxwZXJbXCJkZWZhdWx0XCJdO1xuXG52YXIgX0NvZ25pdG9BY2Nlc3NUb2tlbiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29nbml0b0FjY2Vzc1Rva2VuXCIpKTtcblxuZXhwb3J0cy5Db2duaXRvQWNjZXNzVG9rZW4gPSBfQ29nbml0b0FjY2Vzc1Rva2VuW1wiZGVmYXVsdFwiXTtcblxudmFyIF9Db2duaXRvSWRUb2tlbiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29nbml0b0lkVG9rZW5cIikpO1xuXG5leHBvcnRzLkNvZ25pdG9JZFRva2VuID0gX0NvZ25pdG9JZFRva2VuW1wiZGVmYXVsdFwiXTtcblxudmFyIF9Db2duaXRvUmVmcmVzaFRva2VuID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Db2duaXRvUmVmcmVzaFRva2VuXCIpKTtcblxuZXhwb3J0cy5Db2duaXRvUmVmcmVzaFRva2VuID0gX0NvZ25pdG9SZWZyZXNoVG9rZW5bXCJkZWZhdWx0XCJdO1xuXG52YXIgX0NvZ25pdG9Vc2VyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Db2duaXRvVXNlclwiKSk7XG5cbmV4cG9ydHMuQ29nbml0b1VzZXIgPSBfQ29nbml0b1VzZXJbXCJkZWZhdWx0XCJdO1xuXG52YXIgX0NvZ25pdG9Vc2VyQXR0cmlidXRlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Db2duaXRvVXNlckF0dHJpYnV0ZVwiKSk7XG5cbmV4cG9ydHMuQ29nbml0b1VzZXJBdHRyaWJ1dGUgPSBfQ29nbml0b1VzZXJBdHRyaWJ1dGVbXCJkZWZhdWx0XCJdO1xuXG52YXIgX0NvZ25pdG9Vc2VyUG9vbCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29nbml0b1VzZXJQb29sXCIpKTtcblxuZXhwb3J0cy5Db2duaXRvVXNlclBvb2wgPSBfQ29nbml0b1VzZXJQb29sW1wiZGVmYXVsdFwiXTtcblxudmFyIF9Db2duaXRvVXNlclNlc3Npb24gPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0NvZ25pdG9Vc2VyU2Vzc2lvblwiKSk7XG5cbmV4cG9ydHMuQ29nbml0b1VzZXJTZXNzaW9uID0gX0NvZ25pdG9Vc2VyU2Vzc2lvbltcImRlZmF1bHRcIl07XG5cbnZhciBfQ29va2llU3RvcmFnZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQ29va2llU3RvcmFnZVwiKSk7XG5cbmV4cG9ydHMuQ29va2llU3RvcmFnZSA9IF9Db29raWVTdG9yYWdlW1wiZGVmYXVsdFwiXTtcblxudmFyIF9EYXRlSGVscGVyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9EYXRlSGVscGVyXCIpKTtcblxuZXhwb3J0cy5EYXRlSGVscGVyID0gX0RhdGVIZWxwZXJbXCJkZWZhdWx0XCJdO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH0iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBEdWUgdG8gdmFyaW91cyBicm93c2VyIGJ1Z3MsIHNvbWV0aW1lcyB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uIHdpbGwgYmUgdXNlZCBldmVuXG4gKiB3aGVuIHRoZSBicm93c2VyIHN1cHBvcnRzIHR5cGVkIGFycmF5cy5cbiAqXG4gKiBOb3RlOlxuICpcbiAqICAgLSBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsXG4gKiAgICAgU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzguXG4gKlxuICogICAtIENocm9tZSA5LTEwIGlzIG1pc3NpbmcgdGhlIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24uXG4gKlxuICogICAtIElFMTAgaGFzIGEgYnJva2VuIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhcnJheXMgb2ZcbiAqICAgICBpbmNvcnJlY3QgbGVuZ3RoIGluIHNvbWUgc2l0dWF0aW9ucy5cblxuICogV2UgZGV0ZWN0IHRoZXNlIGJ1Z2d5IGJyb3dzZXJzIGFuZCBzZXQgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYCB0byBgZmFsc2VgIHNvIHRoZXlcbiAqIGdldCB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uLCB3aGljaCBpcyBzbG93ZXIgYnV0IGJlaGF2ZXMgY29ycmVjdGx5LlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUICE9PSB1bmRlZmluZWRcbiAgPyBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVFxuICA6IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuLypcbiAqIEV4cG9ydCBrTWF4TGVuZ3RoIGFmdGVyIHR5cGVkIGFycmF5IHN1cHBvcnQgaXMgZGV0ZXJtaW5lZC5cbiAqL1xuZXhwb3J0cy5rTWF4TGVuZ3RoID0ga01heExlbmd0aCgpXG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuX19wcm90b19fID0ge19fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfX1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICBhcnIuc3ViYXJyYXkoMSwgMSkuYnl0ZUxlbmd0aCA9PT0gMCAvLyBpZTEwIGhhcyBicm9rZW4gYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24ga01heExlbmd0aCAoKSB7XG4gIHJldHVybiBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVFxuICAgID8gMHg3ZmZmZmZmZlxuICAgIDogMHgzZmZmZmZmZlxufVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKHRoYXQsIGxlbmd0aCkge1xuICBpZiAoa01heExlbmd0aCgpIDwgbGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgdHlwZWQgYXJyYXkgbGVuZ3RoJylcbiAgfVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICAgIHRoYXQuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICBpZiAodGhhdCA9PT0gbnVsbCkge1xuICAgICAgdGhhdCA9IG5ldyBCdWZmZXIobGVuZ3RoKVxuICAgIH1cbiAgICB0aGF0Lmxlbmd0aCA9IGxlbmd0aFxuICB9XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0lmIGVuY29kaW5nIGlzIHNwZWNpZmllZCB0aGVuIHRoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJ1xuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYWxsb2NVbnNhZmUodGhpcywgYXJnKVxuICB9XG4gIHJldHVybiBmcm9tKHRoaXMsIGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuLy8gVE9ETzogTGVnYWN5LCBub3QgbmVlZGVkIGFueW1vcmUuIFJlbW92ZSBpbiBuZXh0IG1ham9yIHZlcnNpb24uXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gZnJvbSAodGhhdCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlcicpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh0aGF0LCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIHJldHVybiBmcm9tT2JqZWN0KHRoYXQsIHZhbHVlKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKG51bGwsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbmlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICBCdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG4gIEJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAmJlxuICAgICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gICAgLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgICAgdmFsdWU6IG51bGwsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgYSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG5lZ2F0aXZlJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAodGhhdCwgc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHRoYXQsIHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2MobnVsbCwgc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlICh0aGF0LCBzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgdGhhdCA9IGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgKytpKSB7XG4gICAgICB0aGF0W2ldID0gMFxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKG51bGwsIHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKG51bGwsIHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHRoYXQsIHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJlbmNvZGluZ1wiIG11c3QgYmUgYSB2YWxpZCBzdHJpbmcgZW5jb2RpbmcnKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgbGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICB0aGF0ID0gdGhhdC5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGFycmF5LmJ5dGVMZW5ndGggLy8gdGhpcyB0aHJvd3MgaWYgYGFycmF5YCBpcyBub3QgYSB2YWxpZCBBcnJheUJ1ZmZlclxuXG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcXCdvZmZzZXRcXCcgaXMgb3V0IG9mIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1xcJ2xlbmd0aFxcJyBpcyBvdXQgb2YgYm91bmRzJylcbiAgfVxuXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBhcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBhcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gYXJyYXlcbiAgICB0aGF0Ll9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdCA9IGZyb21BcnJheUxpa2UodGhhdCwgYXJyYXkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAodGhhdCwgb2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgbGVuKVxuXG4gICAgaWYgKHRoYXQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhhdFxuICAgIH1cblxuICAgIG9iai5jb3B5KHRoYXQsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gdGhhdFxuICB9XG5cbiAgaWYgKG9iaikge1xuICAgIGlmICgodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICBvYmouYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHx8ICdsZW5ndGgnIGluIG9iaikge1xuICAgICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBpc25hbihvYmoubGVuZ3RoKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHRoYXQsIDApXG4gICAgICB9XG4gICAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh0aGF0LCBvYmopXG4gICAgfVxuXG4gICAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBpc0FycmF5KG9iai5kYXRhKSkge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqLmRhdGEpXG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignRmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksIG9yIGFycmF5LWxpa2Ugb2JqZWN0LicpXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBrTWF4TGVuZ3RoKClgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0ga01heExlbmd0aCgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgoKS50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgKEFycmF5QnVmZmVyLmlzVmlldyhzdHJpbmcpIHx8IHN0cmluZyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHN0cmluZyA9ICcnICsgc3RyaW5nXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAobGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoZSBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIGFuZCBgaXMtYnVmZmVyYCAoaW4gU2FmYXJpIDUtNykgdG8gZGV0ZWN0XG4vLyBCdWZmZXIgaW5zdGFuY2VzLlxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCB8IDBcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLm1hdGNoKC8uezJ9L2cpLmpvaW4oJyAnKVxuICAgIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0ICAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAoaXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJlxuICAgICAgICB0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCB8IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICAvLyBsZWdhY3kgd3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpIC0gcmVtb3ZlIGluIHYwLjEzXG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47ICsraSkge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgKytpKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7ICsraSkge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmIChjb2RlIDwgMjU2KSB7XG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiB1dGY4VG9CeXRlcyhuZXcgQnVmZmVyKHZhbCwgZW5jb2RpbmcpLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0cmluZ3RyaW0oc3RyKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGlzbmFuICh2YWwpIHtcbiAgcmV0dXJuIHZhbCAhPT0gdmFsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCI7KGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuXHRcdC8vIENvbW1vbkpTXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZmFjdG9yeSgpO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0fVxuXHRlbHNlIHtcblx0XHQvLyBHbG9iYWwgKGJyb3dzZXIpXG5cdFx0cm9vdC5DcnlwdG9KUyA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cblx0LyoqXG5cdCAqIENyeXB0b0pTIGNvcmUgY29tcG9uZW50cy5cblx0ICovXG5cdHZhciBDcnlwdG9KUyA9IENyeXB0b0pTIHx8IChmdW5jdGlvbiAoTWF0aCwgdW5kZWZpbmVkKSB7XG5cdCAgICAvKlxuXHQgICAgICogTG9jYWwgcG9seWZpbCBvZiBPYmplY3QuY3JlYXRlXG5cdCAgICAgKi9cblx0ICAgIHZhciBjcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgZnVuY3Rpb24gRigpIHt9O1xuXG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcblx0ICAgICAgICAgICAgdmFyIHN1YnR5cGU7XG5cblx0ICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBvYmo7XG5cblx0ICAgICAgICAgICAgc3VidHlwZSA9IG5ldyBGKCk7XG5cblx0ICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBudWxsO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBzdWJ0eXBlO1xuXHQgICAgICAgIH07XG5cdCAgICB9KCkpXG5cblx0ICAgIC8qKlxuXHQgICAgICogQ3J5cHRvSlMgbmFtZXNwYWNlLlxuXHQgICAgICovXG5cdCAgICB2YXIgQyA9IHt9O1xuXG5cdCAgICAvKipcblx0ICAgICAqIExpYnJhcnkgbmFtZXNwYWNlLlxuXHQgICAgICovXG5cdCAgICB2YXIgQ19saWIgPSBDLmxpYiA9IHt9O1xuXG5cdCAgICAvKipcblx0ICAgICAqIEJhc2Ugb2JqZWN0IGZvciBwcm90b3R5cGFsIGluaGVyaXRhbmNlLlxuXHQgICAgICovXG5cdCAgICB2YXIgQmFzZSA9IENfbGliLkJhc2UgPSAoZnVuY3Rpb24gKCkge1xuXG5cblx0ICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICAvKipcblx0ICAgICAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIHRoaXMgb2JqZWN0LlxuXHQgICAgICAgICAgICAgKlxuXHQgICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3ZlcnJpZGVzIFByb3BlcnRpZXMgdG8gY29weSBpbnRvIHRoZSBuZXcgb2JqZWN0LlxuXHQgICAgICAgICAgICAgKlxuXHQgICAgICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBuZXcgb2JqZWN0LlxuXHQgICAgICAgICAgICAgKlxuXHQgICAgICAgICAgICAgKiBAc3RhdGljXG5cdCAgICAgICAgICAgICAqXG5cdCAgICAgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICAgICAqXG5cdCAgICAgICAgICAgICAqICAgICB2YXIgTXlUeXBlID0gQ3J5cHRvSlMubGliLkJhc2UuZXh0ZW5kKHtcblx0ICAgICAgICAgICAgICogICAgICAgICBmaWVsZDogJ3ZhbHVlJyxcblx0ICAgICAgICAgICAgICpcblx0ICAgICAgICAgICAgICogICAgICAgICBtZXRob2Q6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICogICAgICAgICB9XG5cdCAgICAgICAgICAgICAqICAgICB9KTtcblx0ICAgICAgICAgICAgICovXG5cdCAgICAgICAgICAgIGV4dGVuZDogZnVuY3Rpb24gKG92ZXJyaWRlcykge1xuXHQgICAgICAgICAgICAgICAgLy8gU3Bhd25cblx0ICAgICAgICAgICAgICAgIHZhciBzdWJ0eXBlID0gY3JlYXRlKHRoaXMpO1xuXG5cdCAgICAgICAgICAgICAgICAvLyBBdWdtZW50XG5cdCAgICAgICAgICAgICAgICBpZiAob3ZlcnJpZGVzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc3VidHlwZS5taXhJbihvdmVycmlkZXMpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvLyBDcmVhdGUgZGVmYXVsdCBpbml0aWFsaXplclxuXHQgICAgICAgICAgICAgICAgaWYgKCFzdWJ0eXBlLmhhc093blByb3BlcnR5KCdpbml0JykgfHwgdGhpcy5pbml0ID09PSBzdWJ0eXBlLmluaXQpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzdWJ0eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN1YnR5cGUuJHN1cGVyLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplcidzIHByb3RvdHlwZSBpcyB0aGUgc3VidHlwZSBvYmplY3Rcblx0ICAgICAgICAgICAgICAgIHN1YnR5cGUuaW5pdC5wcm90b3R5cGUgPSBzdWJ0eXBlO1xuXG5cdCAgICAgICAgICAgICAgICAvLyBSZWZlcmVuY2Ugc3VwZXJ0eXBlXG5cdCAgICAgICAgICAgICAgICBzdWJ0eXBlLiRzdXBlciA9IHRoaXM7XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiBzdWJ0eXBlO1xuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qKlxuXHQgICAgICAgICAgICAgKiBFeHRlbmRzIHRoaXMgb2JqZWN0IGFuZCBydW5zIHRoZSBpbml0IG1ldGhvZC5cblx0ICAgICAgICAgICAgICogQXJndW1lbnRzIHRvIGNyZWF0ZSgpIHdpbGwgYmUgcGFzc2VkIHRvIGluaXQoKS5cblx0ICAgICAgICAgICAgICpcblx0ICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgbmV3IG9iamVjdC5cblx0ICAgICAgICAgICAgICpcblx0ICAgICAgICAgICAgICogQHN0YXRpY1xuXHQgICAgICAgICAgICAgKlxuXHQgICAgICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAgICAgKlxuXHQgICAgICAgICAgICAgKiAgICAgdmFyIGluc3RhbmNlID0gTXlUeXBlLmNyZWF0ZSgpO1xuXHQgICAgICAgICAgICAgKi9cblx0ICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmV4dGVuZCgpO1xuXHQgICAgICAgICAgICAgICAgaW5zdGFuY2UuaW5pdC5hcHBseShpbnN0YW5jZSwgYXJndW1lbnRzKTtcblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qKlxuXHQgICAgICAgICAgICAgKiBJbml0aWFsaXplcyBhIG5ld2x5IGNyZWF0ZWQgb2JqZWN0LlxuXHQgICAgICAgICAgICAgKiBPdmVycmlkZSB0aGlzIG1ldGhvZCB0byBhZGQgc29tZSBsb2dpYyB3aGVuIHlvdXIgb2JqZWN0cyBhcmUgY3JlYXRlZC5cblx0ICAgICAgICAgICAgICpcblx0ICAgICAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgICAgICpcblx0ICAgICAgICAgICAgICogICAgIHZhciBNeVR5cGUgPSBDcnlwdG9KUy5saWIuQmFzZS5leHRlbmQoe1xuXHQgICAgICAgICAgICAgKiAgICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICogICAgICAgICAgICAgLy8gLi4uXG5cdCAgICAgICAgICAgICAqICAgICAgICAgfVxuXHQgICAgICAgICAgICAgKiAgICAgfSk7XG5cdCAgICAgICAgICAgICAqL1xuXHQgICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyoqXG5cdCAgICAgICAgICAgICAqIENvcGllcyBwcm9wZXJ0aWVzIGludG8gdGhpcyBvYmplY3QuXG5cdCAgICAgICAgICAgICAqXG5cdCAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIFRoZSBwcm9wZXJ0aWVzIHRvIG1peCBpbi5cblx0ICAgICAgICAgICAgICpcblx0ICAgICAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgICAgICpcblx0ICAgICAgICAgICAgICogICAgIE15VHlwZS5taXhJbih7XG5cdCAgICAgICAgICAgICAqICAgICAgICAgZmllbGQ6ICd2YWx1ZSdcblx0ICAgICAgICAgICAgICogICAgIH0pO1xuXHQgICAgICAgICAgICAgKi9cblx0ICAgICAgICAgICAgbWl4SW46IGZ1bmN0aW9uIChwcm9wZXJ0aWVzKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eU5hbWUgaW4gcHJvcGVydGllcykge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KHByb3BlcnR5TmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLy8gSUUgd29uJ3QgY29weSB0b1N0cmluZyB1c2luZyB0aGUgbG9vcCBhYm92ZVxuXHQgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoJ3RvU3RyaW5nJykpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLnRvU3RyaW5nID0gcHJvcGVydGllcy50b1N0cmluZztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKipcblx0ICAgICAgICAgICAgICogQ3JlYXRlcyBhIGNvcHkgb2YgdGhpcyBvYmplY3QuXG5cdCAgICAgICAgICAgICAqXG5cdCAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNsb25lLlxuXHQgICAgICAgICAgICAgKlxuXHQgICAgICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAgICAgKlxuXHQgICAgICAgICAgICAgKiAgICAgdmFyIGNsb25lID0gaW5zdGFuY2UuY2xvbmUoKTtcblx0ICAgICAgICAgICAgICovXG5cdCAgICAgICAgICAgIGNsb25lOiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbml0LnByb3RvdHlwZS5leHRlbmQodGhpcyk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9O1xuXHQgICAgfSgpKTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBBbiBhcnJheSBvZiAzMi1iaXQgd29yZHMuXG5cdCAgICAgKlxuXHQgICAgICogQHByb3BlcnR5IHtBcnJheX0gd29yZHMgVGhlIGFycmF5IG9mIDMyLWJpdCB3b3Jkcy5cblx0ICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaWdCeXRlcyBUaGUgbnVtYmVyIG9mIHNpZ25pZmljYW50IGJ5dGVzIGluIHRoaXMgd29yZCBhcnJheS5cblx0ICAgICAqL1xuXHQgICAgdmFyIFdvcmRBcnJheSA9IENfbGliLldvcmRBcnJheSA9IEJhc2UuZXh0ZW5kKHtcblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBJbml0aWFsaXplcyBhIG5ld2x5IGNyZWF0ZWQgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IHdvcmRzIChPcHRpb25hbCkgQW4gYXJyYXkgb2YgMzItYml0IHdvcmRzLlxuXHQgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzaWdCeXRlcyAoT3B0aW9uYWwpIFRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgYnl0ZXMgaW4gdGhlIHdvcmRzLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgd29yZEFycmF5ID0gQ3J5cHRvSlMubGliLldvcmRBcnJheS5jcmVhdGUoKTtcblx0ICAgICAgICAgKiAgICAgdmFyIHdvcmRBcnJheSA9IENyeXB0b0pTLmxpYi5Xb3JkQXJyYXkuY3JlYXRlKFsweDAwMDEwMjAzLCAweDA0MDUwNjA3XSk7XG5cdCAgICAgICAgICogICAgIHZhciB3b3JkQXJyYXkgPSBDcnlwdG9KUy5saWIuV29yZEFycmF5LmNyZWF0ZShbMHgwMDAxMDIwMywgMHgwNDA1MDYwN10sIDYpO1xuXHQgICAgICAgICAqL1xuXHQgICAgICAgIGluaXQ6IGZ1bmN0aW9uICh3b3Jkcywgc2lnQnl0ZXMpIHtcblx0ICAgICAgICAgICAgd29yZHMgPSB0aGlzLndvcmRzID0gd29yZHMgfHwgW107XG5cblx0ICAgICAgICAgICAgaWYgKHNpZ0J5dGVzICE9IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5zaWdCeXRlcyA9IHNpZ0J5dGVzO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5zaWdCeXRlcyA9IHdvcmRzLmxlbmd0aCAqIDQ7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqXG5cdCAgICAgICAgICogQ29udmVydHMgdGhpcyB3b3JkIGFycmF5IHRvIGEgc3RyaW5nLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyIChPcHRpb25hbCkgVGhlIGVuY29kaW5nIHN0cmF0ZWd5IHRvIHVzZS4gRGVmYXVsdDogQ3J5cHRvSlMuZW5jLkhleFxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgc3RyaW5naWZpZWQgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgdmFyIHN0cmluZyA9IHdvcmRBcnJheSArICcnO1xuXHQgICAgICAgICAqICAgICB2YXIgc3RyaW5nID0gd29yZEFycmF5LnRvU3RyaW5nKCk7XG5cdCAgICAgICAgICogICAgIHZhciBzdHJpbmcgPSB3b3JkQXJyYXkudG9TdHJpbmcoQ3J5cHRvSlMuZW5jLlV0ZjgpO1xuXHQgICAgICAgICAqL1xuXHQgICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAoZW5jb2Rlcikge1xuXHQgICAgICAgICAgICByZXR1cm4gKGVuY29kZXIgfHwgSGV4KS5zdHJpbmdpZnkodGhpcyk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENvbmNhdGVuYXRlcyBhIHdvcmQgYXJyYXkgdG8gdGhpcyB3b3JkIGFycmF5LlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtXb3JkQXJyYXl9IHdvcmRBcnJheSBUaGUgd29yZCBhcnJheSB0byBhcHBlbmQuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtXb3JkQXJyYXl9IFRoaXMgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgd29yZEFycmF5MS5jb25jYXQod29yZEFycmF5Mik7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgY29uY2F0OiBmdW5jdGlvbiAod29yZEFycmF5KSB7XG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgICAgICAgICB2YXIgdGhpc1dvcmRzID0gdGhpcy53b3Jkcztcblx0ICAgICAgICAgICAgdmFyIHRoYXRXb3JkcyA9IHdvcmRBcnJheS53b3Jkcztcblx0ICAgICAgICAgICAgdmFyIHRoaXNTaWdCeXRlcyA9IHRoaXMuc2lnQnl0ZXM7XG5cdCAgICAgICAgICAgIHZhciB0aGF0U2lnQnl0ZXMgPSB3b3JkQXJyYXkuc2lnQnl0ZXM7XG5cblx0ICAgICAgICAgICAgLy8gQ2xhbXAgZXhjZXNzIGJpdHNcblx0ICAgICAgICAgICAgdGhpcy5jbGFtcCgpO1xuXG5cdCAgICAgICAgICAgIC8vIENvbmNhdFxuXHQgICAgICAgICAgICBpZiAodGhpc1NpZ0J5dGVzICUgNCkge1xuXHQgICAgICAgICAgICAgICAgLy8gQ29weSBvbmUgYnl0ZSBhdCBhIHRpbWVcblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhhdFNpZ0J5dGVzOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdEJ5dGUgPSAodGhhdFdvcmRzW2kgPj4+IDJdID4+PiAoMjQgLSAoaSAlIDQpICogOCkpICYgMHhmZjtcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzV29yZHNbKHRoaXNTaWdCeXRlcyArIGkpID4+PiAyXSB8PSB0aGF0Qnl0ZSA8PCAoMjQgLSAoKHRoaXNTaWdCeXRlcyArIGkpICUgNCkgKiA4KTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIC8vIENvcHkgb25lIHdvcmQgYXQgYSB0aW1lXG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoYXRTaWdCeXRlczsgaSArPSA0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdGhpc1dvcmRzWyh0aGlzU2lnQnl0ZXMgKyBpKSA+Pj4gMl0gPSB0aGF0V29yZHNbaSA+Pj4gMl07XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdGhpcy5zaWdCeXRlcyArPSB0aGF0U2lnQnl0ZXM7XG5cblx0ICAgICAgICAgICAgLy8gQ2hhaW5hYmxlXG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBSZW1vdmVzIGluc2lnbmlmaWNhbnQgYml0cy5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgd29yZEFycmF5LmNsYW1wKCk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgY2xhbXA6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgLy8gU2hvcnRjdXRzXG5cdCAgICAgICAgICAgIHZhciB3b3JkcyA9IHRoaXMud29yZHM7XG5cdCAgICAgICAgICAgIHZhciBzaWdCeXRlcyA9IHRoaXMuc2lnQnl0ZXM7XG5cblx0ICAgICAgICAgICAgLy8gQ2xhbXBcblx0ICAgICAgICAgICAgd29yZHNbc2lnQnl0ZXMgPj4+IDJdICY9IDB4ZmZmZmZmZmYgPDwgKDMyIC0gKHNpZ0J5dGVzICUgNCkgKiA4KTtcblx0ICAgICAgICAgICAgd29yZHMubGVuZ3RoID0gTWF0aC5jZWlsKHNpZ0J5dGVzIC8gNCk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENyZWF0ZXMgYSBjb3B5IG9mIHRoaXMgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEByZXR1cm4ge1dvcmRBcnJheX0gVGhlIGNsb25lLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgY2xvbmUgPSB3b3JkQXJyYXkuY2xvbmUoKTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICBjbG9uZTogZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICB2YXIgY2xvbmUgPSBCYXNlLmNsb25lLmNhbGwodGhpcyk7XG5cdCAgICAgICAgICAgIGNsb25lLndvcmRzID0gdGhpcy53b3Jkcy5zbGljZSgwKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gY2xvbmU7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENyZWF0ZXMgYSB3b3JkIGFycmF5IGZpbGxlZCB3aXRoIHJhbmRvbSBieXRlcy5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuQnl0ZXMgVGhlIG51bWJlciBvZiByYW5kb20gYnl0ZXMgdG8gZ2VuZXJhdGUuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtXb3JkQXJyYXl9IFRoZSByYW5kb20gd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBzdGF0aWNcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgdmFyIHdvcmRBcnJheSA9IENyeXB0b0pTLmxpYi5Xb3JkQXJyYXkucmFuZG9tKDE2KTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICByYW5kb206IGZ1bmN0aW9uIChuQnl0ZXMpIHtcblx0ICAgICAgICAgICAgdmFyIHdvcmRzID0gW107XG5cblx0ICAgICAgICAgICAgdmFyIHIgPSAoZnVuY3Rpb24gKG1fdykge1xuXHQgICAgICAgICAgICAgICAgdmFyIG1fdyA9IG1fdztcblx0ICAgICAgICAgICAgICAgIHZhciBtX3ogPSAweDNhZGU2OGIxO1xuXHQgICAgICAgICAgICAgICAgdmFyIG1hc2sgPSAweGZmZmZmZmZmO1xuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIG1feiA9ICgweDkwNjkgKiAobV96ICYgMHhGRkZGKSArIChtX3ogPj4gMHgxMCkpICYgbWFzaztcblx0ICAgICAgICAgICAgICAgICAgICBtX3cgPSAoMHg0NjUwICogKG1fdyAmIDB4RkZGRikgKyAobV93ID4+IDB4MTApKSAmIG1hc2s7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICgobV96IDw8IDB4MTApICsgbV93KSAmIG1hc2s7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVzdWx0IC89IDB4MTAwMDAwMDAwO1xuXHQgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAwLjU7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdCAqIChNYXRoLnJhbmRvbSgpID4gLjUgPyAxIDogLTEpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgcmNhY2hlOyBpIDwgbkJ5dGVzOyBpICs9IDQpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBfciA9IHIoKHJjYWNoZSB8fCBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDAwMDAwKTtcblxuXHQgICAgICAgICAgICAgICAgcmNhY2hlID0gX3IoKSAqIDB4M2FkZTY3Yjc7XG5cdCAgICAgICAgICAgICAgICB3b3Jkcy5wdXNoKChfcigpICogMHgxMDAwMDAwMDApIHwgMCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gbmV3IFdvcmRBcnJheS5pbml0KHdvcmRzLCBuQnl0ZXMpO1xuXHQgICAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICAvKipcblx0ICAgICAqIEVuY29kZXIgbmFtZXNwYWNlLlxuXHQgICAgICovXG5cdCAgICB2YXIgQ19lbmMgPSBDLmVuYyA9IHt9O1xuXG5cdCAgICAvKipcblx0ICAgICAqIEhleCBlbmNvZGluZyBzdHJhdGVneS5cblx0ICAgICAqL1xuXHQgICAgdmFyIEhleCA9IENfZW5jLkhleCA9IHtcblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBDb252ZXJ0cyBhIHdvcmQgYXJyYXkgdG8gYSBoZXggc3RyaW5nLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtXb3JkQXJyYXl9IHdvcmRBcnJheSBUaGUgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGhleCBzdHJpbmcuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAc3RhdGljXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogICAgIHZhciBoZXhTdHJpbmcgPSBDcnlwdG9KUy5lbmMuSGV4LnN0cmluZ2lmeSh3b3JkQXJyYXkpO1xuXHQgICAgICAgICAqL1xuXHQgICAgICAgIHN0cmluZ2lmeTogZnVuY3Rpb24gKHdvcmRBcnJheSkge1xuXHQgICAgICAgICAgICAvLyBTaG9ydGN1dHNcblx0ICAgICAgICAgICAgdmFyIHdvcmRzID0gd29yZEFycmF5LndvcmRzO1xuXHQgICAgICAgICAgICB2YXIgc2lnQnl0ZXMgPSB3b3JkQXJyYXkuc2lnQnl0ZXM7XG5cblx0ICAgICAgICAgICAgLy8gQ29udmVydFxuXHQgICAgICAgICAgICB2YXIgaGV4Q2hhcnMgPSBbXTtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWdCeXRlczsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgYml0ZSA9ICh3b3Jkc1tpID4+PiAyXSA+Pj4gKDI0IC0gKGkgJSA0KSAqIDgpKSAmIDB4ZmY7XG5cdCAgICAgICAgICAgICAgICBoZXhDaGFycy5wdXNoKChiaXRlID4+PiA0KS50b1N0cmluZygxNikpO1xuXHQgICAgICAgICAgICAgICAgaGV4Q2hhcnMucHVzaCgoYml0ZSAmIDB4MGYpLnRvU3RyaW5nKDE2KSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gaGV4Q2hhcnMuam9pbignJyk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENvbnZlcnRzIGEgaGV4IHN0cmluZyB0byBhIHdvcmQgYXJyYXkuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gaGV4U3RyIFRoZSBoZXggc3RyaW5nLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHJldHVybiB7V29yZEFycmF5fSBUaGUgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBzdGF0aWNcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgdmFyIHdvcmRBcnJheSA9IENyeXB0b0pTLmVuYy5IZXgucGFyc2UoaGV4U3RyaW5nKTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICBwYXJzZTogZnVuY3Rpb24gKGhleFN0cikge1xuXHQgICAgICAgICAgICAvLyBTaG9ydGN1dFxuXHQgICAgICAgICAgICB2YXIgaGV4U3RyTGVuZ3RoID0gaGV4U3RyLmxlbmd0aDtcblxuXHQgICAgICAgICAgICAvLyBDb252ZXJ0XG5cdCAgICAgICAgICAgIHZhciB3b3JkcyA9IFtdO1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhleFN0ckxlbmd0aDsgaSArPSAyKSB7XG5cdCAgICAgICAgICAgICAgICB3b3Jkc1tpID4+PiAzXSB8PSBwYXJzZUludChoZXhTdHIuc3Vic3RyKGksIDIpLCAxNikgPDwgKDI0IC0gKGkgJSA4KSAqIDQpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIG5ldyBXb3JkQXJyYXkuaW5pdCh3b3JkcywgaGV4U3RyTGVuZ3RoIC8gMik7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBMYXRpbjEgZW5jb2Rpbmcgc3RyYXRlZ3kuXG5cdCAgICAgKi9cblx0ICAgIHZhciBMYXRpbjEgPSBDX2VuYy5MYXRpbjEgPSB7XG5cdCAgICAgICAgLyoqXG5cdCAgICAgICAgICogQ29udmVydHMgYSB3b3JkIGFycmF5IHRvIGEgTGF0aW4xIHN0cmluZy5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBwYXJhbSB7V29yZEFycmF5fSB3b3JkQXJyYXkgVGhlIHdvcmQgYXJyYXkuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBMYXRpbjEgc3RyaW5nLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHN0YXRpY1xuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgbGF0aW4xU3RyaW5nID0gQ3J5cHRvSlMuZW5jLkxhdGluMS5zdHJpbmdpZnkod29yZEFycmF5KTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICBzdHJpbmdpZnk6IGZ1bmN0aW9uICh3b3JkQXJyYXkpIHtcblx0ICAgICAgICAgICAgLy8gU2hvcnRjdXRzXG5cdCAgICAgICAgICAgIHZhciB3b3JkcyA9IHdvcmRBcnJheS53b3Jkcztcblx0ICAgICAgICAgICAgdmFyIHNpZ0J5dGVzID0gd29yZEFycmF5LnNpZ0J5dGVzO1xuXG5cdCAgICAgICAgICAgIC8vIENvbnZlcnRcblx0ICAgICAgICAgICAgdmFyIGxhdGluMUNoYXJzID0gW107XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2lnQnl0ZXM7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGJpdGUgPSAod29yZHNbaSA+Pj4gMl0gPj4+ICgyNCAtIChpICUgNCkgKiA4KSkgJiAweGZmO1xuXHQgICAgICAgICAgICAgICAgbGF0aW4xQ2hhcnMucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlKGJpdGUpKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBsYXRpbjFDaGFycy5qb2luKCcnKTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqXG5cdCAgICAgICAgICogQ29udmVydHMgYSBMYXRpbjEgc3RyaW5nIHRvIGEgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXRpbjFTdHIgVGhlIExhdGluMSBzdHJpbmcuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtXb3JkQXJyYXl9IFRoZSB3b3JkIGFycmF5LlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHN0YXRpY1xuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgd29yZEFycmF5ID0gQ3J5cHRvSlMuZW5jLkxhdGluMS5wYXJzZShsYXRpbjFTdHJpbmcpO1xuXHQgICAgICAgICAqL1xuXHQgICAgICAgIHBhcnNlOiBmdW5jdGlvbiAobGF0aW4xU3RyKSB7XG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0XG5cdCAgICAgICAgICAgIHZhciBsYXRpbjFTdHJMZW5ndGggPSBsYXRpbjFTdHIubGVuZ3RoO1xuXG5cdCAgICAgICAgICAgIC8vIENvbnZlcnRcblx0ICAgICAgICAgICAgdmFyIHdvcmRzID0gW107XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF0aW4xU3RyTGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHdvcmRzW2kgPj4+IDJdIHw9IChsYXRpbjFTdHIuY2hhckNvZGVBdChpKSAmIDB4ZmYpIDw8ICgyNCAtIChpICUgNCkgKiA4KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBuZXcgV29yZEFycmF5LmluaXQod29yZHMsIGxhdGluMVN0ckxlbmd0aCk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBVVEYtOCBlbmNvZGluZyBzdHJhdGVneS5cblx0ICAgICAqL1xuXHQgICAgdmFyIFV0ZjggPSBDX2VuYy5VdGY4ID0ge1xuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENvbnZlcnRzIGEgd29yZCBhcnJheSB0byBhIFVURi04IHN0cmluZy5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBwYXJhbSB7V29yZEFycmF5fSB3b3JkQXJyYXkgVGhlIHdvcmQgYXJyYXkuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBVVEYtOCBzdHJpbmcuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAc3RhdGljXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogICAgIHZhciB1dGY4U3RyaW5nID0gQ3J5cHRvSlMuZW5jLlV0Zjguc3RyaW5naWZ5KHdvcmRBcnJheSk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgc3RyaW5naWZ5OiBmdW5jdGlvbiAod29yZEFycmF5KSB7XG5cdCAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGVzY2FwZShMYXRpbjEuc3RyaW5naWZ5KHdvcmRBcnJheSkpKTtcblx0ICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYWxmb3JtZWQgVVRGLTggZGF0YScpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENvbnZlcnRzIGEgVVRGLTggc3RyaW5nIHRvIGEgd29yZCBhcnJheS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1dGY4U3RyIFRoZSBVVEYtOCBzdHJpbmcuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtXb3JkQXJyYXl9IFRoZSB3b3JkIGFycmF5LlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHN0YXRpY1xuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgd29yZEFycmF5ID0gQ3J5cHRvSlMuZW5jLlV0ZjgucGFyc2UodXRmOFN0cmluZyk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgcGFyc2U6IGZ1bmN0aW9uICh1dGY4U3RyKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBMYXRpbjEucGFyc2UodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHV0ZjhTdHIpKSk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBBYnN0cmFjdCBidWZmZXJlZCBibG9jayBhbGdvcml0aG0gdGVtcGxhdGUuXG5cdCAgICAgKlxuXHQgICAgICogVGhlIHByb3BlcnR5IGJsb2NrU2l6ZSBtdXN0IGJlIGltcGxlbWVudGVkIGluIGEgY29uY3JldGUgc3VidHlwZS5cblx0ICAgICAqXG5cdCAgICAgKiBAcHJvcGVydHkge251bWJlcn0gX21pbkJ1ZmZlclNpemUgVGhlIG51bWJlciBvZiBibG9ja3MgdGhhdCBzaG91bGQgYmUga2VwdCB1bnByb2Nlc3NlZCBpbiB0aGUgYnVmZmVyLiBEZWZhdWx0OiAwXG5cdCAgICAgKi9cblx0ICAgIHZhciBCdWZmZXJlZEJsb2NrQWxnb3JpdGhtID0gQ19saWIuQnVmZmVyZWRCbG9ja0FsZ29yaXRobSA9IEJhc2UuZXh0ZW5kKHtcblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBSZXNldHMgdGhpcyBibG9jayBhbGdvcml0aG0ncyBkYXRhIGJ1ZmZlciB0byBpdHMgaW5pdGlhbCBzdGF0ZS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgYnVmZmVyZWRCbG9ja0FsZ29yaXRobS5yZXNldCgpO1xuXHQgICAgICAgICAqL1xuXHQgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIC8vIEluaXRpYWwgdmFsdWVzXG5cdCAgICAgICAgICAgIHRoaXMuX2RhdGEgPSBuZXcgV29yZEFycmF5LmluaXQoKTtcblx0ICAgICAgICAgICAgdGhpcy5fbkRhdGFCeXRlcyA9IDA7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIEFkZHMgbmV3IGRhdGEgdG8gdGhpcyBibG9jayBhbGdvcml0aG0ncyBidWZmZXIuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcGFyYW0ge1dvcmRBcnJheXxzdHJpbmd9IGRhdGEgVGhlIGRhdGEgdG8gYXBwZW5kLiBTdHJpbmdzIGFyZSBjb252ZXJ0ZWQgdG8gYSBXb3JkQXJyYXkgdXNpbmcgVVRGLTguXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogICAgIGJ1ZmZlcmVkQmxvY2tBbGdvcml0aG0uX2FwcGVuZCgnZGF0YScpO1xuXHQgICAgICAgICAqICAgICBidWZmZXJlZEJsb2NrQWxnb3JpdGhtLl9hcHBlbmQod29yZEFycmF5KTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICBfYXBwZW5kOiBmdW5jdGlvbiAoZGF0YSkge1xuXHQgICAgICAgICAgICAvLyBDb252ZXJ0IHN0cmluZyB0byBXb3JkQXJyYXksIGVsc2UgYXNzdW1lIFdvcmRBcnJheSBhbHJlYWR5XG5cdCAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAgICAgZGF0YSA9IFV0ZjgucGFyc2UoZGF0YSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvLyBBcHBlbmRcblx0ICAgICAgICAgICAgdGhpcy5fZGF0YS5jb25jYXQoZGF0YSk7XG5cdCAgICAgICAgICAgIHRoaXMuX25EYXRhQnl0ZXMgKz0gZGF0YS5zaWdCeXRlcztcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqXG5cdCAgICAgICAgICogUHJvY2Vzc2VzIGF2YWlsYWJsZSBkYXRhIGJsb2Nrcy5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIFRoaXMgbWV0aG9kIGludm9rZXMgX2RvUHJvY2Vzc0Jsb2NrKG9mZnNldCksIHdoaWNoIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgYSBjb25jcmV0ZSBzdWJ0eXBlLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBkb0ZsdXNoIFdoZXRoZXIgYWxsIGJsb2NrcyBhbmQgcGFydGlhbCBibG9ja3Mgc2hvdWxkIGJlIHByb2Nlc3NlZC5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEByZXR1cm4ge1dvcmRBcnJheX0gVGhlIHByb2Nlc3NlZCBkYXRhLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgcHJvY2Vzc2VkRGF0YSA9IGJ1ZmZlcmVkQmxvY2tBbGdvcml0aG0uX3Byb2Nlc3MoKTtcblx0ICAgICAgICAgKiAgICAgdmFyIHByb2Nlc3NlZERhdGEgPSBidWZmZXJlZEJsb2NrQWxnb3JpdGhtLl9wcm9jZXNzKCEhJ2ZsdXNoJyk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgX3Byb2Nlc3M6IGZ1bmN0aW9uIChkb0ZsdXNoKSB7XG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgICAgICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG5cdCAgICAgICAgICAgIHZhciBkYXRhV29yZHMgPSBkYXRhLndvcmRzO1xuXHQgICAgICAgICAgICB2YXIgZGF0YVNpZ0J5dGVzID0gZGF0YS5zaWdCeXRlcztcblx0ICAgICAgICAgICAgdmFyIGJsb2NrU2l6ZSA9IHRoaXMuYmxvY2tTaXplO1xuXHQgICAgICAgICAgICB2YXIgYmxvY2tTaXplQnl0ZXMgPSBibG9ja1NpemUgKiA0O1xuXG5cdCAgICAgICAgICAgIC8vIENvdW50IGJsb2NrcyByZWFkeVxuXHQgICAgICAgICAgICB2YXIgbkJsb2Nrc1JlYWR5ID0gZGF0YVNpZ0J5dGVzIC8gYmxvY2tTaXplQnl0ZXM7XG5cdCAgICAgICAgICAgIGlmIChkb0ZsdXNoKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBSb3VuZCB1cCB0byBpbmNsdWRlIHBhcnRpYWwgYmxvY2tzXG5cdCAgICAgICAgICAgICAgICBuQmxvY2tzUmVhZHkgPSBNYXRoLmNlaWwobkJsb2Nrc1JlYWR5KTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIC8vIFJvdW5kIGRvd24gdG8gaW5jbHVkZSBvbmx5IGZ1bGwgYmxvY2tzLFxuXHQgICAgICAgICAgICAgICAgLy8gbGVzcyB0aGUgbnVtYmVyIG9mIGJsb2NrcyB0aGF0IG11c3QgcmVtYWluIGluIHRoZSBidWZmZXJcblx0ICAgICAgICAgICAgICAgIG5CbG9ja3NSZWFkeSA9IE1hdGgubWF4KChuQmxvY2tzUmVhZHkgfCAwKSAtIHRoaXMuX21pbkJ1ZmZlclNpemUsIDApO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLy8gQ291bnQgd29yZHMgcmVhZHlcblx0ICAgICAgICAgICAgdmFyIG5Xb3Jkc1JlYWR5ID0gbkJsb2Nrc1JlYWR5ICogYmxvY2tTaXplO1xuXG5cdCAgICAgICAgICAgIC8vIENvdW50IGJ5dGVzIHJlYWR5XG5cdCAgICAgICAgICAgIHZhciBuQnl0ZXNSZWFkeSA9IE1hdGgubWluKG5Xb3Jkc1JlYWR5ICogNCwgZGF0YVNpZ0J5dGVzKTtcblxuXHQgICAgICAgICAgICAvLyBQcm9jZXNzIGJsb2Nrc1xuXHQgICAgICAgICAgICBpZiAobldvcmRzUmVhZHkpIHtcblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIG9mZnNldCA9IDA7IG9mZnNldCA8IG5Xb3Jkc1JlYWR5OyBvZmZzZXQgKz0gYmxvY2tTaXplKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gUGVyZm9ybSBjb25jcmV0ZS1hbGdvcml0aG0gbG9naWNcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb1Byb2Nlc3NCbG9jayhkYXRhV29yZHMsIG9mZnNldCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBwcm9jZXNzZWQgd29yZHNcblx0ICAgICAgICAgICAgICAgIHZhciBwcm9jZXNzZWRXb3JkcyA9IGRhdGFXb3Jkcy5zcGxpY2UoMCwgbldvcmRzUmVhZHkpO1xuXHQgICAgICAgICAgICAgICAgZGF0YS5zaWdCeXRlcyAtPSBuQnl0ZXNSZWFkeTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8vIFJldHVybiBwcm9jZXNzZWQgd29yZHNcblx0ICAgICAgICAgICAgcmV0dXJuIG5ldyBXb3JkQXJyYXkuaW5pdChwcm9jZXNzZWRXb3JkcywgbkJ5dGVzUmVhZHkpO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBDcmVhdGVzIGEgY29weSBvZiB0aGlzIG9iamVjdC5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNsb25lLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgY2xvbmUgPSBidWZmZXJlZEJsb2NrQWxnb3JpdGhtLmNsb25lKCk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgY2xvbmU6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdmFyIGNsb25lID0gQmFzZS5jbG9uZS5jYWxsKHRoaXMpO1xuXHQgICAgICAgICAgICBjbG9uZS5fZGF0YSA9IHRoaXMuX2RhdGEuY2xvbmUoKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gY2xvbmU7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIF9taW5CdWZmZXJTaXplOiAwXG5cdCAgICB9KTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBBYnN0cmFjdCBoYXNoZXIgdGVtcGxhdGUuXG5cdCAgICAgKlxuXHQgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGJsb2NrU2l6ZSBUaGUgbnVtYmVyIG9mIDMyLWJpdCB3b3JkcyB0aGlzIGhhc2hlciBvcGVyYXRlcyBvbi4gRGVmYXVsdDogMTYgKDUxMiBiaXRzKVxuXHQgICAgICovXG5cdCAgICB2YXIgSGFzaGVyID0gQ19saWIuSGFzaGVyID0gQnVmZmVyZWRCbG9ja0FsZ29yaXRobS5leHRlbmQoe1xuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucy5cblx0ICAgICAgICAgKi9cblx0ICAgICAgICBjZmc6IEJhc2UuZXh0ZW5kKCksXG5cblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBJbml0aWFsaXplcyBhIG5ld2x5IGNyZWF0ZWQgaGFzaGVyLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGNmZyAoT3B0aW9uYWwpIFRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgdG8gdXNlIGZvciB0aGlzIGhhc2ggY29tcHV0YXRpb24uXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogICAgIHZhciBoYXNoZXIgPSBDcnlwdG9KUy5hbGdvLlNIQTI1Ni5jcmVhdGUoKTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICBpbml0OiBmdW5jdGlvbiAoY2ZnKSB7XG5cdCAgICAgICAgICAgIC8vIEFwcGx5IGNvbmZpZyBkZWZhdWx0c1xuXHQgICAgICAgICAgICB0aGlzLmNmZyA9IHRoaXMuY2ZnLmV4dGVuZChjZmcpO1xuXG5cdCAgICAgICAgICAgIC8vIFNldCBpbml0aWFsIHZhbHVlc1xuXHQgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIFJlc2V0cyB0aGlzIGhhc2hlciB0byBpdHMgaW5pdGlhbCBzdGF0ZS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgaGFzaGVyLnJlc2V0KCk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgLy8gUmVzZXQgZGF0YSBidWZmZXJcblx0ICAgICAgICAgICAgQnVmZmVyZWRCbG9ja0FsZ29yaXRobS5yZXNldC5jYWxsKHRoaXMpO1xuXG5cdCAgICAgICAgICAgIC8vIFBlcmZvcm0gY29uY3JldGUtaGFzaGVyIGxvZ2ljXG5cdCAgICAgICAgICAgIHRoaXMuX2RvUmVzZXQoKTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqXG5cdCAgICAgICAgICogVXBkYXRlcyB0aGlzIGhhc2hlciB3aXRoIGEgbWVzc2FnZS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBwYXJhbSB7V29yZEFycmF5fHN0cmluZ30gbWVzc2FnZVVwZGF0ZSBUaGUgbWVzc2FnZSB0byBhcHBlbmQuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtIYXNoZXJ9IFRoaXMgaGFzaGVyLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICBoYXNoZXIudXBkYXRlKCdtZXNzYWdlJyk7XG5cdCAgICAgICAgICogICAgIGhhc2hlci51cGRhdGUod29yZEFycmF5KTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uIChtZXNzYWdlVXBkYXRlKSB7XG5cdCAgICAgICAgICAgIC8vIEFwcGVuZFxuXHQgICAgICAgICAgICB0aGlzLl9hcHBlbmQobWVzc2FnZVVwZGF0ZSk7XG5cblx0ICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBoYXNoXG5cdCAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3MoKTtcblxuXHQgICAgICAgICAgICAvLyBDaGFpbmFibGVcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIEZpbmFsaXplcyB0aGUgaGFzaCBjb21wdXRhdGlvbi5cblx0ICAgICAgICAgKiBOb3RlIHRoYXQgdGhlIGZpbmFsaXplIG9wZXJhdGlvbiBpcyBlZmZlY3RpdmVseSBhIGRlc3RydWN0aXZlLCByZWFkLW9uY2Ugb3BlcmF0aW9uLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtXb3JkQXJyYXl8c3RyaW5nfSBtZXNzYWdlVXBkYXRlIChPcHRpb25hbCkgQSBmaW5hbCBtZXNzYWdlIHVwZGF0ZS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEByZXR1cm4ge1dvcmRBcnJheX0gVGhlIGhhc2guXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogICAgIHZhciBoYXNoID0gaGFzaGVyLmZpbmFsaXplKCk7XG5cdCAgICAgICAgICogICAgIHZhciBoYXNoID0gaGFzaGVyLmZpbmFsaXplKCdtZXNzYWdlJyk7XG5cdCAgICAgICAgICogICAgIHZhciBoYXNoID0gaGFzaGVyLmZpbmFsaXplKHdvcmRBcnJheSk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgZmluYWxpemU6IGZ1bmN0aW9uIChtZXNzYWdlVXBkYXRlKSB7XG5cdCAgICAgICAgICAgIC8vIEZpbmFsIG1lc3NhZ2UgdXBkYXRlXG5cdCAgICAgICAgICAgIGlmIChtZXNzYWdlVXBkYXRlKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmQobWVzc2FnZVVwZGF0ZSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvLyBQZXJmb3JtIGNvbmNyZXRlLWhhc2hlciBsb2dpY1xuXHQgICAgICAgICAgICB2YXIgaGFzaCA9IHRoaXMuX2RvRmluYWxpemUoKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gaGFzaDtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgYmxvY2tTaXplOiA1MTIvMzIsXG5cblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBDcmVhdGVzIGEgc2hvcnRjdXQgZnVuY3Rpb24gdG8gYSBoYXNoZXIncyBvYmplY3QgaW50ZXJmYWNlLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtIYXNoZXJ9IGhhc2hlciBUaGUgaGFzaGVyIHRvIGNyZWF0ZSBhIGhlbHBlciBmb3IuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHNob3J0Y3V0IGZ1bmN0aW9uLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHN0YXRpY1xuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgU0hBMjU2ID0gQ3J5cHRvSlMubGliLkhhc2hlci5fY3JlYXRlSGVscGVyKENyeXB0b0pTLmFsZ28uU0hBMjU2KTtcblx0ICAgICAgICAgKi9cblx0ICAgICAgICBfY3JlYXRlSGVscGVyOiBmdW5jdGlvbiAoaGFzaGVyKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobWVzc2FnZSwgY2ZnKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGhhc2hlci5pbml0KGNmZykuZmluYWxpemUobWVzc2FnZSk7XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENyZWF0ZXMgYSBzaG9ydGN1dCBmdW5jdGlvbiB0byB0aGUgSE1BQydzIG9iamVjdCBpbnRlcmZhY2UuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcGFyYW0ge0hhc2hlcn0gaGFzaGVyIFRoZSBoYXNoZXIgdG8gdXNlIGluIHRoaXMgSE1BQyBoZWxwZXIuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHNob3J0Y3V0IGZ1bmN0aW9uLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHN0YXRpY1xuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgSG1hY1NIQTI1NiA9IENyeXB0b0pTLmxpYi5IYXNoZXIuX2NyZWF0ZUhtYWNIZWxwZXIoQ3J5cHRvSlMuYWxnby5TSEEyNTYpO1xuXHQgICAgICAgICAqL1xuXHQgICAgICAgIF9jcmVhdGVIbWFjSGVscGVyOiBmdW5jdGlvbiAoaGFzaGVyKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobWVzc2FnZSwga2V5KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENfYWxnby5ITUFDLmluaXQoaGFzaGVyLCBrZXkpLmZpbmFsaXplKG1lc3NhZ2UpO1xuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICAvKipcblx0ICAgICAqIEFsZ29yaXRobSBuYW1lc3BhY2UuXG5cdCAgICAgKi9cblx0ICAgIHZhciBDX2FsZ28gPSBDLmFsZ28gPSB7fTtcblxuXHQgICAgcmV0dXJuIEM7XG5cdH0oTWF0aCkpO1xuXG5cblx0cmV0dXJuIENyeXB0b0pTO1xuXG59KSk7IiwiOyhmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcblx0XHQvLyBDb21tb25KU1xuXHRcdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZShcIi4vY29yZVwiKSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTURcblx0XHRkZWZpbmUoW1wiLi9jb3JlXCJdLCBmYWN0b3J5KTtcblx0fVxuXHRlbHNlIHtcblx0XHQvLyBHbG9iYWwgKGJyb3dzZXIpXG5cdFx0ZmFjdG9yeShyb290LkNyeXB0b0pTKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQ3J5cHRvSlMpIHtcblxuXHQoZnVuY3Rpb24gKCkge1xuXHQgICAgLy8gU2hvcnRjdXRzXG5cdCAgICB2YXIgQyA9IENyeXB0b0pTO1xuXHQgICAgdmFyIENfbGliID0gQy5saWI7XG5cdCAgICB2YXIgV29yZEFycmF5ID0gQ19saWIuV29yZEFycmF5O1xuXHQgICAgdmFyIENfZW5jID0gQy5lbmM7XG5cblx0ICAgIC8qKlxuXHQgICAgICogQmFzZTY0IGVuY29kaW5nIHN0cmF0ZWd5LlxuXHQgICAgICovXG5cdCAgICB2YXIgQmFzZTY0ID0gQ19lbmMuQmFzZTY0ID0ge1xuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIENvbnZlcnRzIGEgd29yZCBhcnJheSB0byBhIEJhc2U2NCBzdHJpbmcuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcGFyYW0ge1dvcmRBcnJheX0gd29yZEFycmF5IFRoZSB3b3JkIGFycmF5LlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgQmFzZTY0IHN0cmluZy5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBzdGF0aWNcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEBleGFtcGxlXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiAgICAgdmFyIGJhc2U2NFN0cmluZyA9IENyeXB0b0pTLmVuYy5CYXNlNjQuc3RyaW5naWZ5KHdvcmRBcnJheSk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgc3RyaW5naWZ5OiBmdW5jdGlvbiAod29yZEFycmF5KSB7XG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgICAgICAgICB2YXIgd29yZHMgPSB3b3JkQXJyYXkud29yZHM7XG5cdCAgICAgICAgICAgIHZhciBzaWdCeXRlcyA9IHdvcmRBcnJheS5zaWdCeXRlcztcblx0ICAgICAgICAgICAgdmFyIG1hcCA9IHRoaXMuX21hcDtcblxuXHQgICAgICAgICAgICAvLyBDbGFtcCBleGNlc3MgYml0c1xuXHQgICAgICAgICAgICB3b3JkQXJyYXkuY2xhbXAoKTtcblxuXHQgICAgICAgICAgICAvLyBDb252ZXJ0XG5cdCAgICAgICAgICAgIHZhciBiYXNlNjRDaGFycyA9IFtdO1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpZ0J5dGVzOyBpICs9IDMpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBieXRlMSA9ICh3b3Jkc1tpID4+PiAyXSAgICAgICA+Pj4gKDI0IC0gKGkgJSA0KSAqIDgpKSAgICAgICAmIDB4ZmY7XG5cdCAgICAgICAgICAgICAgICB2YXIgYnl0ZTIgPSAod29yZHNbKGkgKyAxKSA+Pj4gMl0gPj4+ICgyNCAtICgoaSArIDEpICUgNCkgKiA4KSkgJiAweGZmO1xuXHQgICAgICAgICAgICAgICAgdmFyIGJ5dGUzID0gKHdvcmRzWyhpICsgMikgPj4+IDJdID4+PiAoMjQgLSAoKGkgKyAyKSAlIDQpICogOCkpICYgMHhmZjtcblxuXHQgICAgICAgICAgICAgICAgdmFyIHRyaXBsZXQgPSAoYnl0ZTEgPDwgMTYpIHwgKGJ5dGUyIDw8IDgpIHwgYnl0ZTM7XG5cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyAoaiA8IDQpICYmIChpICsgaiAqIDAuNzUgPCBzaWdCeXRlcyk7IGorKykge1xuXHQgICAgICAgICAgICAgICAgICAgIGJhc2U2NENoYXJzLnB1c2gobWFwLmNoYXJBdCgodHJpcGxldCA+Pj4gKDYgKiAoMyAtIGopKSkgJiAweDNmKSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvLyBBZGQgcGFkZGluZ1xuXHQgICAgICAgICAgICB2YXIgcGFkZGluZ0NoYXIgPSBtYXAuY2hhckF0KDY0KTtcblx0ICAgICAgICAgICAgaWYgKHBhZGRpbmdDaGFyKSB7XG5cdCAgICAgICAgICAgICAgICB3aGlsZSAoYmFzZTY0Q2hhcnMubGVuZ3RoICUgNCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGJhc2U2NENoYXJzLnB1c2gocGFkZGluZ0NoYXIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGJhc2U2NENoYXJzLmpvaW4oJycpO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBDb252ZXJ0cyBhIEJhc2U2NCBzdHJpbmcgdG8gYSB3b3JkIGFycmF5LlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGJhc2U2NFN0ciBUaGUgQmFzZTY0IHN0cmluZy5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEByZXR1cm4ge1dvcmRBcnJheX0gVGhlIHdvcmQgYXJyYXkuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAc3RhdGljXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogICAgIHZhciB3b3JkQXJyYXkgPSBDcnlwdG9KUy5lbmMuQmFzZTY0LnBhcnNlKGJhc2U2NFN0cmluZyk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgcGFyc2U6IGZ1bmN0aW9uIChiYXNlNjRTdHIpIHtcblx0ICAgICAgICAgICAgLy8gU2hvcnRjdXRzXG5cdCAgICAgICAgICAgIHZhciBiYXNlNjRTdHJMZW5ndGggPSBiYXNlNjRTdHIubGVuZ3RoO1xuXHQgICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5fbWFwO1xuXHQgICAgICAgICAgICB2YXIgcmV2ZXJzZU1hcCA9IHRoaXMuX3JldmVyc2VNYXA7XG5cblx0ICAgICAgICAgICAgaWYgKCFyZXZlcnNlTWFwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU1hcCA9IHRoaXMuX3JldmVyc2VNYXAgPSBbXTtcblx0ICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1hcC5sZW5ndGg7IGorKykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnNlTWFwW21hcC5jaGFyQ29kZUF0KGopXSA9IGo7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLy8gSWdub3JlIHBhZGRpbmdcblx0ICAgICAgICAgICAgdmFyIHBhZGRpbmdDaGFyID0gbWFwLmNoYXJBdCg2NCk7XG5cdCAgICAgICAgICAgIGlmIChwYWRkaW5nQ2hhcikge1xuXHQgICAgICAgICAgICAgICAgdmFyIHBhZGRpbmdJbmRleCA9IGJhc2U2NFN0ci5pbmRleE9mKHBhZGRpbmdDaGFyKTtcblx0ICAgICAgICAgICAgICAgIGlmIChwYWRkaW5nSW5kZXggIT09IC0xKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYmFzZTY0U3RyTGVuZ3RoID0gcGFkZGluZ0luZGV4O1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLy8gQ29udmVydFxuXHQgICAgICAgICAgICByZXR1cm4gcGFyc2VMb29wKGJhc2U2NFN0ciwgYmFzZTY0U3RyTGVuZ3RoLCByZXZlcnNlTWFwKTtcblxuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICBfbWFwOiAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nXG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBwYXJzZUxvb3AoYmFzZTY0U3RyLCBiYXNlNjRTdHJMZW5ndGgsIHJldmVyc2VNYXApIHtcblx0ICAgICAgdmFyIHdvcmRzID0gW107XG5cdCAgICAgIHZhciBuQnl0ZXMgPSAwO1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJhc2U2NFN0ckxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICBpZiAoaSAlIDQpIHtcblx0ICAgICAgICAgICAgICB2YXIgYml0czEgPSByZXZlcnNlTWFwW2Jhc2U2NFN0ci5jaGFyQ29kZUF0KGkgLSAxKV0gPDwgKChpICUgNCkgKiAyKTtcblx0ICAgICAgICAgICAgICB2YXIgYml0czIgPSByZXZlcnNlTWFwW2Jhc2U2NFN0ci5jaGFyQ29kZUF0KGkpXSA+Pj4gKDYgLSAoaSAlIDQpICogMik7XG5cdCAgICAgICAgICAgICAgd29yZHNbbkJ5dGVzID4+PiAyXSB8PSAoYml0czEgfCBiaXRzMikgPDwgKDI0IC0gKG5CeXRlcyAlIDQpICogOCk7XG5cdCAgICAgICAgICAgICAgbkJ5dGVzKys7XG5cdCAgICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIFdvcmRBcnJheS5jcmVhdGUod29yZHMsIG5CeXRlcyk7XG5cdCAgICB9XG5cdH0oKSk7XG5cblxuXHRyZXR1cm4gQ3J5cHRvSlMuZW5jLkJhc2U2NDtcblxufSkpOyIsIjsoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnksIHVuZGVmKSB7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuXHRcdC8vIENvbW1vbkpTXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKFwiLi9jb3JlXCIpLCByZXF1aXJlKFwiLi9zaGEyNTZcIiksIHJlcXVpcmUoXCIuL2htYWNcIikpO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EXG5cdFx0ZGVmaW5lKFtcIi4vY29yZVwiLCBcIi4vc2hhMjU2XCIsIFwiLi9obWFjXCJdLCBmYWN0b3J5KTtcblx0fVxuXHRlbHNlIHtcblx0XHQvLyBHbG9iYWwgKGJyb3dzZXIpXG5cdFx0ZmFjdG9yeShyb290LkNyeXB0b0pTKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQ3J5cHRvSlMpIHtcblxuXHRyZXR1cm4gQ3J5cHRvSlMuSG1hY1NIQTI1NjtcblxufSkpOyIsIjsoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG5cdFx0Ly8gQ29tbW9uSlNcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoXCIuL2NvcmVcIikpO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EXG5cdFx0ZGVmaW5lKFtcIi4vY29yZVwiXSwgZmFjdG9yeSk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0Ly8gR2xvYmFsIChicm93c2VyKVxuXHRcdGZhY3Rvcnkocm9vdC5DcnlwdG9KUyk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKENyeXB0b0pTKSB7XG5cblx0KGZ1bmN0aW9uICgpIHtcblx0ICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgdmFyIEMgPSBDcnlwdG9KUztcblx0ICAgIHZhciBDX2xpYiA9IEMubGliO1xuXHQgICAgdmFyIEJhc2UgPSBDX2xpYi5CYXNlO1xuXHQgICAgdmFyIENfZW5jID0gQy5lbmM7XG5cdCAgICB2YXIgVXRmOCA9IENfZW5jLlV0Zjg7XG5cdCAgICB2YXIgQ19hbGdvID0gQy5hbGdvO1xuXG5cdCAgICAvKipcblx0ICAgICAqIEhNQUMgYWxnb3JpdGhtLlxuXHQgICAgICovXG5cdCAgICB2YXIgSE1BQyA9IENfYWxnby5ITUFDID0gQmFzZS5leHRlbmQoe1xuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIEluaXRpYWxpemVzIGEgbmV3bHkgY3JlYXRlZCBITUFDLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtIYXNoZXJ9IGhhc2hlciBUaGUgaGFzaCBhbGdvcml0aG0gdG8gdXNlLlxuXHQgICAgICAgICAqIEBwYXJhbSB7V29yZEFycmF5fHN0cmluZ30ga2V5IFRoZSBzZWNyZXQga2V5LlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICB2YXIgaG1hY0hhc2hlciA9IENyeXB0b0pTLmFsZ28uSE1BQy5jcmVhdGUoQ3J5cHRvSlMuYWxnby5TSEEyNTYsIGtleSk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgaW5pdDogZnVuY3Rpb24gKGhhc2hlciwga2V5KSB7XG5cdCAgICAgICAgICAgIC8vIEluaXQgaGFzaGVyXG5cdCAgICAgICAgICAgIGhhc2hlciA9IHRoaXMuX2hhc2hlciA9IG5ldyBoYXNoZXIuaW5pdCgpO1xuXG5cdCAgICAgICAgICAgIC8vIENvbnZlcnQgc3RyaW5nIHRvIFdvcmRBcnJheSwgZWxzZSBhc3N1bWUgV29yZEFycmF5IGFscmVhZHlcblx0ICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgICAgIGtleSA9IFV0ZjgucGFyc2Uoa2V5KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgICAgICAgICB2YXIgaGFzaGVyQmxvY2tTaXplID0gaGFzaGVyLmJsb2NrU2l6ZTtcblx0ICAgICAgICAgICAgdmFyIGhhc2hlckJsb2NrU2l6ZUJ5dGVzID0gaGFzaGVyQmxvY2tTaXplICogNDtcblxuXHQgICAgICAgICAgICAvLyBBbGxvdyBhcmJpdHJhcnkgbGVuZ3RoIGtleXNcblx0ICAgICAgICAgICAgaWYgKGtleS5zaWdCeXRlcyA+IGhhc2hlckJsb2NrU2l6ZUJ5dGVzKSB7XG5cdCAgICAgICAgICAgICAgICBrZXkgPSBoYXNoZXIuZmluYWxpemUoa2V5KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8vIENsYW1wIGV4Y2VzcyBiaXRzXG5cdCAgICAgICAgICAgIGtleS5jbGFtcCgpO1xuXG5cdCAgICAgICAgICAgIC8vIENsb25lIGtleSBmb3IgaW5uZXIgYW5kIG91dGVyIHBhZHNcblx0ICAgICAgICAgICAgdmFyIG9LZXkgPSB0aGlzLl9vS2V5ID0ga2V5LmNsb25lKCk7XG5cdCAgICAgICAgICAgIHZhciBpS2V5ID0gdGhpcy5faUtleSA9IGtleS5jbG9uZSgpO1xuXG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgICAgICAgICB2YXIgb0tleVdvcmRzID0gb0tleS53b3Jkcztcblx0ICAgICAgICAgICAgdmFyIGlLZXlXb3JkcyA9IGlLZXkud29yZHM7XG5cblx0ICAgICAgICAgICAgLy8gWE9SIGtleXMgd2l0aCBwYWQgY29uc3RhbnRzXG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFzaGVyQmxvY2tTaXplOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIG9LZXlXb3Jkc1tpXSBePSAweDVjNWM1YzVjO1xuXHQgICAgICAgICAgICAgICAgaUtleVdvcmRzW2ldIF49IDB4MzYzNjM2MzY7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgb0tleS5zaWdCeXRlcyA9IGlLZXkuc2lnQnl0ZXMgPSBoYXNoZXJCbG9ja1NpemVCeXRlcztcblxuXHQgICAgICAgICAgICAvLyBTZXQgaW5pdGlhbCB2YWx1ZXNcblx0ICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKipcblx0ICAgICAgICAgKiBSZXNldHMgdGhpcyBITUFDIHRvIGl0cyBpbml0aWFsIHN0YXRlLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICBobWFjSGFzaGVyLnJlc2V0KCk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgLy8gU2hvcnRjdXRcblx0ICAgICAgICAgICAgdmFyIGhhc2hlciA9IHRoaXMuX2hhc2hlcjtcblxuXHQgICAgICAgICAgICAvLyBSZXNldFxuXHQgICAgICAgICAgICBoYXNoZXIucmVzZXQoKTtcblx0ICAgICAgICAgICAgaGFzaGVyLnVwZGF0ZSh0aGlzLl9pS2V5KTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqXG5cdCAgICAgICAgICogVXBkYXRlcyB0aGlzIEhNQUMgd2l0aCBhIG1lc3NhZ2UuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAcGFyYW0ge1dvcmRBcnJheXxzdHJpbmd9IG1lc3NhZ2VVcGRhdGUgVGhlIG1lc3NhZ2UgdG8gYXBwZW5kLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHJldHVybiB7SE1BQ30gVGhpcyBITUFDIGluc3RhbmNlLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQGV4YW1wbGVcblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqICAgICBobWFjSGFzaGVyLnVwZGF0ZSgnbWVzc2FnZScpO1xuXHQgICAgICAgICAqICAgICBobWFjSGFzaGVyLnVwZGF0ZSh3b3JkQXJyYXkpO1xuXHQgICAgICAgICAqL1xuXHQgICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKG1lc3NhZ2VVcGRhdGUpIHtcblx0ICAgICAgICAgICAgdGhpcy5faGFzaGVyLnVwZGF0ZShtZXNzYWdlVXBkYXRlKTtcblxuXHQgICAgICAgICAgICAvLyBDaGFpbmFibGVcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKlxuXHQgICAgICAgICAqIEZpbmFsaXplcyB0aGUgSE1BQyBjb21wdXRhdGlvbi5cblx0ICAgICAgICAgKiBOb3RlIHRoYXQgdGhlIGZpbmFsaXplIG9wZXJhdGlvbiBpcyBlZmZlY3RpdmVseSBhIGRlc3RydWN0aXZlLCByZWFkLW9uY2Ugb3BlcmF0aW9uLlxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogQHBhcmFtIHtXb3JkQXJyYXl8c3RyaW5nfSBtZXNzYWdlVXBkYXRlIChPcHRpb25hbCkgQSBmaW5hbCBtZXNzYWdlIHVwZGF0ZS5cblx0ICAgICAgICAgKlxuXHQgICAgICAgICAqIEByZXR1cm4ge1dvcmRBcnJheX0gVGhlIEhNQUMuXG5cdCAgICAgICAgICpcblx0ICAgICAgICAgKiBAZXhhbXBsZVxuXHQgICAgICAgICAqXG5cdCAgICAgICAgICogICAgIHZhciBobWFjID0gaG1hY0hhc2hlci5maW5hbGl6ZSgpO1xuXHQgICAgICAgICAqICAgICB2YXIgaG1hYyA9IGhtYWNIYXNoZXIuZmluYWxpemUoJ21lc3NhZ2UnKTtcblx0ICAgICAgICAgKiAgICAgdmFyIGhtYWMgPSBobWFjSGFzaGVyLmZpbmFsaXplKHdvcmRBcnJheSk7XG5cdCAgICAgICAgICovXG5cdCAgICAgICAgZmluYWxpemU6IGZ1bmN0aW9uIChtZXNzYWdlVXBkYXRlKSB7XG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0XG5cdCAgICAgICAgICAgIHZhciBoYXNoZXIgPSB0aGlzLl9oYXNoZXI7XG5cblx0ICAgICAgICAgICAgLy8gQ29tcHV0ZSBITUFDXG5cdCAgICAgICAgICAgIHZhciBpbm5lckhhc2ggPSBoYXNoZXIuZmluYWxpemUobWVzc2FnZVVwZGF0ZSk7XG5cdCAgICAgICAgICAgIGhhc2hlci5yZXNldCgpO1xuXHQgICAgICAgICAgICB2YXIgaG1hYyA9IGhhc2hlci5maW5hbGl6ZSh0aGlzLl9vS2V5LmNsb25lKCkuY29uY2F0KGlubmVySGFzaCkpO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBobWFjO1xuXHQgICAgICAgIH1cblx0ICAgIH0pO1xuXHR9KCkpO1xuXG5cbn0pKTsiLCI7KGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuXHRcdC8vIENvbW1vbkpTXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKFwiLi9jb3JlXCIpKTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRFxuXHRcdGRlZmluZShbXCIuL2NvcmVcIl0sIGZhY3RvcnkpO1xuXHR9XG5cdGVsc2Uge1xuXHRcdC8vIEdsb2JhbCAoYnJvd3Nlcilcblx0XHRmYWN0b3J5KHJvb3QuQ3J5cHRvSlMpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChDcnlwdG9KUykge1xuXG5cdChmdW5jdGlvbiAoKSB7XG5cdCAgICAvLyBDaGVjayBpZiB0eXBlZCBhcnJheXMgYXJlIHN1cHBvcnRlZFxuXHQgICAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICAvLyBTaG9ydGN1dHNcblx0ICAgIHZhciBDID0gQ3J5cHRvSlM7XG5cdCAgICB2YXIgQ19saWIgPSBDLmxpYjtcblx0ICAgIHZhciBXb3JkQXJyYXkgPSBDX2xpYi5Xb3JkQXJyYXk7XG5cblx0ICAgIC8vIFJlZmVyZW5jZSBvcmlnaW5hbCBpbml0XG5cdCAgICB2YXIgc3VwZXJJbml0ID0gV29yZEFycmF5LmluaXQ7XG5cblx0ICAgIC8vIEF1Z21lbnQgV29yZEFycmF5LmluaXQgdG8gaGFuZGxlIHR5cGVkIGFycmF5c1xuXHQgICAgdmFyIHN1YkluaXQgPSBXb3JkQXJyYXkuaW5pdCA9IGZ1bmN0aW9uICh0eXBlZEFycmF5KSB7XG5cdCAgICAgICAgLy8gQ29udmVydCBidWZmZXJzIHRvIHVpbnQ4XG5cdCAgICAgICAgaWYgKHR5cGVkQXJyYXkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuXHQgICAgICAgICAgICB0eXBlZEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodHlwZWRBcnJheSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ29udmVydCBvdGhlciBhcnJheSB2aWV3cyB0byB1aW50OFxuXHQgICAgICAgIGlmIChcblx0ICAgICAgICAgICAgdHlwZWRBcnJheSBpbnN0YW5jZW9mIEludDhBcnJheSB8fFxuXHQgICAgICAgICAgICAodHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVkQXJyYXkgaW5zdGFuY2VvZiBVaW50OENsYW1wZWRBcnJheSkgfHxcblx0ICAgICAgICAgICAgdHlwZWRBcnJheSBpbnN0YW5jZW9mIEludDE2QXJyYXkgfHxcblx0ICAgICAgICAgICAgdHlwZWRBcnJheSBpbnN0YW5jZW9mIFVpbnQxNkFycmF5IHx8XG5cdCAgICAgICAgICAgIHR5cGVkQXJyYXkgaW5zdGFuY2VvZiBJbnQzMkFycmF5IHx8XG5cdCAgICAgICAgICAgIHR5cGVkQXJyYXkgaW5zdGFuY2VvZiBVaW50MzJBcnJheSB8fFxuXHQgICAgICAgICAgICB0eXBlZEFycmF5IGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8XG5cdCAgICAgICAgICAgIHR5cGVkQXJyYXkgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXlcblx0ICAgICAgICApIHtcblx0ICAgICAgICAgICAgdHlwZWRBcnJheSA9IG5ldyBVaW50OEFycmF5KHR5cGVkQXJyYXkuYnVmZmVyLCB0eXBlZEFycmF5LmJ5dGVPZmZzZXQsIHR5cGVkQXJyYXkuYnl0ZUxlbmd0aCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSGFuZGxlIFVpbnQ4QXJyYXlcblx0ICAgICAgICBpZiAodHlwZWRBcnJheSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcblx0ICAgICAgICAgICAgLy8gU2hvcnRjdXRcblx0ICAgICAgICAgICAgdmFyIHR5cGVkQXJyYXlCeXRlTGVuZ3RoID0gdHlwZWRBcnJheS5ieXRlTGVuZ3RoO1xuXG5cdCAgICAgICAgICAgIC8vIEV4dHJhY3QgYnl0ZXNcblx0ICAgICAgICAgICAgdmFyIHdvcmRzID0gW107XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZWRBcnJheUJ5dGVMZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgd29yZHNbaSA+Pj4gMl0gfD0gdHlwZWRBcnJheVtpXSA8PCAoMjQgLSAoaSAlIDQpICogOCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoaXMgd29yZCBhcnJheVxuXHQgICAgICAgICAgICBzdXBlckluaXQuY2FsbCh0aGlzLCB3b3JkcywgdHlwZWRBcnJheUJ5dGVMZW5ndGgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIC8vIEVsc2UgY2FsbCBub3JtYWwgaW5pdFxuXHQgICAgICAgICAgICBzdXBlckluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICBzdWJJbml0LnByb3RvdHlwZSA9IFdvcmRBcnJheTtcblx0fSgpKTtcblxuXG5cdHJldHVybiBDcnlwdG9KUy5saWIuV29yZEFycmF5O1xuXG59KSk7IiwiOyhmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcblx0XHQvLyBDb21tb25KU1xuXHRcdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZShcIi4vY29yZVwiKSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTURcblx0XHRkZWZpbmUoW1wiLi9jb3JlXCJdLCBmYWN0b3J5KTtcblx0fVxuXHRlbHNlIHtcblx0XHQvLyBHbG9iYWwgKGJyb3dzZXIpXG5cdFx0ZmFjdG9yeShyb290LkNyeXB0b0pTKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQ3J5cHRvSlMpIHtcblxuXHQoZnVuY3Rpb24gKE1hdGgpIHtcblx0ICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgdmFyIEMgPSBDcnlwdG9KUztcblx0ICAgIHZhciBDX2xpYiA9IEMubGliO1xuXHQgICAgdmFyIFdvcmRBcnJheSA9IENfbGliLldvcmRBcnJheTtcblx0ICAgIHZhciBIYXNoZXIgPSBDX2xpYi5IYXNoZXI7XG5cdCAgICB2YXIgQ19hbGdvID0gQy5hbGdvO1xuXG5cdCAgICAvLyBJbml0aWFsaXphdGlvbiBhbmQgcm91bmQgY29uc3RhbnRzIHRhYmxlc1xuXHQgICAgdmFyIEggPSBbXTtcblx0ICAgIHZhciBLID0gW107XG5cblx0ICAgIC8vIENvbXB1dGUgY29uc3RhbnRzXG5cdCAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGZ1bmN0aW9uIGlzUHJpbWUobikge1xuXHQgICAgICAgICAgICB2YXIgc3FydE4gPSBNYXRoLnNxcnQobik7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGZhY3RvciA9IDI7IGZhY3RvciA8PSBzcXJ0TjsgZmFjdG9yKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmICghKG4gJSBmYWN0b3IpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gZ2V0RnJhY3Rpb25hbEJpdHMobikge1xuXHQgICAgICAgICAgICByZXR1cm4gKChuIC0gKG4gfCAwKSkgKiAweDEwMDAwMDAwMCkgfCAwO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBuID0gMjtcblx0ICAgICAgICB2YXIgblByaW1lID0gMDtcblx0ICAgICAgICB3aGlsZSAoblByaW1lIDwgNjQpIHtcblx0ICAgICAgICAgICAgaWYgKGlzUHJpbWUobikpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChuUHJpbWUgPCA4KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgSFtuUHJpbWVdID0gZ2V0RnJhY3Rpb25hbEJpdHMoTWF0aC5wb3cobiwgMSAvIDIpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIEtbblByaW1lXSA9IGdldEZyYWN0aW9uYWxCaXRzKE1hdGgucG93KG4sIDEgLyAzKSk7XG5cblx0ICAgICAgICAgICAgICAgIG5QcmltZSsrO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgbisrO1xuXHQgICAgICAgIH1cblx0ICAgIH0oKSk7XG5cblx0ICAgIC8vIFJldXNhYmxlIG9iamVjdFxuXHQgICAgdmFyIFcgPSBbXTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBTSEEtMjU2IGhhc2ggYWxnb3JpdGhtLlxuXHQgICAgICovXG5cdCAgICB2YXIgU0hBMjU2ID0gQ19hbGdvLlNIQTI1NiA9IEhhc2hlci5leHRlbmQoe1xuXHQgICAgICAgIF9kb1Jlc2V0OiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHRoaXMuX2hhc2ggPSBuZXcgV29yZEFycmF5LmluaXQoSC5zbGljZSgwKSk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIF9kb1Byb2Nlc3NCbG9jazogZnVuY3Rpb24gKE0sIG9mZnNldCkge1xuXHQgICAgICAgICAgICAvLyBTaG9ydGN1dFxuXHQgICAgICAgICAgICB2YXIgSCA9IHRoaXMuX2hhc2gud29yZHM7XG5cblx0ICAgICAgICAgICAgLy8gV29ya2luZyB2YXJpYWJsZXNcblx0ICAgICAgICAgICAgdmFyIGEgPSBIWzBdO1xuXHQgICAgICAgICAgICB2YXIgYiA9IEhbMV07XG5cdCAgICAgICAgICAgIHZhciBjID0gSFsyXTtcblx0ICAgICAgICAgICAgdmFyIGQgPSBIWzNdO1xuXHQgICAgICAgICAgICB2YXIgZSA9IEhbNF07XG5cdCAgICAgICAgICAgIHZhciBmID0gSFs1XTtcblx0ICAgICAgICAgICAgdmFyIGcgPSBIWzZdO1xuXHQgICAgICAgICAgICB2YXIgaCA9IEhbN107XG5cblx0ICAgICAgICAgICAgLy8gQ29tcHV0YXRpb25cblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA2NDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoaSA8IDE2KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgV1tpXSA9IE1bb2Zmc2V0ICsgaV0gfCAwO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgZ2FtbWEweCA9IFdbaSAtIDE1XTtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgZ2FtbWEwICA9ICgoZ2FtbWEweCA8PCAyNSkgfCAoZ2FtbWEweCA+Pj4gNykpICBeXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKGdhbW1hMHggPDwgMTQpIHwgKGdhbW1hMHggPj4+IDE4KSkgXlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChnYW1tYTB4ID4+PiAzKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIHZhciBnYW1tYTF4ID0gV1tpIC0gMl07XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGdhbW1hMSAgPSAoKGdhbW1hMXggPDwgMTUpIHwgKGdhbW1hMXggPj4+IDE3KSkgXlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChnYW1tYTF4IDw8IDEzKSB8IChnYW1tYTF4ID4+PiAxOSkpIF5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZ2FtbWExeCA+Pj4gMTApO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgV1tpXSA9IGdhbW1hMCArIFdbaSAtIDddICsgZ2FtbWExICsgV1tpIC0gMTZdO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICB2YXIgY2ggID0gKGUgJiBmKSBeICh+ZSAmIGcpO1xuXHQgICAgICAgICAgICAgICAgdmFyIG1haiA9IChhICYgYikgXiAoYSAmIGMpIF4gKGIgJiBjKTtcblxuXHQgICAgICAgICAgICAgICAgdmFyIHNpZ21hMCA9ICgoYSA8PCAzMCkgfCAoYSA+Pj4gMikpIF4gKChhIDw8IDE5KSB8IChhID4+PiAxMykpIF4gKChhIDw8IDEwKSB8IChhID4+PiAyMikpO1xuXHQgICAgICAgICAgICAgICAgdmFyIHNpZ21hMSA9ICgoZSA8PCAyNikgfCAoZSA+Pj4gNikpIF4gKChlIDw8IDIxKSB8IChlID4+PiAxMSkpIF4gKChlIDw8IDcpICB8IChlID4+PiAyNSkpO1xuXG5cdCAgICAgICAgICAgICAgICB2YXIgdDEgPSBoICsgc2lnbWExICsgY2ggKyBLW2ldICsgV1tpXTtcblx0ICAgICAgICAgICAgICAgIHZhciB0MiA9IHNpZ21hMCArIG1hajtcblxuXHQgICAgICAgICAgICAgICAgaCA9IGc7XG5cdCAgICAgICAgICAgICAgICBnID0gZjtcblx0ICAgICAgICAgICAgICAgIGYgPSBlO1xuXHQgICAgICAgICAgICAgICAgZSA9IChkICsgdDEpIHwgMDtcblx0ICAgICAgICAgICAgICAgIGQgPSBjO1xuXHQgICAgICAgICAgICAgICAgYyA9IGI7XG5cdCAgICAgICAgICAgICAgICBiID0gYTtcblx0ICAgICAgICAgICAgICAgIGEgPSAodDEgKyB0MikgfCAwO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLy8gSW50ZXJtZWRpYXRlIGhhc2ggdmFsdWVcblx0ICAgICAgICAgICAgSFswXSA9IChIWzBdICsgYSkgfCAwO1xuXHQgICAgICAgICAgICBIWzFdID0gKEhbMV0gKyBiKSB8IDA7XG5cdCAgICAgICAgICAgIEhbMl0gPSAoSFsyXSArIGMpIHwgMDtcblx0ICAgICAgICAgICAgSFszXSA9IChIWzNdICsgZCkgfCAwO1xuXHQgICAgICAgICAgICBIWzRdID0gKEhbNF0gKyBlKSB8IDA7XG5cdCAgICAgICAgICAgIEhbNV0gPSAoSFs1XSArIGYpIHwgMDtcblx0ICAgICAgICAgICAgSFs2XSA9IChIWzZdICsgZykgfCAwO1xuXHQgICAgICAgICAgICBIWzddID0gKEhbN10gKyBoKSB8IDA7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIF9kb0ZpbmFsaXplOiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIC8vIFNob3J0Y3V0c1xuXHQgICAgICAgICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG5cdCAgICAgICAgICAgIHZhciBkYXRhV29yZHMgPSBkYXRhLndvcmRzO1xuXG5cdCAgICAgICAgICAgIHZhciBuQml0c1RvdGFsID0gdGhpcy5fbkRhdGFCeXRlcyAqIDg7XG5cdCAgICAgICAgICAgIHZhciBuQml0c0xlZnQgPSBkYXRhLnNpZ0J5dGVzICogODtcblxuXHQgICAgICAgICAgICAvLyBBZGQgcGFkZGluZ1xuXHQgICAgICAgICAgICBkYXRhV29yZHNbbkJpdHNMZWZ0ID4+PiA1XSB8PSAweDgwIDw8ICgyNCAtIG5CaXRzTGVmdCAlIDMyKTtcblx0ICAgICAgICAgICAgZGF0YVdvcmRzWygoKG5CaXRzTGVmdCArIDY0KSA+Pj4gOSkgPDwgNCkgKyAxNF0gPSBNYXRoLmZsb29yKG5CaXRzVG90YWwgLyAweDEwMDAwMDAwMCk7XG5cdCAgICAgICAgICAgIGRhdGFXb3Jkc1soKChuQml0c0xlZnQgKyA2NCkgPj4+IDkpIDw8IDQpICsgMTVdID0gbkJpdHNUb3RhbDtcblx0ICAgICAgICAgICAgZGF0YS5zaWdCeXRlcyA9IGRhdGFXb3Jkcy5sZW5ndGggKiA0O1xuXG5cdCAgICAgICAgICAgIC8vIEhhc2ggZmluYWwgYmxvY2tzXG5cdCAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3MoKTtcblxuXHQgICAgICAgICAgICAvLyBSZXR1cm4gZmluYWwgY29tcHV0ZWQgaGFzaFxuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5faGFzaDtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgY2xvbmU6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdmFyIGNsb25lID0gSGFzaGVyLmNsb25lLmNhbGwodGhpcyk7XG5cdCAgICAgICAgICAgIGNsb25lLl9oYXNoID0gdGhpcy5faGFzaC5jbG9uZSgpO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBjbG9uZTtcblx0ICAgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBTaG9ydGN1dCBmdW5jdGlvbiB0byB0aGUgaGFzaGVyJ3Mgb2JqZWN0IGludGVyZmFjZS5cblx0ICAgICAqXG5cdCAgICAgKiBAcGFyYW0ge1dvcmRBcnJheXxzdHJpbmd9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gaGFzaC5cblx0ICAgICAqXG5cdCAgICAgKiBAcmV0dXJuIHtXb3JkQXJyYXl9IFRoZSBoYXNoLlxuXHQgICAgICpcblx0ICAgICAqIEBzdGF0aWNcblx0ICAgICAqXG5cdCAgICAgKiBAZXhhbXBsZVxuXHQgICAgICpcblx0ICAgICAqICAgICB2YXIgaGFzaCA9IENyeXB0b0pTLlNIQTI1NignbWVzc2FnZScpO1xuXHQgICAgICogICAgIHZhciBoYXNoID0gQ3J5cHRvSlMuU0hBMjU2KHdvcmRBcnJheSk7XG5cdCAgICAgKi9cblx0ICAgIEMuU0hBMjU2ID0gSGFzaGVyLl9jcmVhdGVIZWxwZXIoU0hBMjU2KTtcblxuXHQgICAgLyoqXG5cdCAgICAgKiBTaG9ydGN1dCBmdW5jdGlvbiB0byB0aGUgSE1BQydzIG9iamVjdCBpbnRlcmZhY2UuXG5cdCAgICAgKlxuXHQgICAgICogQHBhcmFtIHtXb3JkQXJyYXl8c3RyaW5nfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGhhc2guXG5cdCAgICAgKiBAcGFyYW0ge1dvcmRBcnJheXxzdHJpbmd9IGtleSBUaGUgc2VjcmV0IGtleS5cblx0ICAgICAqXG5cdCAgICAgKiBAcmV0dXJuIHtXb3JkQXJyYXl9IFRoZSBITUFDLlxuXHQgICAgICpcblx0ICAgICAqIEBzdGF0aWNcblx0ICAgICAqXG5cdCAgICAgKiBAZXhhbXBsZVxuXHQgICAgICpcblx0ICAgICAqICAgICB2YXIgaG1hYyA9IENyeXB0b0pTLkhtYWNTSEEyNTYobWVzc2FnZSwga2V5KTtcblx0ICAgICAqL1xuXHQgICAgQy5IbWFjU0hBMjU2ID0gSGFzaGVyLl9jcmVhdGVIbWFjSGVscGVyKFNIQTI1Nik7XG5cdH0oTWF0aCkpO1xuXG5cblx0cmV0dXJuIENyeXB0b0pTLlNIQTI1NjtcblxufSkpOyIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLyohXG4gKiBKYXZhU2NyaXB0IENvb2tpZSB2Mi4yLjFcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qcy1jb29raWUvanMtY29va2llXG4gKlxuICogQ29weXJpZ2h0IDIwMDYsIDIwMTUgS2xhdXMgSGFydGwgJiBGYWduZXIgQnJhY2tcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG47KGZ1bmN0aW9uIChmYWN0b3J5KSB7XG5cdHZhciByZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXI7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZmFjdG9yeSk7XG5cdFx0cmVnaXN0ZXJlZEluTW9kdWxlTG9hZGVyID0gdHJ1ZTtcblx0fVxuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdFx0cmVnaXN0ZXJlZEluTW9kdWxlTG9hZGVyID0gdHJ1ZTtcblx0fVxuXHRpZiAoIXJlZ2lzdGVyZWRJbk1vZHVsZUxvYWRlcikge1xuXHRcdHZhciBPbGRDb29raWVzID0gd2luZG93LkNvb2tpZXM7XG5cdFx0dmFyIGFwaSA9IHdpbmRvdy5Db29raWVzID0gZmFjdG9yeSgpO1xuXHRcdGFwaS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0d2luZG93LkNvb2tpZXMgPSBPbGRDb29raWVzO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9O1xuXHR9XG59KGZ1bmN0aW9uICgpIHtcblx0ZnVuY3Rpb24gZXh0ZW5kICgpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0dmFyIHJlc3VsdCA9IHt9O1xuXHRcdGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgYXR0cmlidXRlcyA9IGFyZ3VtZW50c1sgaSBdO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcblx0XHRcdFx0cmVzdWx0W2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWNvZGUgKHMpIHtcblx0XHRyZXR1cm4gcy5yZXBsYWNlKC8oJVswLTlBLVpdezJ9KSsvZywgZGVjb2RlVVJJQ29tcG9uZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluaXQgKGNvbnZlcnRlcikge1xuXHRcdGZ1bmN0aW9uIGFwaSgpIHt9XG5cblx0XHRmdW5jdGlvbiBzZXQgKGtleSwgdmFsdWUsIGF0dHJpYnV0ZXMpIHtcblx0XHRcdGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0YXR0cmlidXRlcyA9IGV4dGVuZCh7XG5cdFx0XHRcdHBhdGg6ICcvJ1xuXHRcdFx0fSwgYXBpLmRlZmF1bHRzLCBhdHRyaWJ1dGVzKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBhdHRyaWJ1dGVzLmV4cGlyZXMgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGF0dHJpYnV0ZXMuZXhwaXJlcyA9IG5ldyBEYXRlKG5ldyBEYXRlKCkgKiAxICsgYXR0cmlidXRlcy5leHBpcmVzICogODY0ZSs1KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gV2UncmUgdXNpbmcgXCJleHBpcmVzXCIgYmVjYXVzZSBcIm1heC1hZ2VcIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IElFXG5cdFx0XHRhdHRyaWJ1dGVzLmV4cGlyZXMgPSBhdHRyaWJ1dGVzLmV4cGlyZXMgPyBhdHRyaWJ1dGVzLmV4cGlyZXMudG9VVENTdHJpbmcoKSA6ICcnO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHR2YXIgcmVzdWx0ID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuXHRcdFx0XHRpZiAoL15bXFx7XFxbXS8udGVzdChyZXN1bHQpKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSByZXN1bHQ7XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGUpIHt9XG5cblx0XHRcdHZhbHVlID0gY29udmVydGVyLndyaXRlID9cblx0XHRcdFx0Y29udmVydGVyLndyaXRlKHZhbHVlLCBrZXkpIDpcblx0XHRcdFx0ZW5jb2RlVVJJQ29tcG9uZW50KFN0cmluZyh2YWx1ZSkpXG5cdFx0XHRcdFx0LnJlcGxhY2UoLyUoMjN8MjR8MjZ8MkJ8M0F8M0N8M0V8M0R8MkZ8M0Z8NDB8NUJ8NUR8NUV8NjB8N0J8N0R8N0MpL2csIGRlY29kZVVSSUNvbXBvbmVudCk7XG5cblx0XHRcdGtleSA9IGVuY29kZVVSSUNvbXBvbmVudChTdHJpbmcoa2V5KSlcblx0XHRcdFx0LnJlcGxhY2UoLyUoMjN8MjR8MjZ8MkJ8NUV8NjB8N0MpL2csIGRlY29kZVVSSUNvbXBvbmVudClcblx0XHRcdFx0LnJlcGxhY2UoL1tcXChcXCldL2csIGVzY2FwZSk7XG5cblx0XHRcdHZhciBzdHJpbmdpZmllZEF0dHJpYnV0ZXMgPSAnJztcblx0XHRcdGZvciAodmFyIGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuXHRcdFx0XHRpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0pIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzdHJpbmdpZmllZEF0dHJpYnV0ZXMgKz0gJzsgJyArIGF0dHJpYnV0ZU5hbWU7XG5cdFx0XHRcdGlmIChhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBDb25zaWRlcnMgUkZDIDYyNjUgc2VjdGlvbiA1LjI6XG5cdFx0XHRcdC8vIC4uLlxuXHRcdFx0XHQvLyAzLiAgSWYgdGhlIHJlbWFpbmluZyB1bnBhcnNlZC1hdHRyaWJ1dGVzIGNvbnRhaW5zIGEgJXgzQiAoXCI7XCIpXG5cdFx0XHRcdC8vICAgICBjaGFyYWN0ZXI6XG5cdFx0XHRcdC8vIENvbnN1bWUgdGhlIGNoYXJhY3RlcnMgb2YgdGhlIHVucGFyc2VkLWF0dHJpYnV0ZXMgdXAgdG8sXG5cdFx0XHRcdC8vIG5vdCBpbmNsdWRpbmcsIHRoZSBmaXJzdCAleDNCIChcIjtcIikgY2hhcmFjdGVyLlxuXHRcdFx0XHQvLyAuLi5cblx0XHRcdFx0c3RyaW5naWZpZWRBdHRyaWJ1dGVzICs9ICc9JyArIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0uc3BsaXQoJzsnKVswXTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIChkb2N1bWVudC5jb29raWUgPSBrZXkgKyAnPScgKyB2YWx1ZSArIHN0cmluZ2lmaWVkQXR0cmlidXRlcyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0IChrZXksIGpzb24pIHtcblx0XHRcdGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGphciA9IHt9O1xuXHRcdFx0Ly8gVG8gcHJldmVudCB0aGUgZm9yIGxvb3AgaW4gdGhlIGZpcnN0IHBsYWNlIGFzc2lnbiBhbiBlbXB0eSBhcnJheVxuXHRcdFx0Ly8gaW4gY2FzZSB0aGVyZSBhcmUgbm8gY29va2llcyBhdCBhbGwuXG5cdFx0XHR2YXIgY29va2llcyA9IGRvY3VtZW50LmNvb2tpZSA/IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOyAnKSA6IFtdO1xuXHRcdFx0dmFyIGkgPSAwO1xuXG5cdFx0XHRmb3IgKDsgaSA8IGNvb2tpZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIHBhcnRzID0gY29va2llc1tpXS5zcGxpdCgnPScpO1xuXHRcdFx0XHR2YXIgY29va2llID0gcGFydHMuc2xpY2UoMSkuam9pbignPScpO1xuXG5cdFx0XHRcdGlmICghanNvbiAmJiBjb29raWUuY2hhckF0KDApID09PSAnXCInKSB7XG5cdFx0XHRcdFx0Y29va2llID0gY29va2llLnNsaWNlKDEsIC0xKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dmFyIG5hbWUgPSBkZWNvZGUocGFydHNbMF0pO1xuXHRcdFx0XHRcdGNvb2tpZSA9IChjb252ZXJ0ZXIucmVhZCB8fCBjb252ZXJ0ZXIpKGNvb2tpZSwgbmFtZSkgfHxcblx0XHRcdFx0XHRcdGRlY29kZShjb29raWUpO1xuXG5cdFx0XHRcdFx0aWYgKGpzb24pIHtcblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdGNvb2tpZSA9IEpTT04ucGFyc2UoY29va2llKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHt9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0amFyW25hbWVdID0gY29va2llO1xuXG5cdFx0XHRcdFx0aWYgKGtleSA9PT0gbmFtZSkge1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ga2V5ID8gamFyW2tleV0gOiBqYXI7XG5cdFx0fVxuXG5cdFx0YXBpLnNldCA9IHNldDtcblx0XHRhcGkuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0cmV0dXJuIGdldChrZXksIGZhbHNlIC8qIHJlYWQgYXMgcmF3ICovKTtcblx0XHR9O1xuXHRcdGFwaS5nZXRKU09OID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0cmV0dXJuIGdldChrZXksIHRydWUgLyogcmVhZCBhcyBqc29uICovKTtcblx0XHR9O1xuXHRcdGFwaS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5LCBhdHRyaWJ1dGVzKSB7XG5cdFx0XHRzZXQoa2V5LCAnJywgZXh0ZW5kKGF0dHJpYnV0ZXMsIHtcblx0XHRcdFx0ZXhwaXJlczogLTFcblx0XHRcdH0pKTtcblx0XHR9O1xuXG5cdFx0YXBpLmRlZmF1bHRzID0ge307XG5cblx0XHRhcGkud2l0aENvbnZlcnRlciA9IGluaXQ7XG5cblx0XHRyZXR1cm4gYXBpO1xuXHR9XG5cblx0cmV0dXJuIGluaXQoZnVuY3Rpb24gKCkge30pO1xufSkpO1xuIl19
