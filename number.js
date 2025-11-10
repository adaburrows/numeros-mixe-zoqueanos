const BASE64_ELEMENTS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9','+','/']
const BASE64_PADDING = '='
const BASE16_ELEMENTS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']

const gt = (a,b) => a > b
const lt = (a,b) => a < b
const asc = Object.freeze([lt, gt])
const dsc = Object.freeze([gt, lt])
const sort_fn = (rel1, rel2, a, b) => rel1(a, b) ? -1 : rel2(a, b) ? 1 : 0 // assumes Trichotomy Law
const ascending = sort_fn.bind(null, asc[0], asc[1])
const descending = sort_fn.bind(null, dsc[0], dsc[1])

const term = (value, base, exp) => `${value}*${base}^${exp}`

// XXX: We should find a way of dealing with object lookup that doesn't require conversion to strings

/*

New idea with ArrayBuffer and DataView to encode numbers: Expand-N-ary

- toset of exponents
- map from exponent to coefficient
- set of coefficients

*/

/**
 * This is a totally ordered set (toset), it does not allow duplicates
 */
class Toset {

  /**
   * {Array<number>}
   */
  elements

  /**
   * {(a,b) => 1 | 0 | -1}
   */
  order_rels

  /**
   * Constructs a toset
   * @param {Array<number>} initial_elements
   * @param {[lt, gt]} order_rels
   */
  constructor(initial_elements = [], order_rels = asc) {
    const sort = sort_fn.bind(null, order_rels[0], order_rels[1])
    this.elements = initial_elements.sort(sort) // We can't use this for a poset
    this.order_rels = order_rels
    const bound_func = (rel, element, value) => rel(value, element)
    this.lower_bound_fn = bound_func.bind(null, order_rels[0])
    this.upper_bound_fn = bound_func.bind(null, order_rels[1])
  }

  /**
   * Inserts a number in the toset
   * @param {number} element a numeric value
   * @returns void
   */
  insert(element) {
    const lb_func = this.lower_bound_fn.bind(null, element)
    const ub_func = this.upper_bound_fn.bind(null, element)
    let lb = this.elements.findIndex(lb_func)
    let ub = this.elements.findIndex(ub_func)

    // Don't add if the element is present
    if (Math.abs(lb - ub) > 1) { return }

    // no lower bound, no upper bound => nothing in set
    if (lb == ub == -1) {
      this.elements.push(element)
    // no lower bound + upper bound => splice in at upper bound
    // lower bound + upper bound => splice in upper at bound
    } if ((lb == -1 && ub > -1) || (lb > -1 && ub > -1)) {
      this.elements.splice(ub, 0, element)
    // lower bound + no upper band => splice in at lower bound ++
    } else if (lb > -1 && ub == -1) {
      this.elements.splice(lb + 1, 0, element)
    }
  }

  /**
   * Check if a number is a part of the toset
   * @param {number} element 
   * @returns {boolean}
   */
  has(element) {
    return (this.elements.findIndex(value => value == element) > -1)
  }

  /**
   * Removes the next number in the toset
   * @returns {number}
   */
  take() {
    return this.elements.shift()
  }

  /**
   * Converts the toset into another toset with the reverse ordering
   * @returns {Toset}
   */
  reverse() {
    const order = this.order_rels === asc ? dsc : asc
    const Reverse = new Toset([], order)
    Reverse.elements = this.elements.reverse()
    return Reverse
  }

  /**
   * Returns the minimum number using the total ordering
   * @returns {number}
   */
  min() {
    let min = undefined
    if (this.order_rels === asc) {
      min = this.elements[0]
    } else {
      min = this.elements.slice(-1).pop()
    }
    return min
  }

  /**
   * Returns the maximum number using the total ordering
   * @returns {number}
   */
  max() {
    let max = undefined
    if (this.order_rels === asc) {
      max = this.elements.slice(-1).pop()
    } else {
      max = this.elements[0]
    }
    return max
  }

}

/**
 * This is the add and carry algorithm
 * @returns {Map<string, bigint>}
 */
function add_significant_digits(a, b, base) {
  const c = new Map(a)
  const carried_values = new Map()
  const b_exponents = Array.from(b.keys()).map(BigInt)
  const exponent_set = new Toset(b_exponents)

  // Take the first exponent off the toset
  let curr_exp = exponent_set.take()
  do {
    const expString = curr_exp.toString()

    // Get the carried value
    const carried_value = carried_values.has(expString) ? carried_values.get(expString) : 0n
    let sum = carried_value

    // Compute the sum with value from b
    const b_value = b.get(expString)
    if(b_value) {
      sum += b_value
    }

    // Compute the sum with the value from c (copied from a)
    let c_value = c.get(expString)
    if (c_value) {
      sum += c_value
    }

    // Adjust the sum if it exceeds the base and set next carried value
    if (sum > (base - 1n)) {
      sum = sum - base
      next_exp = curr_exp + 1n
      carried_values.set(next_exp.toString(), 1n)
      exponent_set.insert(next_exp)
    }

    // If it's zero, remove the value and exponent
    if (sum == 0) {
      c.delete(expString)
    // If it's a value, set it
    } else {
      c.set(expString, sum)
    }

    // Take the next exponent from the toset
    curr_exp = exponent_set.take()
  } while (curr_exp !== undefined)

  return c
}

/**
 * Computes the significand and exponent for the current term place of the number.
 *
 * This loses the speed edge it had with floating-point when switching to bigint,
 * but it is more numerically stable than the other mechanisms.
 *
 * Even with floats, this was more numerically stable, but it still had a few issues.
 *
 * @param {bigint} value 
 * @param {bigint} base 
 * @returns {[bigint, bigint]}
 */
function exponent_significand_pow(value, base) {
  // intialize significand to the provided value
  let significand = value

  // since we always increase, we start at one less than is expected
  // literally only so that we only have to write the first line of the loop once
  let exponent = -1n

  // base ** 0
  let position_value = 1n

  // Iteratively compute the correct significand and exponent
  do {
    // compute the current estimated significand assuming the current position's value
    significand = value / position_value;

    // increase exponent
    exponent++

    // raise position value through repeated multiplication
    position_value *= base;

    // when the significand is less than the base value, terminate loop
  } while (significand > base - 1n)

  return [significand, exponent];
}

/**
 * 
 * @param {bigint} base 
 * @param {bigint} significand 
 * @param {bigint} exponent 
 * @returns 
 */
function significant_value_for_base(base, significand, exponent) {
  return significand * (base ** exponent)
}

/**
 * Make sure exponents are ordered
 * @param {Map<string, bigint>} significant_digits 
 */
function order_by_exponents(significant_digits, order_rels = asc) {
  const new_significant_digits = new Map()

  const exponents = Array.from(significant_digits.keys()).map(BigInt)
  const exponent_toset = new Toset(exponents, order_rels)

  let curr_exp = exponent_toset.take()
  while (curr_exp !== undefined) {
    const string_exp = curr_exp.toString()
    new_significant_digits.set(string_exp, significant_digits.get(string_exp))
    curr_exp = exponent_toset.take()
  }

  return new_significant_digits
}

/**
 * Computes the significant digits of a number. Leaves out the zeros.
 * @param {bigint} value the value to be converted into digits of a certain base
 * @param {bigint} base the base
 * @param {(bigint, bigint) => [bigint, bigint]} exponent_significand 
 * @returns {Map<string, bigint>}
 */
function generate_significant_digits(value, base, exponent_significand = exponent_significand_pow) {
  const significant_value = significant_value_for_base.bind(null, base)
  const significant_digits = new Map()
  let remainder = value
  let accumulator = 0n

  do {
    // compute current exponent and significand
    let [significand, exponent] = exponent_significand(remainder, base)

    // the floor of the significand is the current digit value for the given exponent
    let current_digit = significand

    // add the digit and exponent as an array
    significant_digits.set(exponent.toString(), current_digit)

    // compute the value of the current significant digit
    let current_value = significant_value(current_digit, exponent);

    // compute the sum in a temporary variable
    accumulator = accumulator + current_value

    // compute the remainder
    remainder = value - accumulator;

    //console.log(significand, exponent, current_digit, current_value, accumulator, remainder)
  } while (remainder > 0 )
  return order_by_exponents(significant_digits)
}

/**
 * Insert insignificant zeros for display
 * @param {Map<string, bigint>} significant_digits 
 * @returns {Map<string, bigint>} map in dsc order
 */
function insert_zeros(significant_digits) {
  const digits_with_zero = new Map()
  const max_exp = (new Toset(Array.from(significant_digits.keys()).map(BigInt))).max()
  for (let i = max_exp; i >= 0n; i--) {
    if (significant_digits.has(i.toString())) {
      digits_with_zero.set(i.toString(), significant_digits.get(i.toString()))
    } else {
      digits_with_zero.set(i.toString(), 0n)
    }
  }
  return digits_with_zero
}

/**
 * Remove insignificant zeros
 * @param {Map<string, bigint>} significant_digits 
 * @returns {Map<string, bigint>}
 */
function remove_zeros(significant_digits) {
  const new_significant_digits = new Map()

  const exponents = Array.from(significant_digits.keys()).map(BigInt)
  const exponent_toset = new Toset(exponents)

  let curr_exp = exponent_toset.take()
  while (curr_exp !== undefined) {
    const string_exp = curr_exp.toString()
    const value = significant_digits.get(string_exp)
    if (value == 0) {
      significant_digits.delete(string_exp)
    }
    curr_exp = exponent_toset.take()
  }

  return new_significant_digits
}

/**
 * Represents numbers as a polynomial defined by exponents and significands of a certain base
 */
class NumberBaseN {
  /**
   * @type {bigint}
   */
  base
  /**
   * @type {Map<number,bigint>}
   */
  significant_digits
  /**
   * @type {(bigint, bigint) => [bigint, bigint]}
   */
  exponent_significand

  /**
   * Generates a polynomial representation of value in base
   * @param {bigint} value value to convert
   * @param {bigint} base base to convert representation
   */
  constructor(value, base, exponent_significand=exponent_significand_pow) {
    if (typeof value === 'number' || (typeof value === 'bigint')) {
      this.significant_digits = generate_significant_digits(value, base, exponent_significand)
    }
    if (typeof value === 'object' && value instanceof Map) {
      this.significant_digits = value
    }

    this.base = base
    this.exponent_significand = exponent_significand
  }

  /**
   * Returns a map with all zeros necessary to print all placeholders
   * @returns {Map<string, bigint}
   */
  getAllDigits() {
    return insert_zeros(this.significant_digits)
  }

  /**
   * Returns a string representation of the digits, optionally with a spacer string
   * XXX out of order printing
   * @param {string} spacer a character or string used to join the various places
   * @returns {string}
   */
  toString(spacer='') {
    return Array.from((this.getAllDigits()).values()).join(spacer)
  }

  /**
   * Returns the value as a bigint
   * @returns {bigint}
   */
  valueOf() {
    let value = 0n

    // We actually don't care about order due to the associative property, so we don't use a toset
    for (let [curr_exp, significand] of this.significant_digits) {
      value += significant_value_for_base(this.base, significand, BigInt(curr_exp))
    }

    return value
  }

  /**
   * Returns an expression of values multiplied by the base raised to the correct power
   * @returns {string}
   */
  toExpression() {
    let terms = [];
    const exponents = Array.from(this.significant_digits.keys()).map(BigInt)
    const exponent_toset = new Toset(exponents, dsc)
    let curr_exp = exponent_toset.take()
    while (curr_exp !== undefined) {
      const significand = this.significant_digits.get(curr_exp.toString())
      terms.push(term(significand, this.base, curr_exp))
      curr_exp = exponent_toset.take()
    }
    return terms.join(' + ')
  }

  /**
   * This converts a number from one base into another base
   * @returns {NumberBaseN}
   */
  toBase(base) {
    return new NumberBaseN(this.valueOf(), base)
  }

  /**
   * Computes the base16 string representation of the number.
   * @returns {string}
   */
  toBase16() {
    const b16 = this.toBase(16n).getAllDigits()
    const b16Array = Array.from(b16.values())
    const length_offset = (b16Array.length) % 2
    if(length_offset > 0) {
      for(let i = 0; i < length_offset; i++) {
        b16Array.unshift(0)
      }
    }
    return b16Array.map((value)=>BASE16_ELEMENTS[value]).join('')
  }

  /**
   * Computes the base64 representation of the number.
   * @returns {string}
   */
  toBase64() {
    const b2 = this.toBase(2n).getAllDigits()
    const b2Array = Array.from(b2.values())
    const b64Array = []

    const padding_offset = (b2Array.length) % 24
    if (padding_offset > 0) {
      for (let i = 0; i < 24 - padding_offset; i++) { b2Array.push(0n) }
    }

    const length = BigInt(b2Array.length/6)
    for (let i = 0n; i < length; i++) {
      let value = 0n
      let current_bits = []
      for (let j = 0n; j < 6n; j++) {
        current_bits.push(b2Array[(i * 6n + j)])
        value += b2Array[i * 6n + j] * 2n ** (5n-j)
      }
      b64Array[i] = BASE64_ELEMENTS[value]
    }

    return b64Array.join('')
  }

}

//const value = 160000000000001n
const value = 286386577668298411128469151667598498812366n // Ninth Dedekind Number: https://arxiv.org/abs/2304.00895, https://arxiv.org/abs/2304.03039
const base = 2n // Note, storing numbers in base 2 is wasteful since under the hood a full float is being used to store the digit

for(let i = base; i < (512)+1; i++) {
  const num = new NumberBaseN(value, i)
  // console.log(num.valueOf())
  console.log('base', i, 'digits', num.toString('').length)
  // console.log(num.toExpression())
  // console.log(`0b${num.toBase(2n).toString()}`)
  // console.log(`0x${num.toBase16()}`)
  // console.log(num.toBase64())
}

// This works:
// const testAscSet = new Toset([10n,5n,4n,3n,2n,1n,0n])
// console.log(testAscSet)
// console.log(testAscSet.take())
// console.log(testAscSet)
// testAscSet.insert(2n)
// console.log(testAscSet)
// console.log(testAscSet.take())
// console.log(testAscSet.max())
// console.log(testAscSet.min())
// console.log(testAscSet.has(10n))

// const testDscSet = new Toset([2n,3n,1n,0n], descending)
// console.log(testDscSet)
// console.log(testDscSet.take())
// console.log(testDscSet.max())
// console.log(testDscSet.min())

// const a = new Map([['1',7n], ['2', 9n] ])
// const b = new Map([['1',7n], ['3', 8n] ])
// const c = add_significant_digits(a, b, 10n)
// console.log(c)


  ////////////////////////////
 /// # GRAVEYARD OF IDEAS ///
////////////////////////////

// # exponent_significand
//
// The following no longer applies, since moving to bigint only code:
// `exponent_significand_pow` may have errors as floating point errors accumulate.
// Perhaps I could use a better floating point sum?
// This has a particularly bad time with (16000000000001, 3.1) while using
// `exponent_significand_pow`
// Because of floating points errors, sometimes this struggles while using
// `exponent_significand_add` and `exponent_significand_log`
//
// /**
//  * Computes the significand and exponent for the current term place of the number.
//  *
//  * This is being kept around for informational purposes, but, in reality, doing this much
//  * repeated division with numerical algorithms is not a great idea.
//  *
//  * @param {bigint} value 
//  * @param {bigint} base 
//  * @returns 
//  */
// function exponent_significand_naive(value, base) {
//   let remainder = value
//   let exponent = 0n
//   do {
//     remainder = remainder / base
//     exponent++
//   } while (remainder > base - 1n)
//   return [remainder, exponent];
// }
//
// /**
//  * Computes the significand and exponent for the current term place of the number.
//  * This is faster than other versions, but introduces some error in the portion we discard
//  * Also, for large enough numbers, this will introduce floating point errors unless we could
//  *  use a multiple precision floating point library
//  * XXX: Seems to have errors in base 10
//  * XXX: Need to write own log function since log doesn't work with bigint
//  */
// function exponent_significand_log(value, base) {
//   let result = Math.log(value)/Math.log(base)
//   let exponent = Math.floor(result)
//   return [Math.pow(base, result - exponent), exponent]
// }
//
// # Uncomment to prove that using log is faster than repeated division
//
// const test_iterations = 1000000
// let exponent = 0
// let significand = 0
//
// const naive_start_time = new Date()
// for(let i = 0; i < test_iterations; i++) {
//   [significand, exponent] = exponent_significand_naive(value, base)
// }
// const naive_end_time = new Date()
// console.log((+naive_end_time - +naive_start_time)/1000, exponent, significand)
//
// const pow_start_time = new Date()
// for(let i = 0; i < test_iterations; i++) {
//   [significand, exponent] = exponent_significand_pow(value, base)
// }
// const pow_end_time = new Date()
// console.log((+pow_end_time - +pow_start_time)/1000, exponent, significand)
//
// const log_start_time = new Date()
// for(let i = 0; i < test_iterations; i++) {
//   [significand, exponent] = exponent_significand_log(value, base)
// }
// const log_end_time = new Date()
// console.log((+log_end_time - +log_start_time)/1000, exponent, significand)


// # toBase(N)
//
// This is an interesting problem to do one significant digit at a time,
// especially since:
//  - a smaller base creates more terms per original term
//  - a larger base creates fewer terms per original term
//  - in both cases it's possible that multiple original terms need to be
//    looked at per new term
//
// Let's try converting each term into other terms in the new base, then
// summing over all terms with the same power.
//
// Currently there are a few errors probably due to some kind of rounding error and the conversion method.
//
// Try converting the object to a single bigint and then call the constructor, that might be more efficient, too.
//
// Correct:
// 0b11101000110101001010010100001111110000000001
// 0x0E8D4A510001
//
// Incorrect (polynomial expansion is correct):
// 45*49^0 + 39*49^1 + 1*49^2 + 20*49^3 + 6*49^4 + 47*49^5 + 28*49^6 + 23*49^7
// 0b11101000110101001010010100001111000000000001
// 0x0E8D4A50F001
//
// 45*53^0 + 4*53^1 + 12*53^2 + 41*53^3 + 32*53^4 + 46*53^5 + 32*53^6 + 13*53^7
// 0b11101000110101001010010100001111111100000001
// 0x0E8D4A50FF01
//
// let new_significant_digits = new Map()
// const exponents = Array.from(this.significant_digits.keys()).map(bigint)
// const exponent_toset = new Toset(exponents)
//
// let curr_exp = exponent_toset.take()
// while (curr_exp !== undefined) {
//   const string_exp = curr_exp.toString()
//   const original_digit = this.significant_digits.get(string_exp)
//   const temp_digits = generate_significant_digits(
//     significant_value_for_base(this.base, original_digit, curr_exp),
//     base,
//     this.exponent_significand
//   )
//   new_significant_digits = add_significant_digits(new_significant_digits, temp_digits, base)
//   curr_exp = exponent_toset.take()
// }
// const newNumb = new NumberBaseN(new_significant_digits, base)
