

/**
 * returns alphabetical sequence like Excel columns
 * 0 -> a, 1 -> b, ..., 25 -> z, 26 -> aa, ...
 * @param {number} n 
 * @returns {string}
 */
function letterAlpha(n) {
	if (!Number.isFinite(n) || n < 0) return '';

	const alphabet = 'abcdefghijklmnopqrstuvwxyz';
	let result = '';

	n = Math.floor(n);

	while (n >= 0) {
		result = alphabet[n % 26] + result;
		n = Math.floor(n / 26) - 1;
	}

	return result;
}




class Fraction {
	static from(value){
		if (typeof value === 'number') {
			return new Fraction(value, 1)
		} else if (value instanceof Fraction) {
			return new Fraction(value.num, value.den)
		}
		return new Fraction()
	}

	static sum(fractions){
		if (fractions.length === 0) {
			return new Fraction()
		}
		const s = new Fraction()
		for (const f of fractions) {
			s.add(f)
		}
		return s
	}

	#LIMIT

	constructor(num=0, den=1) {
		this.num = num
		this.den = den
		this.#LIMIT = 1e12
	}

	gcd(){
		let a = this.num
		let b = this.den
		a = Math.abs(a);
		b = Math.abs(b);
		while (b !== 0) { const t = b;
			b = a % b;
			a = t;
			} 
		return a;	
	}

	reduce() {
		// Infinity / Infinity → treat as 0/1
		if (!Number.isFinite(this.num) && !Number.isFinite(this.den)) {
			this.num = 0;
			this.den = 1;
			return this;
		}

		// Infinity / finite → Infinity
		if (!Number.isFinite(this.num)) {
			this.num = Infinity;
			this.den = 1;
			return this;
		}

		// finite / Infinity → 0/1
		if (!Number.isFinite(this.den)) {
			this.num = 0;
			this.den = 1;
			return this;
		}

		// Normal finite case
		const g = this.gcd();
		this.num /= g;
		this.den /= g;

		// Keep denominator positive
		if (this.den < 0) {
			this.den = -this.den;
			this.num = -this.num;
		}

		// >LIMIT / >LIMIT → tone down at the cost of accuracy
		if (this.num > this.#LIMIT && this.den > this.#LIMIT) {
			const f = Math.max(this.num / 10000, this.den / 10000)
			this.num = Math.ceil(this.num / f)
			this.den = Math.ceil(this.den / f)
			return this
		}

		return this;
	}


	add(value) {
		if (value instanceof Fraction) {
			this.num = this.num * value.den + this.den * value.num;
			this.den = this.den * value.den;
		} else if (typeof value === 'number') {
			this.num = this.num + this.den * value;
		}
		return this;
	}

	subtract(value){
		if (value instanceof Fraction) {
			this.num -= this.den * value.num
			this.den *= value.den
		} else if (typeof value === 'number') {
			this.num -= this.den * value
		}
		return this
	}

	multiply(value){
		if (value instanceof Fraction) {
			this.num *= value.num
			this.den *= value.den
		} else if (typeof value === 'number') {
			this.num *= value
		}
		return this
	}

	divide(value){
		if (value instanceof Fraction) {
			this.num *= value.den
			this.den *= value.num
		} else if (typeof value === 'number') {
			this.den *= value
		}
		return this
	}

	greaterThan(value){
		const other = Fraction.from(value)
		const thisS  = this.num * other.den
		const otherS = other.num * this.den
		return thisS > otherS
	}

	lessThan(value){
		const other = Fraction.from(value)
		const thisS  = this.num * other.den
		const otherS = other.num * this.den
		return thisS < otherS
	}

	toStr(){
		return `${this.num}/${this.den}`
	}
}




/**
 * @typedef {object} Route
 * @property {string} target
 * @property {number} slot
*/
/**
 * @typedef {object} SplitterNode
 * @property {string} id
 * @property {Route} [outA]
 * @property {Route} [outB]
*/
/**
 * @typedef {object} Balancer
 * @property {Route[]} inputs
 * @property {SplitterNode[]} sNodes
*/
/*
Example:
{
	inputs:[
		{target:'b:1', slot:1}
	],
	sNodes:[
		{
			id:'b:1',
			outA:{target:'output', slot:1},
			outA:{target:'output', slot:2},
		}
	]
}
*/

/**
 * @typedef {object} OutputState
 * @property {string} id
 * @property {Fraction} amount
*/
/**
 * @typedef {object} SplitterNodeState
 * @property {string} id
 * @property {{route:Route, state:OutputState[]}} [outA]
 * @property {{route:Route, state:OutputState[]}} [outB]
 * @property {OutputState[]} input
*/
/**
 * @typedef {object} BalancerSim
 * @property {Array<{route:Route, state:OutputState}>} inputs
 * @property {SplitterNodeState[]} sNodes
*/




/**
 * @param {Balancer} balancer 
 * @returns {BalancerSim}
 */
export function init(balancer) {
  return {
    inputs: balancer.inputs.map((route, idx) => ({
      route,
      state: { id: letterAlpha(idx), amount: new Fraction(1) }
    })),

    sNodes: balancer.sNodes.map(node => ({
      id: node.id,
      outA: node.outA
        ? { route: node.outA, state: [] }
        : undefined,
      outB: node.outB
        ? { route: node.outB, state: [] }
        : undefined,
		input: [],
    }))
  };
}





/**
 * @typedef {Object.<number, Object.<string, Fraction>>} OutputMap
 *    Maps output slots to compressed output objects.
*/



/**
 * @param {BalancerSim} balancerState 
 * @return {{state:BalancerSim, output:OutputMap}}  
 */
export function tick(balancerState) {

	/**
	 * @param {OutputState} outState 
	 * @returns {OutputState}
	 */
	const cloneOutState = (outState)=>{
		return {
			id:outState.id,
			amount:Fraction.from(outState.amount)
		}
	}

	/**
	 * @param {SplitterNodeState} node 
	 * @returns {SplitterNodeState}
	 */
	const cloneNode = (node) => {
		const newNode = {id:node.id, input:node.input}
		if (node.outA) {
			newNode.outA = {
				route:structuredClone(node.outA.route),
				state:node.outA.state.map(cloneOutState)
			}
		}
		if (node.outB) {
			newNode.outB = {
				route:structuredClone(node.outB.route),
				state:node.outB.state.map(cloneOutState)
			}
		}
		return newNode
	}

	/**
	 * @param {SplitterNodeState} node 
	 * @returns 
	 */
	const getOuts = (node) => {
		const outs = []
		if (node.outA) outs.push(node.outA)
		if (node.outB) outs.push(node.outB)
		return outs
	}

	/**
	 * @param {OutputState[]} allInFlow 
	 */
	const compress = (allInFlow) => {
		/**@type {Map<string, Fraction>} */
		const compressedInFlow = new Map()
		for (const inFlow of allInFlow) {
			const exists = compressedInFlow.get(inFlow.id)
			if (exists) {
				exists.add(inFlow.amount).reduce()
			} else {
				compressedInFlow.set(inFlow.id, Fraction.from(inFlow.amount))
			}
		}
		return compressedInFlow
	}


	/**@type {Map<string, OutputState[]>} */
	const incoming = new Map()

	/** Map      <slot,   state[]>
	 * @type {Map<number, OutputState[]>} */
	const toOutput = new Map()

	function addFlow(route, states) {
		const map = route.target === "output" ? toOutput : incoming;
		const key = route.target === "output" ? route.slot : route.target;
		
		const arr = map.get(key);
		if (arr) arr.push(...states);
		else map.set(key, [...states]);
	}

	// Collect input flows
	for (const input of balancerState.inputs) {
		addFlow(input.route, [cloneOutState(input.state)])
	}

	for (const node of balancerState.sNodes) {
		for (const out of getOuts(node)) {
			addFlow(out.route, out.state.map(cloneOutState))
		}
	}


	const newSplitterStates = balancerState.sNodes.map(node => {
		const allInFlow = incoming.get(node.id)
		if (!allInFlow) {
			return cloneNode(node)
		}

		const compressedInFlow = compress(allInFlow)

		const newNode = cloneNode(node)
		const outs = getOuts(newNode)
		for (const out of outs) {
			out.state = Array.from(compressedInFlow).map(([key,val]) => {
				return {
					id:key,
					amount:Fraction.from(val).divide(outs.length)
				}
			})
		}
		newNode.input = [...allInFlow]
		return newNode
	})

	return {
		state:{
			inputs:balancerState.inputs,
			sNodes:newSplitterStates
		},
		output:Object.fromEntries(Array.from(toOutput).map(([key, val])=>
			[key, Object.fromEntries(compress(val))]
		))
	}
}


/*
const initState = init(JSON.parse(`{"inputs":[{"target":"b:0","slot":1}],"sNodes":[{"id":"b:0","outA":{"target":"output","slot":1},"outB":{"target":"output","slot":2}}]}`))
let state = initState
console.log(state)
for (let i = 0; i < 10; i++) {
	const result = tick(state)
	state = result.state
	console.log('output', result.output, '\nstate', result.state)
}
*/
