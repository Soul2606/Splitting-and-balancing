
console.log('simulation.js')


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

	constructor(num=0, den=1) {
		this.num = num
		this.den = den
	}

	add(value){
		if (value instanceof Fraction) {
			this.num += this.den * value.num
			this.den *= value.den
		} else if (typeof value === 'number') {
			this.num += this.den * value
		}
		return this
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
function init(balancer) {
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
        : undefined
    }))
  };
}





/**
 * @param {BalancerSim} balancerState 
 * @return {{state:BalancerSim, output:OutputState[]}}  
 */
function tick(balancerState) {

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
		const newNode = {id:node.id}
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
				exists.add(inFlow.amount)
			} else {
				compressedInFlow.set(inFlow.id, Fraction.from(inFlow.amount))
			}
		}
		return compressedInFlow
	}


	/**@type {Map<string, OutputState[]>} */
	const incoming = new Map()

	// Collect input flows
	for (const input of balancerState.inputs) {
		const arr = incoming.get(input.route.target);
		if (arr) arr.push(input.state);
		else incoming.set(input.route.target, [input.state]);
	}

	for (const node of balancerState.sNodes) {
		for (const out of getOuts(node)) {
			const arr = incoming.get(out.route.target)
			if (arr) arr.push(...out.state)
			else incoming.set(out.route.target, Array.from(out.state))
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
		return newNode
	})

	return {
		state:{
			inputs:balancerState.inputs,
			sNodes:newSplitterStates
		},
		output:incoming.get('output') ?? []
	}
}


const initState = init(JSON.parse(`{"inputs":[{"target":"b:0","slot":1}],"sNodes":[{"id":"b:0","outA":{"target":"output","slot":1},"outB":{"target":"output","slot":2}}]}`))
let state = initState
console.log(state)
for (let i = 0; i < 10; i++) {
	const result = tick(state)
	state = result.state
	console.log('output', result.output, '\nstate', result.state)
}
