
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
 * @return {BalancerSim}  
 */
function tick(balancerState) {
	/**@type {Map<string, OutputState[]>} */
	const incoming = new Map()
	for (let i = 0; i < balancerState.inputs.length; i++) {
		const input = balancerState.inputs[i];
		const target = incoming.get(input.route.target)
		if (target) {
			target.push(input.state)
		} else {
			incoming.set(input.route.target, [input.state])
		}
	}
	for (const splitter of balancerState.sNodes) {
		const outs = []
		if (splitter.outA) outs.push(splitter.outA)
		if (splitter.outB) outs.push(splitter.outB)
		outs.forEach(out=>{
			const target = incoming.get(out.route.target)
			if (target) {
				target.push(...out.state)
			} else {
				incoming.set(out.route.target, Array.from(out.state))
			}
		})
	}

	// !!!!!!!!!!!!!!!!!!!!!!!!---------------------------- WIP --------------------------------------!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	const newSplitterStates = balancerState.sNodes.map(node => {
		const allInFlow = incoming.get(node.id)
		if (!allInFlow) {
			const newNode = {id:node.id}
			if (node.outA) newNode.outA = structuredClone(node.outA)
			if (node.outB) newNode.outA = structuredClone(node.outB)
			return newNode
		}

		/**@type {Map<string, Fraction>} */
		const compressedInFlow = new Map()
		for (const inFlow of allInFlow) {
			console.log('help')
			const exists = compressedInFlow.get(inFlow.id)
			if (exists) {
				exists.add(inFlow.amount)
			} else {
				
			}
		}
	})
	return balancerState;
}


console.log(init(JSON.parse(`{"inputs":[{"target":"b:0","slot":1}],"sNodes":[{"id":"b:0","outA":{"target":"output","slot":1},"outB":{"target":"output","slot":2}}]}`)))

